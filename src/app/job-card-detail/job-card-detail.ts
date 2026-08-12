import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { JobCardService } from '../services/job-card.service';
import { InvoiceService } from '../services/invoice.service';
import { ChangeDetectorRef } from '@angular/core';

interface ServiceItem {
  job_service_id: number;
  service_name: string;
  quantity: number;
  labour_charge: number;
  total_amount: number;
}

interface PartItem {
  job_part_id: number;
  part_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
}

interface JobCard {
  job_id: number;
  customer_name: string;
  phone: string;
  vehicle_number: string;
  brand: string;
  model: string;
  service_date: string;
  odometer_reading: number;
  status: string;
  notes: string;

  services: ServiceItem[];
  parts: PartItem[];
}

@Component({
  selector: 'app-job-card-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './job-card-detail.html',
  styleUrl: './job-card-detail.css'
})
export class JobCardDetail implements OnInit {

  job?: JobCard;

  readonly stages = [
    'Open',
    'In Progress',
    'Ready',
    'Delivered'
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private jobCardService: JobCardService,
    private invoiceService: InvoiceService,
    private cdr: ChangeDetectorRef
  ) {}

  isBilled: boolean = false;
  isGenerating: boolean = false;

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      this.jobCardService.getJobCard(id).subscribe({
        next: (data: JobCard) => {
          this.job = data;
          this.checkIfBilled();
          this.cdr.detectChanges();
        },
        error: err => {
          console.error(err);
        }
      });
    });
  }

  checkIfBilled(): void {
    if (!this.job) return;
    this.invoiceService.getInvoices().subscribe({
      next: (invoices: any[]) => {
        this.isBilled = invoices.some(inv => inv.job_id === this.job!.job_id);
        this.cdr.detectChanges();
      }
    });
  }

  back(): void {

    this.router.navigate(['/job-cards']);

  }

  stageIndex(status: string): number {

    return this.stages.indexOf(status);

  }

  totalServices(): number {

    if (!this.job) return 0;

    return this.job.services.reduce(
      (sum, s) => sum + Number(s.total_amount),
      0
    );

  }

  totalParts(): number {

    if (!this.job) return 0;

    return this.job.parts.reduce(
      (sum, p) => sum + Number(p.total_amount),
      0
    );

  }

  grandTotal(): number {

    return this.totalServices() + this.totalParts();

  }

  updateStatus(newStatus: string): void {

  if (!this.job) return;

  this.jobCardService.updateJobCard(
    this.job.job_id,
    {
      status: newStatus
    }
  ).subscribe({

    next: () => {

      this.job!.status = newStatus;

    },

    error: err => {

      console.error(err);

    }

  });

}
  generateBill(): void {
    if (!this.job || this.isBilled || this.isGenerating) {
      return;
    }

    this.isGenerating = true;
    this.invoiceService.createInvoice({
      job_id: this.job.job_id,
      paid_amount: 0
    }).subscribe({
      next: (res: any) => {
        alert("Invoice Generated Successfully");
        this.isGenerating = false;
        this.isBilled = true;
        this.cdr.detectChanges();
        this.router.navigate([
          "/invoices",
          res.invoice_id
        ]);
      },
      error: (err) => {
        console.error(err);
        this.isGenerating = false;
        this.cdr.detectChanges();
        alert("Failed to generate invoice");
      }
    });
  }
}