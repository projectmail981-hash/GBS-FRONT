import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { JobCardService } from '../services/job-card.service';
import { InvoiceService } from '../services/invoice.service';
import { InventoryService, InventoryItem } from '../services/inventory.service';
import { ChangeDetectorRef } from '@angular/core';

interface ServiceItem {
  job_service_id: number;
  service_name: string;
  quantity: number;
  labour_charge: number;
  total_amount: number;
  is_completed?: boolean;
}

interface PartItem {
  job_part_id: number;
  part_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  is_completed?: boolean;
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
  imports: [CommonModule, RouterModule, FormsModule],
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
    private inventoryService: InventoryService,
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
          this.loadInventory();
        },
        error: err => {
          console.error(err);
        }
      });
    });
  }

  inventoryItems: InventoryItem[] = [];
  
  loadInventory(): void {
    this.inventoryService.getInventory().subscribe({
      next: (data) => {
        this.inventoryItems = data;
        this.cdr.detectChanges();
      }
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

  updateStatus(newStatus: string, callback?: () => void): void {
    if (!this.job) return;

    this.jobCardService.updateJobCard(
      this.job.job_id,
      { status: newStatus }
    ).subscribe({
      next: () => {
        this.job!.status = newStatus;
        this.cdr.detectChanges();
        if (callback) callback();
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

  // Checklist Actions
  toggleService(service: ServiceItem): void {
    const newVal = !service.is_completed;
    this.jobCardService.toggleServiceStatus(service.job_service_id, newVal).subscribe({
      next: () => {
        service.is_completed = newVal;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error("Failed to toggle service", err);
        alert("Failed to update status");
      }
    });
  }

  togglePart(part: PartItem): void {
    const newVal = !part.is_completed;
    this.jobCardService.togglePartStatus(part.job_part_id, newVal).subscribe({
      next: () => {
        part.is_completed = newVal;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error("Failed to toggle part", err);
        alert("Failed to update status");
      }
    });
  }

  printChecklist(): void {
    window.print();
  }

  // Add Service Form
  showServiceForm = false;
  newServiceName = '';
  newServiceQty = 1;
  newServiceAmount = 0;

  addService(): void {
    if (this.job && this.job.status === 'Ready') {
      this.updateStatus('In Progress', () => {
        this.showServiceForm = true;
      });
    } else {
      this.showServiceForm = true;
    }
  }

  confirmService(): void {
    if (!this.job || !this.newServiceName.trim()) return;

    const payload = {
      job_id: this.job.job_id,
      service_name: this.newServiceName.trim(),
      quantity: Math.max(1, this.newServiceQty),
      labour_charge: Math.max(0, this.newServiceAmount) / Math.max(1, this.newServiceQty),
      total_amount: Math.max(0, this.newServiceAmount)
    };

    this.jobCardService.addJobService(payload).subscribe({
      next: (res: any) => {
        this.ngOnInit();
        this.newServiceName = '';
        this.newServiceQty = 1;
        this.newServiceAmount = 0;
        this.showServiceForm = false;
      },
      error: err => {
        console.error("Failed to add service", err);
        alert("Failed to add service");
      }
    });
  }

  // Add Part Form & Inventory Bottom Sheet
  showPartForm = false;
  showInventorySheet = false;
  selectedInventoryItem: InventoryItem | null = null;
  
  newPartName = '';
  newPartQty = 1;
  newPartAmount = 0;

  addPart(): void {
    if (this.job && this.job.status === 'Ready') {
      this.updateStatus('In Progress', () => {
        this.showInventorySheet = true;
      });
    } else {
      this.showInventorySheet = true;
    }
  }

  selectInventoryItem(item: InventoryItem): void {
    if (item.stock_quantity <= 0) {
      alert("This item is out of stock!");
      return;
    }
    this.selectedInventoryItem = item;
    this.newPartName = item.part_name;
    this.newPartQty = 1;
    this.updatePartAmount();
    
    this.showInventorySheet = false;
    this.showPartForm = true;
    this.cdr.detectChanges();
  }
  
  closeInventorySheet(): void {
    this.showInventorySheet = false;
  }
  
  updatePartAmount(): void {
    if (this.selectedInventoryItem) {
      this.newPartAmount = this.selectedInventoryItem.selling_price * this.newPartQty;
    }
  }

  onPartQtyChange(): void {
    if (this.newPartQty < 1) this.newPartQty = 1;
    if (this.selectedInventoryItem && this.newPartQty > this.selectedInventoryItem.stock_quantity) {
      alert("Quantity exceeds available stock!");
      this.newPartQty = this.selectedInventoryItem.stock_quantity;
    }
    this.updatePartAmount();
  }

  confirmPart(): void {
    if (!this.job || !this.newPartName.trim() || !this.selectedInventoryItem) return;

    const payload = {
      job_id: this.job.job_id,
      part_id: this.selectedInventoryItem.part_id,
      part_name: this.selectedInventoryItem.part_name,
      quantity: Math.max(1, this.newPartQty),
      unit_price: this.selectedInventoryItem.selling_price,
    };

    this.jobCardService.addJobPart(payload).subscribe({
      next: (res: any) => {
        // Refresh job card
        this.ngOnInit();
        this.newPartName = '';
        this.newPartQty = 1;
        this.newPartAmount = 0;
        this.selectedInventoryItem = null;
        this.showPartForm = false;
      },
      error: err => {
        console.error("Failed to add part", err);
        alert("Failed to add part");
      }
    });
  }

  deletePart(part: PartItem): void {
    if (confirm("Are you sure you want to remove this part?")) {
      this.jobCardService.deleteJobPart(part.job_part_id).subscribe({
        next: () => {
          this.ngOnInit();
        },
        error: err => {
          console.error("Failed to delete part", err);
          alert("Failed to delete part");
        }
      });
    }
  }

  isAllChecked(): boolean {
    if (!this.job) return false;
    const allServicesChecked = this.job.services ? this.job.services.every((s: any) => s.is_completed) : true;
    const allPartsChecked = this.job.parts ? this.job.parts.every((p: any) => p.is_completed) : true;
    return allServicesChecked && allPartsChecked;
  }
}