import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { InvoiceService } from '../services/invoice.service';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './invoices.html',
  styleUrls: ['./invoices.css']
})
export class Invoices implements OnInit {

  allInvoices: any[] = [];
  invoices: any[] = [];
  paginatedInvoices: any[] = [];

  searchQuery = '';

  selectedFilter:
    | 'All'
    | 'Unpaid'
    | 'Partial'
    | 'Paid'
    = 'All';

  currentPage = 1;
  itemsPerPage = 10;

  constructor(
    private invoiceService: InvoiceService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    this.loadInvoices();

  }

  loadInvoices(): void {

    this.invoiceService.getInvoices().subscribe({

      next: (data: any[]) => {

        this.allInvoices = data || [];

        this.applyFilters();

      },

      error: err => {

        console.error(err);

      }

    });

  }

  applyFilters(): void {

    let list = [...this.allInvoices];

    if (this.selectedFilter !== 'All') {

      list = list.filter(

        invoice => invoice.status === this.selectedFilter

      );

    }

    if (this.searchQuery.trim()) {

      const keyword = this.searchQuery.toLowerCase();

      list = list.filter(invoice =>

        invoice.customer_name?.toLowerCase().includes(keyword) ||

        invoice.vehicle_number?.toLowerCase().includes(keyword) ||

        invoice.invoice_number?.toLowerCase().includes(keyword)

      );

    }

    this.invoices = list;

    this.currentPage = 1;

    this.updatePagination();

    this.cdr.detectChanges();

  }

  selectFilter(filter: any): void {

    this.selectedFilter = filter;

    this.applyFilters();

  }

  onSearch(): void {

    this.applyFilters();

  }

  updatePagination(): void {

    const start =

      (this.currentPage - 1) * this.itemsPerPage;

    this.paginatedInvoices =

      this.invoices.slice(

        start,

        start + this.itemsPerPage

      );

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

  get totalPages(): number {

    return Math.max(

      1,

      Math.ceil(

        this.invoices.length /

        this.itemsPerPage

      )

    );

  }

  openInvoice(id: number): void {

    this.router.navigate([

      '/invoices',

      id

    ]);

  }

  getBalance(invoice: any): number {

    return Number(invoice.balance_amount || 0);

  }

  formatDate(date: string): string {

    return new Date(date)

      .toLocaleDateString('en-IN');

  }

}