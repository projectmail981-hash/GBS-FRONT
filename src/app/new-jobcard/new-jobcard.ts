import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CustomerService } from '../services/customer.service';
import { VehicleService } from '../services/vehicle.service';
import { JobCardService } from '../services/job-card.service';

interface Customer {
  customer_id: number;
  customer_name: string;
}

interface Vehicle {
  vehicle_id: number;
  vehicle_number?: string;
  brand?: string;
  model?: string;
}

interface LineItem {
  id: string;
  name: string;
  type: 'Service' | 'Part';
  qty: number;
  rate: number;
  amount: number;
}

interface JobCardPayload {
  customer_id: number;
  vehicle_id: number;
  service_date: string;
  odometer_reading: number;
  status: 'Open' | 'In Progress' | 'Completed';
  notes: string;
  services: Array<{
    service_name: string;
    quantity: number;
    labour_charge: number;
    total_amount: number;
  }>;
  parts: Array<{
    part_name: string;
    quantity: number;
    unit_price: number;
    total_amount: number;
  }>;
}

@Component({
  selector: 'app-new-jobcard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './new-jobcard.html',
  styleUrl: './new-jobcard.css'
})
export class NewJobcard implements OnInit {
  customers: Customer[] = [];
  vehicles: Vehicle[] = [];

  selectedCustomer = '';
  selectedCustomerId?: number;
  selectedVehicleId?: number;

  serviceDate = '';
  odometer = '';
  vehicleReg = '';
  vehicleModel = '';
  vehicleRegError = '';
  // Retained for the current template's invoice-status binding; job cards use
  // jobCardStatus when they are sent to the backend.
  status: 'Unpaid' | 'Paid' | 'Partial' = 'Unpaid';
  jobCardStatus: 'Open' | 'In Progress' | 'Completed' = 'Open';
  notes = '';

  services: LineItem[] = [];
  parts: LineItem[] = [];

  newServiceName = '';
  newServiceQty = 1;
  newServiceAmount = 0;
  newPartName = '';
  newPartQty = 1;
  newPartAmount = 0;
  showServiceForm = false;
  showPartForm = false;
  isSaving = false;

  constructor(
    private router: Router,
    private customerService: CustomerService,
    private vehicleService: VehicleService,
    private jobCardService: JobCardService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.serviceDate = new Date().toISOString().slice(0, 10);
    this.loadCustomers();
  }

  get amount(): number {
    return [...this.services, ...this.parts].reduce(
      (total, item) => total + this.toNumber(item.amount),
      0
    );
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  loadCustomers(): void {
    
    this.customerService.getCustomers().subscribe({
      next: (data: Customer[]) => {

        this.customers = data || [];
        this.cdr.detectChanges(); // <-- Added ChangeDetection!
        
      },
      error: (err) => console.error(err)
    });
  }

  onCustomerChange(customerName: string): void {
    this.selectedCustomer = customerName;
    const customer = this.customers.find(
      (item) => item.customer_name === customerName
    );

    this.selectedCustomerId = customer?.customer_id;
    this.selectedVehicleId = undefined;
    this.vehicles = [];
    this.vehicleReg = '';
    this.vehicleModel = '';
    this.vehicleRegError = '';

    if (!customer) {
      return;
    }

    this.vehicleService.getVehiclesByCustomer(customer.customer_id).subscribe({
      next: (data: Vehicle[]) => {
        this.vehicles = Array.isArray(data) ? data : [];
        const vehicle = this.vehicles[0];

        if (!vehicle) {
          return;
        }

        this.selectedVehicleId = vehicle.vehicle_id;
        this.vehicleReg = (vehicle.vehicle_number || '').toUpperCase();
        this.vehicleModel = [vehicle.brand, vehicle.model]
          .filter(Boolean)
          .join(' ');
        this.cdr.detectChanges(); // <-- Added ChangeDetection!
      },
      error: (error: unknown) => {
        console.error('Unable to load vehicles', error);
        alert('Unable to load vehicles for this customer.');
      }
    });
  }

  addService(): void {
    this.showServiceForm = true;
  }

  confirmService(): void {
    const name = this.newServiceName.trim();
    if (!name) {
      return;
    }

    const qty = this.validQuantity(this.newServiceQty);
    const amount = this.nonNegative(this.newServiceAmount);
    this.services.push({
      id: `svc-${Date.now()}-${this.services.length}`,
      name,
      type: 'Service',
      qty,
      rate: amount / qty,
      amount
    });
    this.newServiceName = '';
    this.newServiceQty = 1;
    this.newServiceAmount = 0;
    this.showServiceForm = false;
  }

  removeService(id: string): void {
    this.services = this.services.filter((service) => service.id !== id);
  }

  calculateServiceAmount(service: LineItem): void {
    service.qty = this.validQuantity(service.qty);
    service.rate = this.nonNegative(service.rate);
    service.amount = service.qty * service.rate;
  }

  addPart(): void {
    this.showPartForm = true;
  }

  confirmPart(): void {
    const name = this.newPartName.trim();
    if (!name) {
      return;
    }

    const qty = this.validQuantity(this.newPartQty);
    const amount = this.nonNegative(this.newPartAmount);
    this.parts.push({
      id: `part-${Date.now()}-${this.parts.length}`,
      name,
      type: 'Part',
      qty,
      rate: amount / qty,
      amount
    });
    this.newPartName = '';
    this.newPartQty = 1;
    this.newPartAmount = 0;
    this.showPartForm = false;
  }

  removePart(id: string): void {
    this.parts = this.parts.filter((part) => part.id !== id);
  }

  calculatePartAmount(part: LineItem): void {
    part.qty = this.validQuantity(part.qty);
    part.rate = this.nonNegative(part.rate);
    part.amount = part.qty * part.rate;
  }

  validateVehicleReg(): void {
    this.vehicleRegError = '';
    if (!this.vehicleReg.trim()) {
      return;
    }

    const registration = this.vehicleReg.trim().toUpperCase();
    if (!/^[A-Z]{2}\d{2}[A-Z]{1,3}\d{4}$/.test(registration)) {
      this.vehicleRegError = 'Invalid format. Use TN10YJ1234.';
      return;
    }

    this.vehicleReg = registration;
  }

  saveJobCard(): void {
    if (this.isSaving) {
      return;
    }

    if (!this.selectedCustomerId || !this.selectedVehicleId || !this.serviceDate) {
      alert('Please select a customer with a registered vehicle and service date.');
      return;
    }

    this.validateVehicleReg();
    if (this.vehicleRegError) {
      alert(this.vehicleRegError);
      return;
    }

    if (!this.services.length && !this.parts.length) {
      alert('Please add at least one service or part.');
      return;
    }

    const payload: JobCardPayload = {
      customer_id: this.selectedCustomerId,
      vehicle_id: this.selectedVehicleId,
      service_date: this.serviceDate,
      odometer_reading: this.nonNegative(this.odometer),
      status: this.jobCardStatus,
      notes: this.notes.trim(),
      services: this.services.map((service) => ({
        service_name: service.name,
        quantity: this.validQuantity(service.qty),
        labour_charge: this.nonNegative(service.rate),
        total_amount: this.nonNegative(service.amount)
      })),
      parts: this.parts.map((part) => ({
        part_name: part.name,
        quantity: this.validQuantity(part.qty),
        unit_price: this.nonNegative(part.rate),
        total_amount: this.nonNegative(part.amount)
      }))
    };

    this.isSaving = true;
    this.jobCardService.createJobCard(payload).subscribe({
      next: () => this.router.navigate(['/job-cards']),
      error: (error: unknown) => {
        console.error('Unable to save job card', error);
        this.isSaving = false;
        alert('Unable to save the job card. Please try again.');
      }
    });
  }

  private toNumber(value: unknown): number {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : 0;
  }

  private nonNegative(value: unknown): number {
    return Math.max(0, this.toNumber(value));
  }

  private validQuantity(value: unknown): number {
    return Math.max(1, this.toNumber(value));
  }
}
