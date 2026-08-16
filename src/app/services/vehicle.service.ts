import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class VehicleService {

  private apiUrl = "https://garage-billing-backend-production.up.railway.app/vehicles";

  constructor(private http: HttpClient) {}

  getVehiclesByCustomer(customerId: number) {
    return this.http.get<any[]>(`${this.apiUrl}/customer/${customerId}`);
  }

}
