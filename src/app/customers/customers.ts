import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../services/customer.service';
import { ChangeDetectorRef } from '@angular/core';

interface Customer {
  customer_id: number;

  customer_name: string;

  phone: string;

  address: string;
}

const CUSTOMER_STATE_KEY = 'gbs-customers';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './customers.html',
  styleUrl: './customers.css',
})
export class Customers implements OnInit {
  customers: Customer[] = [];
  allCustomers: Customer[] = [];
  searchQuery: string = '';

  paginatedCustomers: Customer[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 10;

  constructor(
  private customerService: CustomerService,
  private cdr: ChangeDetectorRef,
  private router: Router
) {
  
}

  viewCustomer(id: number): void {
    this.router.navigate(['/customers', id]);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.customers.length / this.itemsPerPage));
  }

  ngOnInit() {
    this.loadCustomers();
  }

  onSearch(): void {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) {
      this.customers = [...this.allCustomers];
    } else {
      this.customers = this.allCustomers.filter(customer => 
        customer.customer_name.toLowerCase().includes(q) || customer.phone.includes(q)
      );
    }
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {

  const startIndex = (this.currentPage - 1) * this.itemsPerPage;

  this.paginatedCustomers =
    this.customers.slice(startIndex, startIndex + this.itemsPerPage);


}

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  private loadCustomers() {

  this.customerService.getCustomers().subscribe({

    next: (data) => {

      this.allCustomers = data;
      this.customers = [...this.allCustomers];
      this.currentPage = 1;
      this.updatePagination();

      this.cdr.detectChanges();

    },

    error: (err) => {

      console.error("API Error:", err);

    }

  });

}
}
