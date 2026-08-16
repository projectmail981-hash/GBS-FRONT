import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class JobCardService {

  private apiUrl = "https://garage-billing-backend-production.up.railway.app/jobcards";

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
    return this.http.post('https://garage-billing-backend-production.up.railway.app/jobservices', service);
  }

  addJobPart(part: any) {
    return this.http.post('https://garage-billing-backend-production.up.railway.app/jobparts', part);
  }

  toggleServiceStatus(id: number, isCompleted: boolean) {
    return this.http.put(`https://garage-billing-backend-production.up.railway.app/jobservices/${id}/toggle-status`, { is_completed: isCompleted });
  }

  togglePartStatus(id: number, isCompleted: boolean) {
    return this.http.put(`https://garage-billing-backend-production.up.railway.app/jobparts/${id}/toggle-status`, { is_completed: isCompleted });
  }

  deleteJobPart(id: number) {
    return this.http.delete(`https://garage-billing-backend-production.up.railway.app/jobparts/${id}`);
  }

}
