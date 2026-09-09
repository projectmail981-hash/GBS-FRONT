import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../services/dashboard.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class Reports implements OnInit {
  isLoggedIn = false;
  passwordInput = '';
  passwordError = false;

  isLoading = true;
  summary: any = null;
  weeklyChart: any;
  monthlyChart: any;

  constructor(private dashboardService: DashboardService, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Only load if logged in, handled by login()
  }

  login(): void {
    if (this.passwordInput === '9988') {
      this.isLoggedIn = true;
      this.passwordError = false;
      this.fetchData();
    } else {
      this.passwordError = true;
    }
  }

  fetchData(): void {
    this.isLoading = true;
    this.dashboardService.getDashboard().subscribe({
      next: (data: any) => {
        this.summary = data;
        this.isLoading = false;
        this.cdr.detectChanges();
        
        setTimeout(() => {
          this.renderWeeklyChart(data.weeklyChart || []);
          this.renderMonthlyChart(data.monthlyChart || []);
        }, 100);
      },
      error: (err: any) => {
        console.error('Error fetching dashboard for reports', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  renderWeeklyChart(data: any[]): void {
    const ctx = document.getElementById('weeklyChart') as HTMLCanvasElement;
    if (!ctx) return;
    
    // Format dates (e.g. '2023-10-01T00:00:00.000Z' to 'Oct 01')
    const labels = data.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    });
    const values = data.map(d => Number(d.total));

    this.weeklyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Income (₹)',
          data: values,
          backgroundColor: '#10b981',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  renderMonthlyChart(data: any[]): void {
    const ctx = document.getElementById('monthlyChart') as HTMLCanvasElement;
    if (!ctx) return;
    
    const labels = data.map(d => `Week ${d.week}`);
    const values = data.map(d => Number(d.total));

    this.monthlyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Income (₹)',
          data: values,
          backgroundColor: '#3b82f6',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/more-options']);
  }
}
