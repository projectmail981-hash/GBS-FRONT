import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InvoiceService } from '../services/invoice.service';
import { Invoice } from '../models/invoice.model';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reports.html',
  styleUrls: ['./reports.css']
})
export class Reports implements OnInit, AfterViewInit {
  allInvoices: Invoice[] = [];
  todayCustomerCount = 0;
  
  fromDate: string = '';
  toDate: string = '';
  
  filteredIncome = 0;
  filteredPartsProfit = 0;
  filteredLabourCharge = 0;

  @ViewChild('todayChartCanvas') todayChartCanvas!: ElementRef;
  @ViewChild('weekChartCanvas') weekChartCanvas!: ElementRef;
  @ViewChild('monthChartCanvas') monthChartCanvas!: ElementRef;

  todayChart: any;
  weekChart: any;
  monthChart: any;

  constructor(private invoiceService: InvoiceService) {}

  ngOnInit(): void {
this.allInvoices = [];    
    // Set default date range (Current Month)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    this.fromDate = this.formatDate(firstDay);
    this.toDate = this.formatDate(lastDay);
    
    this.calculateTodayCustomerCount();
    this.applyDateFilter();
  }

  ngAfterViewInit(): void {
    this.renderCharts();
  }

  formatDate(date: Date): string {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }

  calculateTodayCustomerCount(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const customersToday = new Set<string>();
    
    this.allInvoices.forEach(inv => {
      const created = new Date(inv.createdAt || inv.date);
      created.setHours(0, 0, 0, 0);
      if (created.getTime() === today.getTime()) {
        customersToday.add(inv.customer);
      }
    });
    
    this.todayCustomerCount = customersToday.size;
  }

  applyDateFilter(): void {
    if (!this.fromDate || !this.toDate) return;
    
    const start = new Date(this.fromDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(this.toDate);
    end.setHours(23, 59, 59, 999);
    
    let income = 0;
    let parts = 0;
    let labour = 0;

    this.allInvoices.forEach(inv => {
      const created = new Date(inv.createdAt || inv.date);
      if (created >= start && created <= end) {
        income += inv.amount;
        parts += (inv.parts || []).reduce((sum, p) => sum + p.amount, 0);
        labour += (inv.services || []).reduce((sum, s) => sum + s.amount, 0);
      }
    });

    this.filteredIncome = income;
    this.filteredPartsProfit = parts;
    this.filteredLabourCharge = labour;
  }

  renderCharts(): void {
    const now = new Date();
    
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() + (day === 0 ? -6 : 1 - day));
    startOfWeek.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const todayData = this.getChartData(startOfDay, now);
    const weekData = this.getChartData(startOfWeek, now);
    const monthData = this.getChartData(startOfMonth, now);

    this.todayChart = this.createPieChart(this.todayChartCanvas.nativeElement, todayData, 'Today');
    this.weekChart = this.createPieChart(this.weekChartCanvas.nativeElement, weekData, 'This Week');
    this.monthChart = this.createPieChart(this.monthChartCanvas.nativeElement, monthData, 'This Month');
  }

  getChartData(start: Date, end: Date): number[] {
    let open = 0;
    let inProgress = 0;
    let ready = 0;
    let delivered = 0;

    this.allInvoices.forEach(inv => {
      const created = new Date(inv.createdAt || inv.date);
      if (created >= start && created <= end) {
        const status = inv.jobCardStatus || 'Open';
        if (status === 'Open') open++;
        else if (status === 'In Progress') inProgress++;
        else if (status === 'Ready') ready++;
        else if (status === 'Delivered') delivered++;
      }
    });

    return [open, inProgress, ready, delivered];
  }

  createPieChart(canvas: any, data: number[], title: string): any {
    return new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Open', 'In Progress', 'Ready', 'Delivered'],
        datasets: [{
          data: data,
          backgroundColor: ['#FEBE10', '#c2410c', '#3b82f6', '#15803d'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
          },
          title: {
            display: true,
            text: title
          }
        }
      }
    });
  }
}
