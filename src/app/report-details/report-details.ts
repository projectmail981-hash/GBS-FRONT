import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { InvoiceService } from '../services/invoice.service';
import { forkJoin, of } from 'rxjs';
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private invoiceService: InvoiceService,
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
    this.invoiceService.getInvoices().subscribe({
      next: (summaries) => {
        if (!summaries || summaries.length === 0) {
          this.isLoading = false;
          this.cdr.detectChanges();
          return;
        }
        
        const requests = summaries.map((s: any) => 
          this.invoiceService.getInvoice(s.invoice_id).pipe(
            catchError(err => {
              console.error(`Failed to fetch invoice ${s.invoice_id}`, err);
              return of(null);
            })
          )
        );

        forkJoin(requests).subscribe({
          next: (detailedInvoices: any) => {
            // Filter out any nulls that failed to fetch
            const validInvoices = detailedInvoices.filter((inv: any) => inv !== null);
            this.processInvoices(validInvoices);
            this.isLoading = false;
            this.cdr.detectChanges();
          },
          error: (err: any) => {
            console.error(err);
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  processInvoices(detailedInvoices: any[]) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);

    let processed = [];
    this.totalValue = 0;

    for (const inv of detailedInvoices) {
      const invDate = new Date(inv.invoice_date);
      
      let relevantAmount = 0;
      let include = false;

      if (this.type === 'weekly') {
        if (invDate >= oneWeekAgo && invDate <= now) {
          include = true;
          relevantAmount = Number(inv.total_amount) || 0;
        }
      } else if (this.type === 'monthly') {
        if (invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear) {
          include = true;
          relevantAmount = Number(inv.total_amount) || 0;
        }
      } else if (this.type === 'labour') {
        const labourSum = (inv.services || []).reduce((sum: number, s: any) => sum + (Number(s.total_amount) || 0), 0);
        if (labourSum > 0) {
          include = true;
          relevantAmount = labourSum;
        }
      } else if (this.type === 'parts') {
        const partsSum = (inv.parts || []).reduce((sum: number, p: any) => sum + (Number(p.total_amount) || 0), 0);
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
