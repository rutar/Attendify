import { Component, signal, computed, OnInit } from '@angular/core';
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
  allEvents = signal<Event[]>([]);
  upcoming = computed(() => this.allEvents().filter(e => !e.isPast));
  past = computed(() => this.allEvents().filter(e => e.isPast));

  constructor(private eventService: EventService) {}

  ngOnInit(): void {
    this.eventService.fetchEvents();
    this.allEvents.set(this.eventService.getEvents()());
  }

  removeEvent(event: Event) {
    this.eventService.removeEvent(event.id).subscribe(() => {
      this.allEvents.set(this.eventService.getEvents()());
    });
  }

  trackById(index: number, event: Event): number {
    return event.id;
  }
}
