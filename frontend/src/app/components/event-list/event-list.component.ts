import {Component, ElementRef, OnDestroy, OnInit, Renderer2, Signal, signal, ViewChild,} from '@angular/core';
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
export class EventListComponent implements OnInit, OnDestroy {

  @ViewChild('overlay') overlayRef!: ElementRef;
  @ViewChild('dialog') dialogRef!: ElementRef;
  private overlayClickUnlistener: (() => void) | null = null;

  ngAfterViewInit(): void {
    if (this.overlayRef && this.dialogRef) {
      const overlayEl = this.overlayRef.nativeElement;
      this.overlayClickUnlistener = this.listenClick(overlayEl);
    }
  }

  ngOnDestroy(): void {
    this.removeGlobalKeyListener();
  }

  private listenClick(overlayEl: HTMLElement): () => void {
    const handler = (event: MouseEvent) => {
      const dialogEl = this.dialogRef.nativeElement;
      if (!dialogEl.contains(event.target)) {
        this.closeDeleteModal();
      }
    };

    overlayEl.addEventListener('click', handler);

    return () => {
      overlayEl.removeEventListener('click', handler);
    };
  }


  futureEvents: Signal<EventData[]> = signal<EventData[]>([]);
  pastEvents: Signal<EventData[]> = signal<EventData[]>([]);
  error = signal<string | null>(null);
  eventToDelete: EventData | null = null;

  private globalKeyListener: () => void = () => {};

  constructor(
    private eventService: EventService,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  private loadEvents(): void {
    try {
      this.eventService.fetchEvents();
      this.futureEvents = this.eventService.getFutureEvents();
      this.pastEvents = this.eventService.getPastEvents();
      this.error.set(null);
    } catch (err) {
      this.error.set('Ürituste laadimine ebaõnnestus');
    }
  }

  openDeleteModal(event: EventData): void {
    console.log('Opening delete modal for event:', event);
    this.eventToDelete = event;
    this.addGlobalKeyListener();
  }

  closeDeleteModal(): void {
    console.log('Closing delete modal');
    this.eventToDelete = null;
    this.removeGlobalKeyListener();
  }

  confirmDelete(): void {
    console.log('Confirming delete for event:', this.eventToDelete);
    if (this.eventToDelete && this.eventToDelete.id !== undefined) {
      this.removeEvent(this.eventToDelete);
      this.eventToDelete = null;
      this.removeGlobalKeyListener();
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
      },
    });
  }

  trackById(index: number, event: EventData): number {
    return <number>event.id;
  }

  onOverlayClick(): void {
    this.closeDeleteModal();
  }

  private addGlobalKeyListener(): void {
    this.globalKeyListener = this.renderer.listen('window', 'keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.closeDeleteModal();
      }
    });
  }

  private removeGlobalKeyListener(): void {
    if (this.globalKeyListener) {
      this.globalKeyListener();
      this.globalKeyListener = () => {};
    }
  }
}
