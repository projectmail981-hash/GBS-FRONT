import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class JobCardService {

  private baseUrl = "https://garage-billing-backend-lyjb.onrender.com";
  private apiUrl = `${this.baseUrl}/jobcards`;

  constructor(private http: HttpClient) {}

  createJobCard(data:any){
    return this.http.post(`${this.apiUrl}/create`,data);
  }

  getJobCards(){
    return this.http.get<any[]>(this.apiUrl);
  }

  getJobCard(id:number){
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  updateJobCard(id:number,data:any){
    return this.http.put(`${this.apiUrl}/${id}`,data);
  }

  deleteJobCard(id:number){
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Checklists and modifications
  addJobService(service: any) {
    return this.http.post(`${this.baseUrl}/jobservices`, service);
  }

  addJobPart(part: any) {
    return this.http.post(`${this.baseUrl}/jobparts`, part);
  }

  toggleServiceStatus(id: number, isCompleted: boolean) {
    return this.http.put(`${this.baseUrl}/jobservices/${id}/toggle-status`, { is_completed: isCompleted });
  }

  togglePartStatus(id: number, isCompleted: boolean) {
    return this.http.put(`${this.baseUrl}/jobparts/${id}/toggle-status`, { is_completed: isCompleted });
  }

  deleteJobPart(id: number) {
    return this.http.delete(`${this.baseUrl}/jobparts/${id}`);
  }

}
