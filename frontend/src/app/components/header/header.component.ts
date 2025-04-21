import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  isLinkActive: boolean = false;

  constructor(private router: Router) {
    this.checkActiveLink();
  }

  checkActiveLink() {
    const currentRoute = this.router.url;
    this.isLinkActive = currentRoute === '/events' || currentRoute === '/events/new';
  }
}
