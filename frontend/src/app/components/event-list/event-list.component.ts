import {Component, OnInit, Signal, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Event } from '../../models/event.model';
import { EventService } from '../../services/event.service';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.scss'],
})
export class EventListComponent implements OnInit {
  // Signaal tulevastele üritustele
  futureEvents: Signal<Event[]> = signal<Event[]>([]);
  // Signaal möödunud üritustele
  pastEvents: Signal<Event[]> = signal<Event[]>([]);
  // Vea teade
  error = signal<string | null>(null);

  constructor(private eventService: EventService) {
  }

  // Komponendi initsialiseerimine
  ngOnInit(): void {
    // Laadime üritused serverist
    this.eventService.fetchEvents();
    this.futureEvents = this.eventService.getFutureEvents();
    this.pastEvents = this.eventService.getPastEvents();
  }

  // Ürituse eemaldamine
  removeEvent(event: Event) {
    this.eventService.removeEvent(event.id).subscribe({
      next: () => this.error.set(null),
      error: () => this.error.set('Ürituse kustutamine ebaõnnestus'),
    });
  }

  // Ürituse jälgimine ID järgi
  trackById(index: number, event: Event): number {
    return event.id;
  }
}
