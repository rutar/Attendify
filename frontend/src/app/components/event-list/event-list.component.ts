import {Component, HostListener, OnInit, Signal, signal} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {RouterModule} from '@angular/router';
import {EventData} from '../../models/event.model';
import {EventService} from '../../services/event.service';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, RouterModule, NgOptimizedImage],
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.scss'],
})
export class EventListComponent implements OnInit {
  futureEvents: Signal<EventData[]> = signal<EventData[]>([]);
  pastEvents: Signal<EventData[]> = signal<EventData[]>([]);
  error = signal<string | null>(null);
  eventToDelete: EventData | null = null;
  constructor(private eventService: EventService) {
  }

  ngOnInit(): void {
    this.loadEvents();
  }

  private loadEvents(): void {
    this.eventService.fetchEvents().subscribe({
      next: () => {
        this.futureEvents = this.eventService.getFutureEvents();
        this.pastEvents = this.eventService.getPastEvents();
        console.log("Past events: " + this.pastEvents.name);
        this.error.set(null);
      },
      error: (err) => {
        console.error('Failed to load events:', err);
        this.error.set('Ürituste laadimine ebaõnnestus');
      }
    });
  }

  openDeleteModal(event: EventData): void {
    console.log('Opening delete modal for event:', event);
    this.eventToDelete = event;
  }

  closeDeleteModal(): void {
    console.log('Closing delete modal');
    this.eventToDelete = null;
  }

  confirmDelete(): void {
    console.log('Confirming delete for event:', this.eventToDelete);
    if (this.eventToDelete && this.eventToDelete.id !== undefined) {
      this.removeEvent(this.eventToDelete);
      this.eventToDelete = null;
    }
  }

  removeEvent(event: EventData): void {
    if (event.id === undefined) {
      this.error.set('Ürituse ID puudub – kustutamine ebaõnnestus');
      return;
    }

    this.eventService.removeEvent(event.id).subscribe({
      next: () => {
        this.error.set(null);
        this.loadEvents();
      },
      error: () => {
        this.error.set('Ürituse kustutamine ebaõnnestus');
      }
    });
  }

  trackById(index: number, event: EventData): number {
    return <number>event.id;
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapePress(event: KeyboardEvent): void {
    if (this.eventToDelete !== null) {
      this.closeDeleteModal();
    }
  }

  onOverlayClick(event: MouseEvent): void {
    this.closeDeleteModal();
  }
}
