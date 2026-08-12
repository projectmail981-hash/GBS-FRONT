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
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    const id = Number(this.route.snapshot.paramMap.get('id'));

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

    this.router.navigate(['/invoices']);

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
    this.paymentAmount = this.invoice.balance_amount || 0;
    this.showPaymentModal = true;
  }

  confirmPayment(){
    if(!this.invoice || !this.paymentAmount) return;

    this.invoiceService.receivePayment(
      this.invoice.invoice_id,
      {
        amount: Number(this.paymentAmount)
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