import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { JobCardService } from '../services/job-card.service';

interface JobCard {
  job_id: number;
  customer_name: string;
  vehicle_number: string;
  service_date: string;
  status: string;
  notes: string;
}

@Component({
  selector: 'app-job-cards',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './job-cards.html',
  styleUrl: './job-cards.css'
})
export class JobCards implements OnInit {

  allJobCards: JobCard[] = [];
  jobCards: JobCard[] = [];
  paginatedJobCards: JobCard[] = [];

  searchQuery = '';

  selectedFilter:
    | 'All'
    | 'Open'
    | 'In Progress'
    | 'Ready'
    | 'Completed' = 'All';

  currentPage = 1;
  itemsPerPage = 10;

  constructor(
    private jobCardService: JobCardService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadJobCards();
  }

  get totalPages(): number {
    return Math.max(
      1,
      Math.ceil(this.jobCards.length / this.itemsPerPage)
    );
  }

  loadJobCards(): void {

    this.jobCardService.getJobCards().subscribe({

      next: (data: JobCard[]) => {
        this.allJobCards = data;
        this.filterJobCards();

      },

      error: (err) => {

        console.error(err);

        alert("Unable to load Job Cards");

      }

    });

  }

  filterJobCards(): void {

    let list =
      this.selectedFilter === 'All'
        ? [...this.allJobCards]
        : this.allJobCards.filter(
            job => job.status === this.selectedFilter
          );

    const q = this.searchQuery
      .trim()
      .toLowerCase();

    if (q) {

      list = list.filter(job =>

        job.customer_name
          .toLowerCase()
          .includes(q)

        ||

        job.vehicle_number
          .toLowerCase()
          .includes(q)

      );

    }

    this.jobCards = list;

    this.currentPage = 1;

    this.updatePagination();

    this.cdr.detectChanges();

  }

  updatePagination(): void {

    const start =
      (this.currentPage - 1)
      * this.itemsPerPage;

    this.paginatedJobCards =
      this.jobCards.slice(
        start,
        start + this.itemsPerPage
      );

  }

  nextPage(): void {

    if (this.currentPage < this.totalPages) {

      this.currentPage++;

      this.updatePagination();

    }

  }

  previousPage(): void {

    if (this.currentPage > 1) {

      this.currentPage--;

      this.updatePagination();

    }

  }

  selectFilter(
    filter:
      | 'All'
      | 'Open'
      | 'In Progress'
      | 'Ready'
      | 'Completed'
  ): void {

    this.selectedFilter = filter;

    this.filterJobCards();

  }

  openJobCard(id: number): void {

    this.router.navigate([
      '/job-cards',
      id
    ]);

  }

  getStatusClass(status: string): string {

    return status
      .toLowerCase()
      .replace(/\s+/g, '-');

  }

}