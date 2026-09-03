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
    const originalElement = document.getElementById('invoice-content');
    if (!originalElement) return;

    const printWrapper = document.createElement('div');
    printWrapper.style.position = 'absolute';
    printWrapper.style.left = '-9999px';
    printWrapper.style.top = '0';
    printWrapper.style.width = '850px';
    printWrapper.style.backgroundColor = '#fff';
    printWrapper.style.padding = '20px';
    printWrapper.style.boxSizing = 'border-box';
    printWrapper.style.color = '#17233a';
    printWrapper.style.fontFamily = 'Arial, Helvetica, sans-serif';
    
    printWrapper.innerHTML = originalElement.innerHTML;

    const style = document.createElement('style');
    style.innerHTML = `
      * { font-family: Arial, Helvetica, sans-serif; box-sizing: border-box; }
      .paper-header, .info-grid {
        display: flex !important;
        justify-content: space-between !important;
        gap: 25px !important;
      }
      .paper-header h1 { font-size: 20px !important; letter-spacing: 1px; margin: 0; }
      .paper-header h2 { font-size: 16px !important; margin: 0; }
      p { margin: 2px 0; font-size: 11px; }
      hr { margin: 8px 0; border: 0; border-top: 2px solid #febe10; }
      .info-grid { margin: 8px 0 !important; }
      .info-grid > div {
        flex: 1 !important;
        border: 0 !important;
        border-right: 1px solid #e5e7eb !important;
        padding-right: 12px !important;
      }
      .info-grid > div:last-child { border-right: 0 !important; }
      .info-grid span { font-size: 10px; color: #64748b; display: block; margin-bottom: 2px; }
      .info-grid strong { display: block; font-size: 11px; }
      .section h3 { font-size: 12px; margin-bottom: 4px; margin-top: 8px; }
      .hidden-heading { visibility: hidden; }
      .table-scroll { width: 100% !important; margin: 0 !important; overflow: visible !important; }
      table { width: 100% !important; border-collapse: collapse; margin-top: 5px !important; font-size: 11px; }
      th, td { padding: 4px 6px !important; border: 1px solid #d9dee5; text-align: left; }
      th { background: #febe10; color: #fff; }
      .summary { width: 42% !important; margin: 8px 0 0 auto !important; }
      .summary .row { display: flex; justify-content: space-between; padding: 4px; border-bottom: 1px solid #cbd5e1; font-size: 11px; }
      .summary .grand { font-size: 14px; border: 0; }
      .footer { display: flex !important; justify-content: space-between !important; margin-top: 15px !important; font-size: 10px; border-top: 1px solid #e5e7eb; padding-top: 6px; }
    `;
    printWrapper.appendChild(style);

    document.body.appendChild(printWrapper);

    try {
      const canvas = await html2canvas(printWrapper, {
        scale: 2,
        useCORS: true,
        width: 850
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

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
    } finally {
      document.body.removeChild(printWrapper);
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
