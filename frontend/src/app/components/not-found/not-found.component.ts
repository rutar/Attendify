import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container mt-4 text-center">
      <h2>404 - Lehte ei leitud</h2>
      <p>Valitud leht ei eksisteeri.</p>
      <a routerLink="/" class="btn btn-primary">Tagasi avalehele</a>
    </div>
  `,
  styles: [],
})
export class NotFoundComponent {}
