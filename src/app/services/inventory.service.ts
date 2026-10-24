import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private apiUrl = 'https://garage-billing-backend-lyjb.onrender.com/inventory';

  constructor(private http: HttpClient) { }

  private normalizeItem(item: any): InventoryItem {
    return {
      ...item,
      stock_quantity: Number(item.stock_quantity ?? 0),
      unit_price: Number(item.unit_price ?? 0),
      mrp: Number(item.mrp ?? 0),
      selling_price: Number(item.selling_price ?? 0)
    };
  }

  getInventory(): Observable<InventoryItem[]> {
    return this.http.get<InventoryItem[]>(this.apiUrl).pipe(
      map(items => (items || []).map(item => this.normalizeItem(item)))
    );
  }

  getPart(id: number): Observable<InventoryItem> {
    return this.http.get<InventoryItem>(`${this.apiUrl}/${id}`).pipe(
      map(item => this.normalizeItem(item))
    );
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
