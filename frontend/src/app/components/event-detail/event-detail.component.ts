import { Component, OnInit, signal, HostListener } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ParticipantService } from '../../services/participant.service';
import { EventService } from '../../services/event.service';
import { EventData } from '../../models/event.model';
import { Participant } from '../../models/participant.model';
import { updateParticipantValidators } from '../../utils/form-utils';

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

  private errorMessages: ErrorMessages = {
    event_load_failed: 'Ürituse andmete laadimine ebaõnnestus',
    participants_load_failed: 'Osalejate nimekirja laadimine ebaõnnestus',
    participant_add_failed: 'Osaleja lisamine ebaõnnestus',
    participant_delete_failed: 'Osaleja kustutamine ebaõnnestus',
    invalid_form: 'Palun täitke kohustuslikud väljad korrektselt'
  };
  private router: any;
  eventId: string | null | undefined;

  constructor(
    private fb: FormBuilder,
    private participantService: ParticipantService,
    private eventService: EventService,
    private route: ActivatedRoute
  ) {
    this.participantForm = this.fb.group({
      type: ['PERSON', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      personalCode: ['', Validators.required],
      companyName: ['', Validators.required],
      registrationCode: [''],
      participantCount: [null],
      contactPerson: [''],
      paymentMethod: [null, Validators.required],
      email: [''],
      phone: [''],
      additionalInfo: ['']
    });
  }

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('id');
    if (this.eventId) {
      this.eventService.getEvent(+this.eventId).subscribe({
        next: (event) => this.event.set(event),
        error: () => this.error.set(this.errorMessages.event_load_failed)
      });

      this.eventService.getEventParticipants(+this.eventId).subscribe({
        next: (participants) => this.participants.set(participants),
        error: () => this.error.set(this.errorMessages.participants_load_failed)
      });
    }

    this.participantForm.get('type')?.valueChanges.subscribe((type) => {
      updateParticipantValidators(this.participantForm, type);
    });

    updateParticipantValidators(this.participantForm, 'PERSON');
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

    const formValue = this.participantForm.value;
    const participant: Participant = {
      type: formValue.type,
      firstName: formValue.type === 'PERSON' ? formValue.firstName : undefined,
      lastName: formValue.type === 'PERSON' ? formValue.lastName : undefined,
      personalCode: formValue.type === 'PERSON' ? formValue.personalCode : undefined,
      companyName: formValue.type === 'COMPANY' ? formValue.companyName : undefined,
      registrationCode: formValue.type === 'COMPANY' ? formValue.registrationCode : undefined,
      participantCount: formValue.participantCount || undefined,
      contactPerson: formValue.contactPerson || undefined,
      paymentMethod: formValue.paymentMethod,
      email: formValue.email || undefined,
      phone: formValue.phone || undefined,
      additionalInfo: formValue.additionalInfo || undefined
    };

    const eventId = this.route.snapshot.paramMap.get('id');
    this.participantService.createParticipant(participant).subscribe({
      next: (newParticipant) => {
        if (eventId && newParticipant.id) {
          this.eventService.addParticipantToEvent(+eventId, { id: newParticipant.id, type: newParticipant.type }).subscribe({
            next: () => {
              this.participants.update((parts) => [...parts, newParticipant]);
              this.resetForm();
            },
            error: () => this.error.set(this.errorMessages.participant_add_failed)
          });
        } else {
          this.participants.update((parts) => [...parts, newParticipant]);
          this.resetForm();
        }
      },
      error: () => this.error.set(this.errorMessages.participant_add_failed)
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
    const eventId = this.route.snapshot.paramMap.get('id');
    if (eventId) {
      this.eventService.removeParticipantFromEvent(+eventId, participantId).subscribe({
        next: () => {
          this.participants.update((parts) => parts.filter((p) => p.id !== participantId));
          this.error.set(null);
        },
        error: () => this.error.set(this.errorMessages.participant_delete_failed)
      });
    } else {
      this.participantService.deleteParticipant(participantId).subscribe({
        next: () => {
          this.participants.update((parts) => parts.filter((p) => p.id !== participantId));
          this.error.set(null);
        },
        error: () => this.error.set(this.errorMessages.participant_delete_failed)
      });
    }
  }

  private resetForm(): void {
    this.participantForm.reset({
      type: 'PERSON',
      firstName: '',
      lastName: '',
      personalCode: '',
      companyName: '',
      registrationCode: '',
      participantCount: null,
      contactPerson: '',
      paymentMethod: null,
      email: '',
      phone: '',
      additionalInfo: ''
    });
    updateParticipantValidators(this.participantForm, 'PERSON');
    this.error.set(null);
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

interface ErrorMessages {
  event_load_failed: string;
  participants_load_failed: string;
  participant_add_failed: string;
  participant_delete_failed: string;
  invalid_form: string;
}
