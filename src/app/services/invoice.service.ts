import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {

  private apiUrl = "https://garage-billing-backend-production.up.railway.app/invoices";

  constructor(private http: HttpClient) {}

  getInvoices() {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(invoices => invoices.map(inv => ({
        ...inv,
        invoice_number: `INV-${String(inv.invoice_id).padStart(4, '0')}`
      })))
    );
  }

  getInvoice(id: number) {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(inv => ({
        ...inv,
        invoice_number: `INV-${String(inv.invoice_id).padStart(4, '0')}`
      }))
    );
  }

  createInvoice(data: any) {
    return this.http.post(`${this.apiUrl}/create`, data);
  }

  updateInvoice(id: number, data: any) {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  deleteInvoice(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  receivePayment(id:number,data:any){
    return this.http.put(`${this.apiUrl}/payment/${id}`, data);
  }

}
