import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl } from '@angular/forms';


import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { EventService } from '../../services/event.service';
import { ParticipantService } from '../../services/participant.service';
import { EventData } from '../../models/event.model';
import { Participant } from '../../models/participant.model';


interface ErrorMessages {
  event_load_failed: string;
  participants_load_failed: string;
  participant_add_failed: string;
  participant_remove_failed: string;
  invalid_person_data: string;
  invalid_company_data: string;
  search_failed: string;
}

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.scss'],
})
export class EventDetailComponent implements OnInit {
  event = signal<EventData | null>(null);
  participants = signal<Participant[]>([]);
  allParticipants = signal<Participant[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  newParticipantType = signal<'PERSON' | 'COMPANY' | null>(null);
  newParticipant = signal<Participant>({
    type: null,
    firstName: '',
    lastName: '',
    personalCode: '',
    companyName: '',
    registrationCode: '',
    participantCount: undefined,
    contactPerson: '',
    paymentMethod: null,
    email: '',
    phone: '',
    additionalInfo: ''
  });
  searchControl = new FormControl('');
  private searchTerms = new Subject<string>();

  private errorMessages: ErrorMessages = {
    event_load_failed: 'Ürituse andmete laadimine ebaõnnestus',
    participants_load_failed: 'Osalejate nimekirja laadimine ebaõnnestus',
    participant_add_failed: 'Osaleja lisamine ebaõnnestus',
    participant_remove_failed: 'Osaleja eemaldamine ebaõnnestus',
    invalid_person_data: 'Eesnimi, perekonnanimi, isikukood ja makseviis on kohustuslikud',
    invalid_company_data: 'Ettevõtte nimi, registrikood ja makseviis on kohustuslikud',
    search_failed: 'Osalejate otsimine ebaõnnestus'
  };

  constructor(
    private eventService: EventService,
    private participantService: ParticipantService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const eventId = +id;
      this.eventService.getEvent(eventId).subscribe({
        next: (event) => {
          this.event.set(event);
          this.isLoading.set(false);
          this.loadParticipants(eventId);
        },
        error: () => {
          this.error.set(this.errorMessages.event_load_failed);
          this.isLoading.set(false);
        }
      });
    }

    // Set up search pipeline
    this.searchTerms
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term: string) => this.participantService.searchParticipants(term))
      )
      .subscribe({
        next: (participants) => {
          this.allParticipants.set(
            participants.filter((p) => !this.participants().some((ep) => ep.id === p.id))
          );
        },
        error: () => this.error.set(this.errorMessages.search_failed)
      });
  }

  searchParticipants(term: string): void {
    this.searchTerms.next(term);
  }

  loadParticipants(eventId: number): void {
    this.eventService.getEventParticipants(eventId).subscribe({
      next: (participants) => this.participants.set(participants),
      error: () => this.error.set(this.errorMessages.participants_load_failed)
    });
  }

  addExistingParticipant(event: MatAutocompleteSelectedEvent): void {
    const participant: Participant = event.option.value;
    const eventId = this.event()?.id;
    if (!eventId || !participant.id) return;

    this.eventService.addParticipantToEvent(eventId, { id: participant.id, type: null }).subscribe({
      next: (addedParticipant) => {
        this.participants.update((parts) => [...parts, addedParticipant]);
        this.allParticipants.update((parts) => parts.filter((p) => p.id !== addedParticipant.id));
        this.searchControl.setValue('');
      },
      error: (err) => this.error.set(err.message || this.errorMessages.participant_add_failed)
    });
  }

  createNewParticipant(): void {
    const eventId = this.event()?.id;
    const participant = this.newParticipant();
    if (!eventId || !this.isNewParticipantValid()) {
      this.error.set(
        participant.type === 'PERSON'
          ? this.errorMessages.invalid_person_data
          : this.errorMessages.invalid_company_data
      );
      return;
    }

    this.eventService.addParticipantToEvent(eventId, participant).subscribe({
      next: (addedParticipant) => {
        this.participants.update((parts) => [...parts, addedParticipant]);
        this.resetNewParticipantForm();
      },
      error: (err) => this.error.set(err.message || this.errorMessages.participant_add_failed)
    });
  }

  removeParticipant(participantId: number): void {
    const eventId = this.event()?.id;
    if (!eventId) return;

    this.eventService.removeParticipantFromEvent(eventId, participantId).subscribe({
      next: () => {
        this.participants.update((parts) => parts.filter((p) => p.id !== participantId));
      },
      error: () => this.error.set(this.errorMessages.participant_remove_failed)
    });
  }

  getParticipantName(participant: Participant): string {
    if (participant.type === 'PERSON') {
      return `${participant.firstName || ''} ${participant.lastName || ''}`.trim() || 'Nimetu isik';
    }
    if (participant.type === 'COMPANY') {
      return participant.companyName || 'Nimetu ettevõte';
    }
    return participant.additionalInfo || 'Tundmatu osaleja';
  }

  isNewParticipantValid(): boolean {
    const p = this.newParticipant();
    if (p.type === 'PERSON') {
      return !!(
        p.firstName?.trim() &&
        p.lastName?.trim() &&
        p.personalCode?.trim() &&
        p.paymentMethod
      );
    }
    if (p.type === 'COMPANY') {
      return !!(
        p.companyName?.trim() &&
        p.registrationCode?.trim() &&
        p.paymentMethod
      );
    }
    return false;
  }

  resetNewParticipantForm(): void {
    this.newParticipantType.set(null);
    this.newParticipant.set({
      type: null,
      firstName: '',
      lastName: '',
      personalCode: '',
      companyName: '',
      registrationCode: '',
      participantCount: undefined,
      contactPerson: '',
      paymentMethod: null,
      email: '',
      phone: '',
      additionalInfo: ''
    });
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchParticipants(input.value);
  }

  onParticipantTypeChange(type: 'PERSON' | 'COMPANY' | null): void {
    this.newParticipantType.set(type);
    this.newParticipant.update((p) => ({ ...p, type }));
  }

  trackById(index: number, participant: Participant): number {
    return participant.id!;
  }

  protected readonly HTMLInputElement = HTMLInputElement;
}
