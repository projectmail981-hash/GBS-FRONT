import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class CustomerService {

  private apiUrl = 'https://garage-billing-backend-production.up.railway.app/customers';

  constructor(private http: HttpClient) { }

  getCustomers() {
  return this.http.get<any[]>(this.apiUrl);
}

  getCustomer(id: number) {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  addCustomer(data: any) {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  updateCustomer(id: number, data: any) {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  deleteCustomer(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
