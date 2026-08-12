import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-more-options',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './more-options.html',
  styleUrls: ['./more-options.css']
})
export class MoreOptions {
}
