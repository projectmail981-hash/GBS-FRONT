import { Component, OnInit, NgZone } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { App as CapacitorApp } from '@capacitor/app';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterModule],
  standalone: true,
  templateUrl: './app.html'
})
export class App implements OnInit {
  private baseUrl = 'https://garage-billing-backend-lyjb.onrender.com';

  constructor(
    private location: Location,
    private router: Router,
    private zone: NgZone,
    private http: HttpClient
  ) {}

  ngOnInit() {
    // Warm up the cache in the background on startup so all tabs load instantaneously
    this.prefetchCoreData();

    CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      this.zone.run(() => {
        // If we are on the dashboard, exit the app
        if (this.router.url === '/dashboard' || this.router.url === '/') {
          CapacitorApp.exitApp();
        } else {
          // Otherwise, go back to the previous page
          this.location.back();
        }
      });
    });
  }

  private prefetchCoreData(): void {
    // Priority 1: invoices (used immediately on Dashboard)
    this.http.get(`${this.baseUrl}/invoices`).pipe(catchError(() => of(null))).subscribe(() => {
      // Priority 2: prefetch remaining sections in the background without competing with initial render
      const backgroundEndpoints = [
        '/customers',
        '/jobcards',
        '/inventory',
        '/expenses',
        '/vehicles',
        '/jobparts'
      ];

      for (const endpoint of backgroundEndpoints) {
        this.http.get(`${this.baseUrl}${endpoint}`).pipe(catchError(() => of(null))).subscribe();
      }
    });
  }
}
