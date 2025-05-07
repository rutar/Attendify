import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject, takeUntil } from 'rxjs';
import { ParticipantService } from '../../services/participant.service';
import { EventService } from '../../services/event.service';
import { EventData } from '../../models/event.model';
import { Participant } from '../../models/participant.model';
import {
  DEFAULT_ERROR_MESSAGES,
  createParticipantForm,
  mapFormToParticipant,
  resetParticipantForm,
  updateParticipantValidators,
  loadEventAndParticipants
} from '../../utils/form-utils';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NgOptimizedImage],
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.scss'],
})
export class EventDetailComponent implements OnInit, OnDestroy {
  event = signal<EventData | null>(null);
  participants = signal<Participant[]>([]);
  participantForm: FormGroup;
  error = signal<string | null>(null);
  participantToDelete: Participant | null = null;
  private destroy$ = new Subject<void>();
  private readonly errorMessages = DEFAULT_ERROR_MESSAGES;
  eventId: string | null = null; // Fix type to string | null

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
    this.eventId = this.route.snapshot.paramMap.get('id'); // string | null
    this.loadEventData().subscribe(() => {
      console.log('After loadEventData, participants:', this.participants());
    });
    this.setupFormListeners();
  }

  private loadEventData(): Observable<void> {
    return loadEventAndParticipants(
      this.eventId,
      this.eventService,
      this.event,
      this.participants,
      this.error,
      this.errorMessages
    ).pipe(takeUntil(this.destroy$));
  }

  private setupFormListeners(): void {
    this.participantForm
      .get('type')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((type) => {
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

    this.participantService
      .createParticipant(participant)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (newParticipant) => {
          if (this.eventId && newParticipant.id) {
            this.eventService
              .addParticipantToEvent(+this.eventId, {
                id: newParticipant.id,
                type: newParticipant.type,
              })
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: () => {
                  this.participants.update((parts) => [...parts, newParticipant]);
                  resetParticipantForm(this.participantForm);
                  this.error.set(null);
                },
                error: (err) => {
                  console.error('Failed to add participant to event:', err);
                  this.error.set(this.errorMessages.participant_add_failed);
                },
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
        },
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
      this.eventService
        .removeParticipantFromEvent(+this.eventId, participantId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.participants.update((parts) => parts.filter((p) => p.id !== participantId));
            this.error.set(null);
          },
          error: (err) => {
            console.error('Failed to remove participant:', err);
            this.error.set(this.errorMessages.participant_delete_failed);
          },
        });
    } else {
      this.participantService
        .deleteParticipant(participantId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.participants.update((parts) => parts.filter((p) => p.id !== participantId));
            this.error.set(null);
          },
          error: (err) => {
            console.error('Failed to delete participant:', err);
            this.error.set(this.errorMessages.participant_delete_failed);
          },
        });
    }
  }

  trackById(index: number, participant: Participant): number {
    return participant.id ?? index;
  }

  onOverlayClick(event: MouseEvent): void {
    this.closeDeleteModal();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
