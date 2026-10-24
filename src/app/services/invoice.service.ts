import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {

  private apiUrl = "https://garage-billing-backend-lyjb.onrender.com/invoices";

  constructor(private http: HttpClient) {}

  private isValidNumber(val: any): boolean {
    if (val === null || val === undefined || val === '' || val === 'NaN') {
      return false;
    }
    return Number.isFinite(Number(val));
  }

  private normalizeInvoiceDetail(inv: any): any {
    if (!inv) return inv;

    const services = inv.services || [];
    const parts = inv.parts || [];

    const servicesSum = services.reduce((sum: number, s: any) => sum + (Number(s.total_amount) || 0), 0);
    const partsSum = parts.reduce((sum: number, p: any) => sum + (Number(p.total_amount) || 0), 0);
    const computedSubtotal = servicesSum + partsSum;

    const tax = this.isValidNumber(inv.tax) ? Number(inv.tax) : 0;
    const paid = this.isValidNumber(inv.paid_amount) ? Number(inv.paid_amount) : 0;

    const subtotal = this.isValidNumber(inv.subtotal)
      ? Number(inv.subtotal)
      : computedSubtotal;

    const total = this.isValidNumber(inv.total_amount)
      ? Number(inv.total_amount)
      : subtotal + tax;

    const balance = this.isValidNumber(inv.balance_amount)
      ? Number(inv.balance_amount)
      : Math.max(0, total - paid);

    return {
      ...inv,
      invoice_number: `INV-${String(inv.invoice_id).padStart(4, '0')}`,
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      total_amount: total.toFixed(2),
      paid_amount: paid.toFixed(2),
      balance_amount: balance.toFixed(2)
    };
  }

  getInvoices() {
    return this.http.get<any[]>(this.apiUrl).pipe(
      switchMap(invoices => {
        const list = invoices || [];
        const calls = list.map(inv => {
          const formatted = {
            ...inv,
            invoice_number: `INV-${String(inv.invoice_id).padStart(4, '0')}`
          };

          // If backend returned NaN for total_amount or balance_amount, compute from detail items
          if (!this.isValidNumber(inv.total_amount) || !this.isValidNumber(inv.balance_amount)) {
            return this.getInvoice(inv.invoice_id).pipe(
              map(detail => ({
                ...formatted,
                subtotal: detail.subtotal,
                total_amount: detail.total_amount,
                paid_amount: detail.paid_amount,
                balance_amount: detail.balance_amount
              })),
              catchError(() => of({
                ...formatted,
                subtotal: '0.00',
                total_amount: '0.00',
                paid_amount: this.isValidNumber(inv.paid_amount) ? Number(inv.paid_amount).toFixed(2) : '0.00',
                balance_amount: '0.00'
              }))
            );
          }

          return of(formatted);
        });

        return calls.length > 0 ? forkJoin(calls) : of([]);
      })
    );
  }

  getInvoice(id: number) {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(inv => this.normalizeInvoiceDetail(inv))
    );
  }

  createInvoice(data: any) {
    return this.http.post<any>(`${this.apiUrl}/create`, data).pipe(
      switchMap(res => {
        if (!res?.invoice_id) {
          return of(res);
        }
        // Verify and self-heal if backend stored NaN
        return this.getInvoice(res.invoice_id).pipe(
          switchMap(detail => {
            return this.updateInvoice(res.invoice_id, {
              subtotal: Number(detail.subtotal),
              total_amount: Number(detail.total_amount),
              paid_amount: Number(detail.paid_amount)
            }).pipe(
              map(() => res),
              catchError(() => of(res))
            );
          }),
          catchError(() => of(res))
        );
      })
    );
  }

  updateInvoice(id: number, data: any) {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  deleteInvoice(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  receivePayment(id: number, data: any) {
    return this.http.put(`${this.apiUrl}/payment/${id}`, data);
  }

}
