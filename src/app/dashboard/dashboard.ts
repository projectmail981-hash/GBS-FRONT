import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Invoice } from '../models/invoice.model';
import { InvoiceService } from '../services/invoice.service';
import { DashboardService } from '../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  recentInvoices: Invoice[] = [];
  displayRecentInvoices: Invoice[] = [];
  pendingInvoices: Invoice[] = [];
  searchQuery: string = '';
  currentDate: number = Date.now();

  constructor(
    private invoiceService: InvoiceService,
    private dashboardService: DashboardService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  openInvoice(id: number | string): void {
    if (id) {
      this.router.navigate(['/invoices', id]);
    }
  }

  onQuickSearch(): void {
    if (!this.searchQuery.trim()) {
      return;
    }

    alert("Quick Search will be connected to the backend.");
  }

  weeklyIncome: number = 0;
  monthlyIncome: number = 0;
  partsProfit: number = 0;
  labourCharge: number = 0;

  private loadDashboard(): void {
    // Load Pending Payments directly from InvoiceService so any Unpaid/Partial
    // invoice in the Invoices section is guaranteed to display here immediately.
    this.invoiceService.getInvoices().subscribe({
      next: (invoices: any[]) => {
        const list = invoices || [];
        this.displayRecentInvoices = list.slice(0, 1);
        this.pendingInvoices = list.filter(
          inv =>
            Number(inv.balance_amount) > 0 ||
            inv.status === 'Unpaid' ||
            inv.status === 'Partial'
        );
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Error loading invoices for dashboard:', err);
      }
    });
  }
}
