import { Component, OnInit, signal, HostListener } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ParticipantService } from '../../services/participant.service';
import { EventService } from '../../services/event.service';
import { EventData } from '../../models/event.model';
import { Participant } from '../../models/participant.model';
import {
  DEFAULT_ERROR_MESSAGES,
  createParticipantForm,
  mapFormToParticipant,
  resetParticipantForm,
  updateParticipantValidators, loadEventAndParticipants
} from '../../utils/form-utils';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NgOptimizedImage],
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.scss'],
})
export class EventDetailComponent implements OnInit {
  event = signal<EventData | null>(null);
  participants = signal<Participant[]>([]);
  participantForm: FormGroup;
  error = signal<string | null>(null);
  participantToDelete: Participant | null = null;

  private readonly errorMessages = DEFAULT_ERROR_MESSAGES;
  eventId: string | null | undefined;

  constructor(
    private fb: FormBuilder,
    private participantService: ParticipantService,
    private eventService: EventService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.participantForm = createParticipantForm(fb);
  }

  ngOnInit(): void {
    this.loadEventData();
    this.setupFormListeners();
  }

  private loadEventData(): void {
    this.eventId = this.route.snapshot.paramMap.get('id');
    loadEventAndParticipants(
      this.eventId,
      this.eventService,
      this.event,
      this.participants,
      this.error,
      this.errorMessages
    );
  }

  private setupFormListeners(): void {
    this.participantForm.get('type')?.valueChanges.subscribe((type) => {
      updateParticipantValidators(this.participantForm, type);
    });
  }

  navigateToParticipant(eventId: string, participantId: string): void {
    this.router.navigate([`/events/${eventId}/participants/${participantId}`]);
  }

  addParticipant(): void {
    if (this.participantForm.invalid) {
      this.error.set(this.errorMessages.invalid_form);
      this.participantForm.markAllAsTouched();
      return;
    }

    const participant = mapFormToParticipant(this.participantForm.value);

    this.participantService.createParticipant(participant).subscribe({
      next: (newParticipant) => {
        if (this.eventId && newParticipant.id) {
          this.eventService.addParticipantToEvent(+this.eventId, {
            id: newParticipant.id,
            type: newParticipant.type
          }).subscribe({
            next: () => {
              this.participants.update((parts) => [...parts, newParticipant]);
              resetParticipantForm(this.participantForm);
              this.error.set(null);
            },
            error: (err) => {
              console.error('Failed to add participant to event:', err);
              this.error.set(this.errorMessages.participant_add_failed);
            }
          });
        } else {
          this.participants.update((parts) => [...parts, newParticipant]);
          resetParticipantForm(this.participantForm);
          this.error.set(null);
        }
      },
      error: (err) => {
        console.error('Failed to create participant:', err);
        this.error.set(this.errorMessages.participant_add_failed);
      }
    });
  }

  openDeleteModal(participant: Participant): void {
    this.participantToDelete = participant;
  }

  closeDeleteModal(): void {
    this.participantToDelete = null;
  }

  confirmDelete(): void {
    if (this.participantToDelete && this.participantToDelete.id !== undefined) {
      this.deleteParticipant(this.participantToDelete.id);
      this.participantToDelete = null;
    }
  }

  deleteParticipant(participantId: number): void {
    if (this.eventId) {
      this.eventService.removeParticipantFromEvent(+this.eventId, participantId).subscribe({
        next: () => {
          this.participants.update((parts) => parts.filter((p) => p.id !== participantId));
          this.error.set(null);
        },
        error: (err) => {
          console.error('Failed to remove participant:', err);
          this.error.set(this.errorMessages.participant_delete_failed);
        }
      });
    } else {
      this.participantService.deleteParticipant(participantId).subscribe({
        next: () => {
          this.participants.update((parts) => parts.filter((p) => p.id !== participantId));
          this.error.set(null);
        },
        error: (err) => {
          console.error('Failed to delete participant:', err);
          this.error.set(this.errorMessages.participant_delete_failed);
        }
      });
    }
  }

  trackById(index: number, participant: Participant): number {
    return participant.id ?? index;
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapePress(event: KeyboardEvent): void {
    if (this.participantToDelete !== null) {
      this.closeDeleteModal();
    }
  }

  onOverlayClick(event: MouseEvent): void {
    this.closeDeleteModal();
  }
}
