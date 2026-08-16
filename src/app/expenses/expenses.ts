import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ExpensesService } from '../services/expenses.service';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './expenses.html',
  styleUrl: './expenses.css'
})
export class Expenses implements OnInit {
  isLoading = true;
  summary: any = { weeklyExpenses: 0, monthlyExpenses: 0 };
  items: any[] = [];

  constructor(private expensesService: ExpensesService, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.fetchExpenses();
  }

  fetchExpenses(): void {
    this.expensesService.getExpenses().subscribe({
      next: (data) => {
        this.summary = data.summary || { weeklyExpenses: 0, monthlyExpenses: 0 };
        this.items = data.items || [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching expenses', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/more-options']);
  }
}
