import { Component, OnInit, NgZone } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { Location } from '@angular/common';
import { App as CapacitorApp } from '@capacitor/app';

@Component({
  selector: 'app-root',
  imports: [RouterModule],
  standalone: true,
  templateUrl: './app.html'
})
export class App implements OnInit {
  constructor(
    private location: Location,
    private router: Router,
    private zone: NgZone
  ) {}

  ngOnInit() {
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
}
