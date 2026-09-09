import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface InventoryItem {
  part_id?: number;
  part_name: string;
  category: string;
  stock_quantity: number;
  unit_price: number;
  mrp: number;
  selling_price: number;
  supplier: string;
  date?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private apiUrl = 'https://garage-billing-backend-production.up.railway.app/inventory';

  constructor(private http: HttpClient) { }

  getInventory(): Observable<InventoryItem[]> {
    return this.http.get<InventoryItem[]>(this.apiUrl);
  }

  getPart(id: number): Observable<InventoryItem> {
    return this.http.get<InventoryItem>(`${this.apiUrl}/${id}`);
  }

  addPart(part: InventoryItem): Observable<any> {
    return this.http.post(this.apiUrl, part);
  }

  updatePart(id: number, part: InventoryItem): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, part);
  }

  deletePart(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
