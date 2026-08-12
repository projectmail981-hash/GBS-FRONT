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

  constructor(
    private invoiceService: InvoiceService,
    private dashboardService: DashboardService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
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
    this.dashboardService.getDashboard().subscribe({
      next: (data: any) => {
        

        // Reports (note case sensitivity of labourRevenue)
        this.weeklyIncome = Number(data.weekRevenue || 0);
        this.monthlyIncome = Number(data.monthRevenue || 0);
        this.partsProfit = Number(data.partsRevenue || 0);
        this.labourCharge = Number(data.labourRevenue || 0);

        // Lists (only take the absolute most recent invoice for recentInvoices)
        this.displayRecentInvoices = (data.recentInvoices || []).slice(0, 1);
        this.pendingInvoices = data.pendingInvoices || [];

        // Force Angular to update the UI with the asynchronous data
        this.cdr.detectChanges();
      },
      error: err => {
        console.error(err);
      }
    });
  }
}

