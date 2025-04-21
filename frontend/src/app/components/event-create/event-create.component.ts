import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { EventService } from '../../services/event.service';
import { EventData } from '../../models/event.model';

@Component({
  selector: 'app-event-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './event-create.component.html',
  styleUrls: ['./event-create.component.scss'],
})
export class EventCreateComponent {
  event: Partial<EventData> = {
    name: '',
    dateTime: '',
    location: '',
    additionalInfo: '',
  };

  error: string | null = null;
  submitted = false;

  constructor(private eventService: EventService, private router: Router) {}

  isPastDate(): boolean {
    if (!this.event.dateTime) return false;
    const selectedDate = new Date(this.event.dateTime);
    const now = new Date();
    return selectedDate < now;
  }

  save(): void {
    this.submitted = true;

    if (!this.event.name || !this.event.dateTime || !this.event.location) {
      this.error = 'Palun täida kohustuslikud väljad';
      return;
    }

    if (this.isPastDate()) {
      this.error = 'Ürituse toimumisaeg ei tohi olla minevikus';
      return;
    }

    this.error = null;

    (this.event as EventData).dateTime = new Date(this.event.dateTime).toISOString();
    (this.event as EventData).status = 'ACTIVE';

    this.eventService.createEvent(this.event as EventData).subscribe({
      next: () => this.router.navigate(['/events']),
      error: () => (this.error = 'Ürituse lisamine ebaõnnestus'),
    });
  }
}
