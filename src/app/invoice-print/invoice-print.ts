import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Invoice, amountInWords, formatCurrency, formatDisplayDate } from '../models/invoice.model';
import { InvoiceService } from '../services/invoice.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Printer } from '@capgo/capacitor-printer';

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
  
  async savePDF(): Promise<void> {

    const element = document.getElementById('invoice-content');

    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        windowWidth: 1024,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('invoice-content');
          if (el) {
            el.style.width = '850px';
            el.style.margin = '0';
            el.style.padding = '40px';
          }
        }
      });

      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight =
        (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(
        imgData,
        'PNG',
        0,
        0,
        pdfWidth,
        pdfHeight
      );

      const fileName = `${this.invoice?.invoice_number}.pdf`;

      if (Capacitor.isNativePlatform()) {
        const pdfBase64 = pdf.output('datauristring').split(',')[1];
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: pdfBase64,
          directory: Directory.Cache
        });

        await Share.share({
          title: fileName,
          url: savedFile.uri,
        });
      } else {
        pdf.save(fileName);
      }
    } catch (err: any) {
      console.error('Error generating PDF', err);
      alert('Failed to generate PDF: ' + (err?.message || JSON.stringify(err)));
    }
  }

  async printInvoice(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        await Printer.printWebView();
      } catch (e: any) {
        alert('Failed to print: ' + (e?.message || JSON.stringify(e)));
      }
    } else {
      window.print();
    }
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
