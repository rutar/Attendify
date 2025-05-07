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
    totalParticipants: 0
  };



  error: string | null = null;
  submitted = false;
  private readonly ADDITIONAL_INFO_MAX_LENGTH = 1000;

  constructor(private eventService: EventService, private router: Router) {}

  isPastDate(): boolean {
    if (!this.event.dateTime) return false;
    const selectedDate = new Date(this.event.dateTime);
    const now = new Date();
    return selectedDate < now;
  }

  isAdditionalInfoTooLong(): boolean {
    return !!this.event.additionalInfo && this.event.additionalInfo.length > this.ADDITIONAL_INFO_MAX_LENGTH;
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

    if (this.isAdditionalInfoTooLong()) {
      this.error = `Lisainfo ei tohi ületada ${this.ADDITIONAL_INFO_MAX_LENGTH} tähemärki`;
      return;
    }

    this.error = null;

    (this.event as EventData).dateTime = new Date(this.event.dateTime).toISOString();
    (this.event as EventData).status = 'ACTIVE';

    this.eventService.createEvent(this.event as EventData).subscribe({
      next: () => this.router.navigate(['/events']),
      error: (err) => {
        if (err.status === 400 && err.error?.includes('additional info exceeds maximum length')) {
          this.error = `Lisainfo ei tohi ületada ${this.ADDITIONAL_INFO_MAX_LENGTH} tähemärki`;
        } else {
          this.error = 'Ürituse lisamine ebaõnnestus';
        }
      },
    });
  }
}
