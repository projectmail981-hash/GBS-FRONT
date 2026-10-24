import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, combineLatest, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private baseUrl = 'https://garage-billing-backend-lyjb.onrender.com';

  constructor(private http: HttpClient) {}

  private formatInvoices(invoices: any[]): any[] {
    return (invoices || []).map(inv => ({
      ...inv,
      invoice_number: `INV-${String(inv.invoice_id).padStart(4, '0')}`
    }));
  }

  private getStartOfCurrentWeek(now: Date): Date {
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday, 0, 0, 0, 0);
  }

  private getStartOfCurrentMonth(now: Date): Date {
    return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  }

  private getIsoWeek(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  getDashboard(): Observable<any> {
    return combineLatest({
      invoices: this.http.get<any[]>(`${this.baseUrl}/invoices`).pipe(catchError(() => of([]))),
      jobCards: this.http.get<any[]>(`${this.baseUrl}/jobcards`).pipe(catchError(() => of([]))),
      customers: this.http.get<any[]>(`${this.baseUrl}/customers`).pipe(catchError(() => of([]))),
      jobParts: this.http.get<any[]>(`${this.baseUrl}/jobparts`).pipe(catchError(() => of([]))),
      inventory: this.http.get<any[]>(`${this.baseUrl}/inventory`).pipe(catchError(() => of([])))
    }).pipe(
      map(({ invoices, jobCards, customers, jobParts, inventory }) => {
        const now = new Date();
        const startOfWeek = this.getStartOfCurrentWeek(now);
        const startOfMonth = this.getStartOfCurrentMonth(now);

        const sortedInvoices = [...(invoices || [])].sort(
          (a, b) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime()
        );

        const recentInvoices = this.formatInvoices(sortedInvoices.slice(0, 5));
        const pendingInvoices = this.formatInvoices(
          sortedInvoices.filter(
            inv =>
              Number(inv.balance_amount) > 0 ||
              inv.status === 'Unpaid' ||
              inv.status === 'Partial'
          )
        );

        // Compute parts totals per job_id to derive labourRevenue and safe invoice totals
        const partsTotalByJobId = new Map<number, number>();
        for (const jp of jobParts || []) {
          const jId = Number(jp.job_id);
          partsTotalByJobId.set(jId, (partsTotalByJobId.get(jId) || 0) + Number(jp.total_amount || 0));
        }

        let weekRevenue = 0;
        let monthRevenue = 0;
        const weeklyMap = new Map<string, number>();
        const monthlyMap = new Map<number, number>();

        for (const inv of sortedInvoices) {
          const invDate = new Date(inv.invoice_date);
          if (isNaN(invDate.getTime())) continue;
          const rawTotal = Number(inv.total_amount);
          const amount = Number.isFinite(rawTotal) ? rawTotal : 0;
          const invWeek = this.getIsoWeek(invDate);

          if (invDate >= startOfWeek) {
            weekRevenue += amount;
            const dateKey = invDate.toISOString().split('T')[0];
            weeklyMap.set(dateKey, (weeklyMap.get(dateKey) || 0) + amount);
          }

          if (invDate >= startOfMonth) {
            monthRevenue += amount;
            monthlyMap.set(invWeek, (monthlyMap.get(invWeek) || 0) + amount);
          }
        }

        const weeklyChart = Array.from(weeklyMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, total]) => ({ date, total }));

        const monthlyChart = Array.from(monthlyMap.entries())
          .sort(([a], [b]) => a - b)
          .map(([week, total]) => ({ week, total }));

        const labourRevenue = sortedInvoices.reduce((sum, inv) => {
          const rawSubtotal = Number(inv.subtotal ?? inv.total_amount);
          const subtotal = Number.isFinite(rawSubtotal) ? rawSubtotal : 0;
          const jobPartsTotal = partsTotalByJobId.get(Number(inv.job_id)) || 0;
          return sum + Math.max(0, subtotal - jobPartsTotal);
        }, 0);

        const inventoryById = new Map<number, any>();
        const inventoryByName = new Map<string, any>();
        for (const item of inventory || []) {
          if (item.part_id != null) inventoryById.set(Number(item.part_id), item);
          if (item.part_name && !inventoryByName.has(item.part_name.toLowerCase())) {
            inventoryByName.set(item.part_name.toLowerCase(), item);
          }
        }

        const partsRevenue = (jobParts || []).reduce((sum, jp) => {
          const qty = Number(jp.quantity || 0);
          const sellUnit = Number(jp.unit_price || 0);
          const matchedInv =
            (jp.part_id != null ? inventoryById.get(Number(jp.part_id)) : undefined) ||
            (jp.part_name ? inventoryByName.get(String(jp.part_name).toLowerCase()) : undefined);
          const costUnit = matchedInv ? Number(matchedInv.unit_price ?? sellUnit) : sellUnit;
          return sum + qty * (sellUnit - costUnit);
        }, 0);

        const activeJobs = (jobCards || []).filter(jc => jc.status === 'Open').length;
        const totalCustomers = (customers || []).length;

        return {
          weekRevenue,
          monthRevenue,
          labourRevenue,
          partsRevenue,
          activeJobs,
          totalCustomers,
          recentInvoices,
          pendingInvoices,
          weeklyChart,
          monthlyChart
        };
      })
    );
  }

}
