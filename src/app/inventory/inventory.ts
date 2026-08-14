import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { InventoryService, InventoryItem } from '../services/inventory.service';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css'
})
export class Inventory implements OnInit {
  inventoryItems: InventoryItem[] = [];
  isLoading = true;
  
  // Restock Modal State
  showRestockModal = false;
  editingItem: InventoryItem | null = null;
  
  // Form Model
  formItem: InventoryItem = this.getDefaultItem();

  constructor(
    private inventoryService: InventoryService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadInventory();
  }

  loadInventory(): void {
    this.isLoading = true;
    this.inventoryService.getInventory().subscribe({
      next: (data) => {
        this.inventoryItems = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching inventory', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/more-options']);
  }

  openRestockModal(item?: InventoryItem): void {
    if (item) {
      this.editingItem = item;
      this.formItem = { ...item };
    } else {
      this.editingItem = null;
      this.formItem = this.getDefaultItem();
    }
    this.showRestockModal = true;
  }

  closeRestockModal(): void {
    this.showRestockModal = false;
    this.formItem = this.getDefaultItem();
    this.editingItem = null;
  }

  saveRestock(): void {
    if (!this.formItem.part_name || this.formItem.stock_quantity == null) {
      alert("Part name and quantity are required!");
      return;
    }

    if (this.editingItem && this.editingItem.part_id) {
      // Update existing
      this.inventoryService.updatePart(this.editingItem.part_id, this.formItem).subscribe({
        next: () => {
          this.closeRestockModal();
          this.loadInventory();
        },
        error: (err) => {
          console.error(err);
          alert("Error updating item");
          this.cdr.detectChanges();
        }
      });
    } else {
      // Create new
      this.inventoryService.addPart(this.formItem).subscribe({
        next: () => {
          this.closeRestockModal();
          this.loadInventory();
        },
        error: (err) => {
          console.error(err);
          alert("Error adding item");
          this.cdr.detectChanges();
        }
      });
    }
  }

  private getDefaultItem(): InventoryItem {
    return {
      part_name: '',
      category: 'General',
      stock_quantity: 0,
      unit_price: 0,
      mrp: 0,
      selling_price: 0,
      supplier: ''
    };
  }
}
