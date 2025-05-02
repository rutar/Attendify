import {Component, OnDestroy, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {ParticipantService} from '../../services/participant.service';
import {EventService} from '../../services/event.service';
import {EventData} from '../../models/event.model';
import {Participant} from '../../models/participant.model';
import {updateParticipantValidators} from '../../utils/form-utils';
import {debounceTime, distinctUntilChanged, map, switchMap, takeUntil, tap} from 'rxjs/operators';
import {Observable, of, Subject} from 'rxjs';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';

@Component({
  selector: 'app-participant-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatAutocompleteModule,
    MatInputModule,
    MatFormFieldModule
  ],
  templateUrl: './participant-create.component.html',
  styleUrls: ['./participant-create.component.scss'],
})
export class ParticipantCreateComponent implements OnInit, OnDestroy {
  event = signal<EventData | null>(null);
  participants = signal<Participant[]>([]);
  participantForm: FormGroup;
  error = signal<string | null>(null);

  filteredFirstNameOptions!: Observable<Participant[]>;
  filteredLastNameOptions!: Observable<Participant[]>;
  filteredCompanyNameOptions!: Observable<Participant[]>;

  private destroy$ = new Subject<void>();

  private errorMessages: ErrorMessages = {
    event_load_failed: 'Ürituse andmete laadimine ebaõnnestus',
    participants_load_failed: 'Osalejate nimekirja laadimine ebaõnnestus',
    participant_add_failed: 'Osaleja lisamine ebaõnnestus',
    participant_delete_failed: 'Osaleja kustutamine ebaõnnestus',
    invalid_form: 'Palun täitke kohustuslikud väljad korrektselt',
    participant_already_added: 'Osaleja on juba üritusele lisatud'
  };

  eventId: string | null | undefined;

  constructor(
    private fb: FormBuilder,
    private participantService: ParticipantService,
    private eventService: EventService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.participantForm = this.fb.group({
      type: ['PERSON', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      personalCode: ['', Validators.required],
      companyName: [''],
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

    this.participantForm.get('type')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((type) => updateParticipantValidators(this.participantForm, type));

    updateParticipantValidators(this.participantForm, 'PERSON');

    // Setup autocomplete for firstName
    this.filteredFirstNameOptions = this.participantForm.get('firstName')!.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        if (typeof value === 'string' && value) {
          return this.participantService.searchParticipants(value, 'PERSON', 'firstName');
        }
        return of([]);
      })
    );

    // Setup autocomplete for lastName
    this.filteredLastNameOptions = this.participantForm.get('lastName')!.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        if (typeof value === 'string' && value) {
          return this.participantService.searchParticipants(value, 'PERSON', 'lastName');
        }
        return of([]);
      })
    );

    // Setup autocomplete for companyName
    this.filteredCompanyNameOptions = this.participantForm.get('companyName')!.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        if (typeof value === 'string' && value) {
          console.log('CompanyName query:', value); // Debug query
          return this.participantService.searchParticipants(value, 'COMPANY', 'companyName').pipe(
            tap(participants => console.log('Raw CompanyName participants:', participants)), // Debug raw data
            map(participants => participants.filter(p => p.companyName && p.companyName.trim() !== '')),
            tap(filtered => console.log('Filtered CompanyName participants:', filtered)) // Debug filtered data
          );
        }
        return of([]);
      })
    );
  }

  // Display function for autocomplete
  displayFn(participant: Participant | string): string {
    if (!participant) {
      return '';
    }
    if (typeof participant === 'string') {
      return participant;
    }
    if (participant.type === 'COMPANY') {
      return participant.companyName || '';
    }
    return `${participant.firstName} ${participant.lastName}`;
  }

  selectParticipant(participant: Participant): void {
    // Determine participant type
    let participantType: 'PERSON' | 'COMPANY' | null = null;
    if (participant.firstName || participant.lastName) {
      participantType = 'PERSON';
    } else if (participant.companyName) {
      participantType = 'COMPANY';
    }

    this.participantForm.patchValue({
      firstName: participant.firstName,
      lastName: participant.lastName,
      personalCode: participant.personalCode,
      companyName: participant.companyName,
      registrationCode: participant.registrationCode,
      participantCount: participant.participantCount,
      contactPerson: participant.contactPerson,
      paymentMethod: participant.paymentMethod,
      email: participant.email,
      phone: participant.phone,
      additionalInfo: participant.additionalInfo
    });

    // Update validators based on type
    updateParticipantValidators(this.participantForm, participantType);
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
    if (!eventId) {
      this.error.set(this.errorMessages.participant_add_failed);
      return;
    }

    this.participantService.createParticipant(participant).subscribe({
      next: (newParticipant) => {
        if (newParticipant.id) {
          this.eventService.addParticipantToEvent(+eventId, {
            id: newParticipant.id,
            type: newParticipant.type
          }).subscribe({
            next: () => {
              this.participants.update((parts) => [...parts, newParticipant]);
              this.resetForm();
              this.router.navigate(['/events']); // Navigate to /events
            },
            error: (err) => {
              console.error('Failed to add participant to event:', err);
              this.error.set(this.errorMessages.participant_add_failed);
            }
          });
        }
      },
      error: (err) => {
        console.error('Create participant error:', err);
        if (err.status === 409) {
          // Participant already exists, search for it
          const searchField = formValue.type === 'PERSON' ? 'personalCode' : 'registrationCode';
          const searchValue = formValue.type === 'PERSON' ? formValue.personalCode : formValue.registrationCode;

          if (!searchValue) {
            console.warn('No search value for existing participant:', formValue);
            this.error.set(this.errorMessages.participant_add_failed);
            return;
          }

          this.participantService.searchParticipants(searchValue, formValue.type, searchField).subscribe({
            next: (existingParticipants) => {
              console.log('Search results for existing participant:', existingParticipants);
              const existingParticipant = existingParticipants.find(p =>
                (formValue.type === 'PERSON' && p.personalCode === formValue.personalCode) ||
                (formValue.type === 'COMPANY' && p.registrationCode === formValue.registrationCode)
              );

              if (!existingParticipant || !existingParticipant.id) {
                console.warn('No matching existing participant found:', existingParticipants);
                this.error.set(this.errorMessages.participant_add_failed);
                return;
              }

              // Try to add existing participant to event
              this.eventService.addParticipantToEvent(+eventId, {
                id: existingParticipant.id,
                type: existingParticipant.type
              }).subscribe({
                next: () => {
                  this.participants.update((parts) => [...parts, existingParticipant]);
                  this.resetForm();
                  this.router.navigate(['/events']); // Navigate to /events
                },
                error: (eventErr) => {
                  console.error('Failed to add existing participant to event:', eventErr);
                  if (eventErr.status === 409) {
                    this.error.set(this.errorMessages.participant_already_added);
                  } else {
                    this.error.set(this.errorMessages.participant_add_failed);
                  }
                }
              });
            },
            error: (searchErr) => {
              console.error('Search for existing participant failed:', searchErr);
              this.error.set(this.errorMessages.participant_add_failed);
            }
          });
        } else {
          this.error.set(this.errorMessages.participant_add_failed);
        }
      }
    });
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

interface ErrorMessages {
  event_load_failed: string;
  participants_load_failed: string;
  participant_add_failed: string;
  participant_delete_failed: string;
  invalid_form: string;
  participant_already_added: string;
}
