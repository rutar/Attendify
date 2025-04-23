import { Component, computed, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { FooterComponent } from './components/footer/footer.component';
import { ParkBannerComponent } from './components/park-banner/park-banner.component';
import { HeaderComponent } from './components/header/header.component';
import { NgIf } from '@angular/common';
import { GrassBannerComponent } from './components/grass-banner/grass-banner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    FooterComponent,
    ParkBannerComponent,
    HeaderComponent,
    NgIf,
    GrassBannerComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'frontend';

  currentRoute = signal('');

  // Условия для маршрутов
  showEvents = computed(() => this.currentRoute() === '/events');
  showAddEvent = computed(() => this.currentRoute() === '/events/new');
  showParticipant = computed(() => /^\/participants\/[^/]+/.test(this.currentRoute()));
  addParticipant = computed(() => /^\/events\/[^/]+\/new$/.test(this.currentRoute()));
  showEventDetails = computed(() =>
    /^\/events\/[^/]+$/.test(this.currentRoute()) &&
    !this.showEvents() &&
    !this.showAddEvent()
  );

  constructor(private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.currentRoute.set(event.urlAfterRedirects);
      }
    });
  }
}
