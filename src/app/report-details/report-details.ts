import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { InvoiceService } from '../services/invoice.service';
import { combineLatest, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-report-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-details.html',
  styleUrls: ['./report-details.css']
})
export class ReportDetails implements OnInit {
  type: string = '';
  title: string = '';
  invoices: any[] = [];
  isLoading = true;
  totalValue = 0;

  private baseUrl = 'https://garage-billing-backend-lyjb.onrender.com';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private invoiceService: InvoiceService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.type = params['type'];
      this.setupTitle();
      this.loadData();
    });
  }

  setupTitle() {
    switch (this.type) {
      case 'weekly': this.title = 'Weekly Revenue Details'; break;
      case 'monthly': this.title = 'Monthly Revenue Details'; break;
      case 'labour': this.title = 'Labour Revenue Details'; break;
      case 'parts': this.title = 'Parts Details'; break;
      default: this.title = 'Report Details';
    }
  }

  loadData() {
    this.isLoading = true;

    combineLatest({
      summaries: this.invoiceService.getInvoices().pipe(catchError(() => of([]))),
      jobParts: this.http.get<any[]>(`${this.baseUrl}/jobparts`).pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ summaries, jobParts }) => {
        this.processInvoices(summaries || [], jobParts || []);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private getStartOfCurrentWeek(now: Date): Date {
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday, 0, 0, 0, 0);
  }

  private getStartOfCurrentMonth(now: Date): Date {
    return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  }

  processInvoices(summaries: any[], jobParts: any[]) {
    const now = new Date();
    const startOfWeek = this.getStartOfCurrentWeek(now);
    const startOfMonth = this.getStartOfCurrentMonth(now);

    const partsByJobId = new Map<number, number>();
    for (const jp of jobParts) {
      const jId = Number(jp.job_id);
      partsByJobId.set(jId, (partsByJobId.get(jId) || 0) + Number(jp.total_amount || 0));
    }

    const processed = [];
    this.totalValue = 0;

    for (const inv of summaries) {
      const invDate = new Date(inv.invoice_date);
      const partsSum = partsByJobId.get(Number(inv.job_id)) || 0;
      const subtotal = Number(inv.subtotal ?? inv.total_amount ?? 0);
      const labourSum = Math.max(0, subtotal - partsSum);

      let relevantAmount = 0;
      let include = false;

      if (this.type === 'weekly') {
        if (invDate >= startOfWeek && invDate <= now) {
          include = true;
          relevantAmount = Number(inv.total_amount) || 0;
        }
      } else if (this.type === 'monthly') {
        if (invDate >= startOfMonth && invDate <= now) {
          include = true;
          relevantAmount = Number(inv.total_amount) || 0;
        }
      } else if (this.type === 'labour') {
        if (labourSum > 0) {
          include = true;
          relevantAmount = labourSum;
        }
      } else if (this.type === 'parts') {
        if (partsSum > 0) {
          include = true;
          relevantAmount = partsSum;
        }
      }

      if (include) {
        processed.push({
          invoice_number: inv.invoice_number,
          customer_name: inv.customer_name,
          date: inv.invoice_date,
          amount: relevantAmount
        });
        this.totalValue += relevantAmount;
      }
    }

    this.invoices = processed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  goBack() {
    this.router.navigate(['/reports']);
  }
}
