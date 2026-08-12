import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Invoice, amountInWords, formatCurrency, formatDisplayDate } from '../models/invoice.model';
import { InvoiceService } from '../services/invoice.service';

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

interface InvoicePrintModel {

  invoice_id: number;
  invoice_number: string;
  invoice_date: string;

  customer_name: string;
  phone: string;

  vehicle_number: string;
  brand: string;
  model: string;

  odometer_reading: number;

  subtotal: number;
  tax: number;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;

  status: string;

  services: ServiceItem[];
  parts: PartItem[];

}

@Component({ selector: 'app-invoice-print', standalone: true, imports: [CommonModule, RouterModule], templateUrl: './invoice-print.html', styleUrl: './invoice-print.css' })
export class InvoicePrint implements OnInit {
  job: any;
  jobCardService: any;
print(): void {
  window.print();
}

amountInWords = amountInWords;
formatCurrency = formatCurrency;
formatDisplayDate = formatDisplayDate;
  invoice?: InvoicePrintModel;
  constructor(private route: ActivatedRoute, private router: Router, private invoiceService: InvoiceService, private cdr: ChangeDetectorRef) {}
loading = true;
  ngOnInit(): void {

  const id = Number(this.route.snapshot.paramMap.get('id'));

  this.invoiceService.getInvoice(id).subscribe({

    next: (data) => {

     
      this.invoice = {
        ...data,
        services: data.services ?? [],
        parts: data.parts ?? []
      };


       this.loading = false;
       this.cdr.detectChanges();


    },

    error: (err) => {
      console.error(err);
       this.loading = false;
       this.cdr.detectChanges();
    }
    

  });

}
back(): void {

  if (!this.invoice)
    return;

  this.router.navigate([
    '/invoices',
    this.invoice.invoice_id
  ]);

}

}
