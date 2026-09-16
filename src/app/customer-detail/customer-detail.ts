import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../services/customer.service';
import { VehicleService } from '../services/vehicle.service';
import { JobCardService } from '../services/job-card.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './customer-detail.html',
  styleUrl: './customer-detail.css',
})
export class CustomerDetail implements OnInit {
  customer: any;
  vehicles: any[] = [];
  jobCards: any[] = [];
  loading = true;

  showAddVehicleDialog = false;
  showSuccessDialog = false;
  newlyAddedVehicleId: number | undefined;
  newVehicle = {
    registrationNumber: '',
    type: 'Car',
    fuel: 'Petrol',
    brand: '',
    model: '',
    year: ''
  };

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

  formatRegistrationNumber(event: any): void {
    let value = event.target.value;
    value = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    this.newVehicle.registrationNumber = value;
    event.target.value = value;
  }

  saveNewVehicle(): void {
    if (!this.newVehicle.registrationNumber || !this.newVehicle.brand || !this.newVehicle.model) {
      alert("Please fill all fields");
      return;
    }

    const payload = {
      customer_id: this.customer.customer_id,
      vehicle_number: this.newVehicle.registrationNumber,
      vehicle_type: this.newVehicle.type,
      fuel_type: this.newVehicle.fuel,
      brand: this.newVehicle.brand,
      model: this.newVehicle.model,
      manufacture_year: Number(this.newVehicle.year) || new Date().getFullYear()
    };

    this.vehicleService.addVehicle(payload).subscribe({
      next: (res: any) => {
        if (res && res.vehicle_id) {
          this.newlyAddedVehicleId = res.vehicle_id;
        }
        this.showAddVehicleDialog = false;
        this.showSuccessDialog = true;
        this.loadVehicles(this.customer.customer_id);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        alert('Unable to add vehicle');
      }
    });
  }

  cancelReturn(): void {
    this.showSuccessDialog = false;
  }

  goToNewJobCard(): void {
    this.showSuccessDialog = false;
    this.router.navigate(['/new-job-card'], { 
      queryParams: { 
        vehicleReg: this.newVehicle.registrationNumber,
        customerId: this.customer.customer_id,
        customerName: this.customer.customer_name,
        vehicleModel: `${this.newVehicle.brand} ${this.newVehicle.model}`.trim(),
        vehicleId: this.newlyAddedVehicleId
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
