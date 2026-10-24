import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class VehicleService {

  private apiUrl = "https://garage-billing-backend-lyjb.onrender.com/vehicles";

  constructor(private http: HttpClient) {}

  getAllVehicles() {
    return this.http.get<any[]>(this.apiUrl);
  }

  getVehiclesByCustomer(customerId: number) {
    return this.http.get<any[]>(`${this.apiUrl}/customer/${customerId}`);
  }

  addVehicle(data: any) {
    return this.http.post<any>(this.apiUrl, data);
  }

}
