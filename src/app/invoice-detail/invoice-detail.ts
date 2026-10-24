import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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

interface InvoiceDetailModel {
  invoice_id: number;
  invoice_number: string;

  customer_name: string;
  phone: string;

  vehicle_number: string;
  brand: string;
  model: string;

  invoice_date: string;

  subtotal: number;
  tax: number;
  total_amount: number;

  paid_amount: number;
  balance_amount: number;

  status: string;

  services: ServiceItem[];
  parts: PartItem[];
}

import { Location } from '@angular/common';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './invoice-detail.html',
  styleUrl: './invoice-detail.css'
})
export class InvoiceDetail implements OnInit {

  invoice?: InvoiceDetailModel;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private invoiceService: InvoiceService,
    private cdr: ChangeDetectorRef,
    private location: Location
  ) {}

  ngOnInit(): void {

    const id = Number(this.route.snapshot.paramMap.get('id'));

    // Immediately populate summary fields from cached invoices list
    this.invoiceService.getInvoices().subscribe({
      next: (list: any[]) => {
        if (!this.invoice) {
          const match = (list || []).find(inv => Number(inv.invoice_id) === id);
          if (match) {
            this.invoice = {
              ...match,
              phone: match.phone || '',
              brand: match.brand || '',
              model: match.model || '',
              services: [],
              parts: []
            };
            this.cdr.detectChanges();
          }
        }
      }
    });

    this.invoiceService.getInvoice(id).subscribe({

      next: (data:any) => {

        this.invoice = data;

        this.cdr.detectChanges();

      },

      error: err => {

        console.error(err);

      }

    });

  }

  back(){

    this.location.back();

  }

  totalServices(): number {

  if (!this.invoice?.services) {
    return 0;
  }

  return this.invoice.services.reduce(
    (sum, s) => sum + Number(s.total_amount),
    0
  );

}

 totalParts(): number {

  if (!this.invoice?.parts) {
    return 0;
  }

  return this.invoice.parts.reduce(
    (sum, p) => sum + Number(p.total_amount),
    0
  );

}

  showPaymentModal = false;
  paymentAmount: number = 0;

  recordPayment(){
    if(!this.invoice) return;
    this.paymentAmount = Number(this.invoice.balance_amount) || 0;
    this.showPaymentModal = true;
  }

  confirmPayment(){
    if(!this.invoice || !this.paymentAmount) return;

    const totalAmount = Number(this.invoice.total_amount) || (this.totalServices() + this.totalParts());
    const updatedPaid = (Number(this.invoice.paid_amount) || 0) + Number(this.paymentAmount);

    this.invoiceService.updateInvoice(
      this.invoice.invoice_id,
      {
        subtotal: totalAmount,
        total_amount: totalAmount,
        paid_amount: updatedPaid
      }
    ).subscribe(()=>{
      location.reload();
    });
  }

  printInvoice() {
    window.print();
  }

  getBill() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.router.navigate(['/invoices', id, 'print']);
    }
  }

}