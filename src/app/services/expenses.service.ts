import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, combineLatest, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ExpensesService {
  private baseUrl = 'https://garage-billing-backend-lyjb.onrender.com';

  constructor(private http: HttpClient) {}

  private getStartOfCurrentWeek(now: Date): Date {
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday, 0, 0, 0, 0);
  }

  private getStartOfCurrentMonth(now: Date): Date {
    return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  }

  getExpenses(): Observable<any> {
    return combineLatest({
      inventory: this.http.get<any[]>(`${this.baseUrl}/inventory`).pipe(catchError(() => of([]))),
      jobParts: this.http.get<any[]>(`${this.baseUrl}/jobparts`).pipe(catchError(() => of([])))
    }).pipe(
      map(({ inventory, jobParts }) => {
        const invList = [...(inventory || [])].sort((a, b) => {
          const dA = new Date(a.created_at || a.date || 0).getTime();
          const dB = new Date(b.created_at || b.date || 0).getTime();
          return dB - dA || (Number(b.part_id) - Number(a.part_id));
        });

        // Calculate used quantity per inventory part_id from job_parts
        const usedQtyByPartId = new Map<number, number>();
        const unmatchedByName = new Map<string, number[]>();

        for (const jp of jobParts || []) {
          const qty = Number(jp.quantity || 0);
          if (qty <= 0) continue;

          if (jp.part_id != null) {
            const pid = Number(jp.part_id);
            usedQtyByPartId.set(pid, (usedQtyByPartId.get(pid) || 0) + qty);
          } else if (jp.part_name) {
            const key = String(jp.part_name).trim().toLowerCase();
            const list = unmatchedByName.get(key) || [];
            list.push(qty);
            unmatchedByName.set(key, list);
          }
        }

        // If job_parts didn't include part_id, match each job_part entry to inventory items by part_name
        if (unmatchedByName.size > 0) {
          for (const item of invList) {
            const pid = Number(item.part_id);
            if (usedQtyByPartId.has(pid)) continue;
            const key = String(item.part_name || '').trim().toLowerCase();
            const queue = unmatchedByName.get(key);
            if (queue && queue.length > 0) {
              const matchedQty = queue.shift()!;
              usedQtyByPartId.set(pid, matchedQty);
            }
          }
        }

        const now = new Date();
        const startOfWeek = this.getStartOfCurrentWeek(now);
        const startOfMonth = this.getStartOfCurrentMonth(now);

        let weeklyExpenses = 0;
        let monthlyExpenses = 0;

        const items = invList.map(item => {
          const pid = Number(item.part_id);
          const shelfQty = Math.max(0, Number(item.stock_quantity || 0));
          const usedQty = usedQtyByPartId.get(pid) || 0;
          const totalQty = shelfQty + usedQty;
          const unitPrice = Number(item.unit_price || 0);
          const totalExpense = totalQty * unitPrice;

          const rawDate = item.created_at || item.date;
          const itemDate = rawDate ? new Date(rawDate) : null;

          if (itemDate && !isNaN(itemDate.getTime())) {
            if (itemDate >= startOfWeek) {
              weeklyExpenses += totalExpense;
            }
            if (itemDate >= startOfMonth) {
              monthlyExpenses += totalExpense;
            }
          }

          return {
            ...item,
            stock_quantity: totalQty,
            unit_price: unitPrice.toFixed(2),
            total_expense: totalExpense.toFixed(2)
          };
        });

        return {
          summary: {
            weeklyExpenses,
            monthlyExpenses
          },
          items
        };
      })
    );
  }
}
