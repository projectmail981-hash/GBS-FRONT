import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private apiUrl = 'https://garage-billing-backend-production.up.railway.app/dashboard';

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<any> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(data => {
        const formatInvoices = (invoices: any[]) => invoices?.map(inv => ({
          ...inv,
          invoice_number: String(inv.invoice_id).padStart(4, '0')
        })) || [];
        
        return {
          ...data,
          recentInvoices: formatInvoices(data.recentInvoices),
          pendingInvoices: formatInvoices(data.pendingInvoices)
        };
      })
    );
  }

}
