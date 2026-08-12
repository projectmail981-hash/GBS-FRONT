import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CustomerService } from '../services/customer.service';

interface Vehicle {
  id: number;
  state: string;
  district: string;
  series: string;
  number: string;
  type: string;
  fuel: string;
  brand: string;
  model: string;
  year: string;
}

@Component({
  selector: 'app-new-customer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './new-customer.html',
  styleUrl: './new-customer.css'
})
export class NewCustomer {

  vehicles: Vehicle[] = [this.createVehicle(1)];

  private nextVehicleId = 2;

  customerName = '';
  phoneNumber = '';
  address = '';

  duplicateError = '';

  showConfirmBottom = false;

  showSuccessDialog = false;

  constructor(
    private customerService: CustomerService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  addVehicle(): void {
    this.vehicles.push(this.createVehicle(this.nextVehicleId++));
  }

  saveCustomer(): void {

    this.duplicateError = '';

    const name = this.customerName.trim();
    const phone = this.phoneNumber.trim();

    if (!name) {
      this.duplicateError = 'Customer name is required.';
      return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      this.duplicateError = 'Enter a valid 10 digit phone number.';
      return;
    }

    this.showConfirmBottom = true;
  }

  cancelCreateCustomer(): void {
    this.showConfirmBottom = false;
  }

  confirmCustomerSave(): void {

    const customerData = {

      customer_name: this.customerName,

      phone: this.phoneNumber,

      address: this.address,

      vehicles: this.vehicles.map(vehicle => ({

        vehicle_number:
          vehicle.state +
          vehicle.district +
          vehicle.series +
          vehicle.number,

        vehicle_type: vehicle.type,

        fuel_type: vehicle.fuel,

        brand: vehicle.brand,

        model: vehicle.model,

        manufacture_year: Number(vehicle.year)

      }))

    };

    this.customerService.addCustomer(customerData).subscribe({
      next: (res: any) => {
        this.showConfirmBottom = false;
        this.showSuccessDialog = true;
        this.cdr.detectChanges(); // Trigger view update for the dialog!
      },
      error: (err) => {
        console.error(err);
        this.showConfirmBottom = false;

        if (err.error?.code === 'ER_DUP_ENTRY') {
          this.duplicateError = 'Phone number already exists.';
          this.cdr.detectChanges(); // Trigger view update for the error!
          return;
        }

        alert('Unable to Register Customer');
        this.cdr.detectChanges();
      }
    });
  }

  cancelReturn(): void {

    this.showSuccessDialog = false;

    this.router.navigate(['/customers']);

  }

  goToNewJobCard(): void {

    this.showSuccessDialog = false;

    this.router.navigate(['/new-job-card']);

  }

  private createVehicle(id: number): Vehicle {

    return {

      id,

      state: '',

      district: '',

      series: '',

      number: '',

      type: 'Car',

      fuel: 'Petrol',

      brand: '',

      model: '',

      year: ''

    };

  }

}