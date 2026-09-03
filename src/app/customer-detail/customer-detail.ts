import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CustomerService } from '../services/customer.service';
import { VehicleService } from '../services/vehicle.service';
import { JobCardService } from '../services/job-card.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './customer-detail.html',
  styleUrl: './customer-detail.css',
})
export class CustomerDetail implements OnInit {
  customer: any;
  vehicles: any[] = [];
  jobCards: any[] = [];
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private customerService: CustomerService,
    private vehicleService: VehicleService,
    private jobCardService: JobCardService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.goBack();
      return;
    }

    this.customerService.getCustomer(id).subscribe({
      next: (data) => {
        this.customer = data;
        this.loading = false;
        this.loadVehicles(id);
        this.loadJobCards(id);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  loadVehicles(customerId: number): void {
    this.vehicleService.getVehiclesByCustomer(customerId).subscribe({
      next: (data) => {
        this.vehicles = data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  loadJobCards(customerId: number): void {
    this.jobCardService.getJobCards().subscribe({
      next: (data) => {
        this.jobCards = (data || []).filter((jc: any) => jc.customer_id === customerId);
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  goBack(): void {
    this.router.navigate(['/customers']);
  }

  viewJobCard(id: number): void {
    this.router.navigate(['/job-cards', id]);
  }
}
