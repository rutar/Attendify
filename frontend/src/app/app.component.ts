import { Component, computed, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { FooterComponent } from './components/footer/footer.component';
import { HeroComponent } from './components/hero/hero.component';
import { HeaderComponent } from './components/header/header.component';
import { NgIf } from '@angular/common';
import { PageBannerComponent } from './components/page-banner/page-banner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    FooterComponent,
    HeroComponent,
    HeaderComponent,
    NgIf,
    PageBannerComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'frontend';

  currentRoute = signal('');
  showHero = computed(() => this.currentRoute() === '/events');
  showAddEvent = computed(() => this.currentRoute() === '/events/new');
  showParticipants = computed(() => /^\/events\/[^/]+\/participants$/.test(this.currentRoute()));

  constructor(private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.currentRoute.set(event.urlAfterRedirects);
      }
    });
  }
}
