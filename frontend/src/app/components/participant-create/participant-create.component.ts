import {Component, OnDestroy, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {ParticipantService} from '../../services/participant.service';
import {EventService} from '../../services/event.service';
import {EventData} from '../../models/event.model';
import {Participant} from '../../models/participant.model';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {Observable, Subject, throwError} from 'rxjs';
import {map, switchMap, takeUntil} from 'rxjs/operators';
import {
  DEFAULT_ERROR_MESSAGES,
  createParticipantForm,
  displayParticipantFn,
  mapFormToParticipant,
  patchParticipantFormValues,
  resetParticipantForm,
  setupCompanyNameAutocomplete,
  setupFirstNameAutocomplete,
  setupLastNameAutocomplete,
  updateAdditionalInfoValidator,
  updateParticipantValidators, loadEventAndParticipants
} from '../../utils/form-utils';

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
  error = signal<string | null| undefined>(null);

  filteredFirstNameOptions!: Observable<Participant[]>;
  filteredLastNameOptions!: Observable<Participant[]>;
  filteredCompanyNameOptions!: Observable<Participant[]>;

  private destroy$ = new Subject<void>();
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
    const routeParamId = this.route.snapshot.paramMap.get('id');
    this.eventId = routeParamId ?? null;


    this.loadEventData().subscribe(() => {
      console.log('After loadEventData, participants:', this.participants());
      this.setupAutocompleteFields();
      this.setupFormListeners();
    });


  }

  private loadEventData(): Observable<void> {
    const routeParamId = this.route.snapshot.paramMap.get('id');
    this.eventId = routeParamId ?? null;
    return loadEventAndParticipants(
      this.eventId,
      this.eventService,
      this.event,
      this.participants,
      this.error,
      this.errorMessages
    );
  }

  private setupFormListeners(): void {
    this.participantForm.get('type')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((type) => {
        updateParticipantValidators(this.participantForm, type);
        updateAdditionalInfoValidator(this.participantForm, type);
      });

    // Clear general error on form changes
    this.participantForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.error.set(null);
      });

    // Clear field-specific server errors on input
    ['personalCode', 'registrationCode', 'additionalInfo'].forEach(field => {
      this.participantForm.get(field)?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          if (this.participantForm.get(field)?.errors?.['serverError']) {
            this.participantForm.get(field)?.setErrors(null);
          }
        });
    });
  }

  private setupAutocompleteFields(): void {
    console.log('Participants in setupAutocompleteFields:', this.participants());
    this.filteredFirstNameOptions = setupFirstNameAutocomplete(
      this.participantForm,
      this.participantService,
      this.participants()
    );

    this.filteredLastNameOptions = setupLastNameAutocomplete(
      this.participantForm,
      this.participantService,
      this.participants()
    );

    this.filteredCompanyNameOptions = setupCompanyNameAutocomplete(
      this.participantForm,
      this.participantService,
      this.participants()
    );
  }

  displayFn = displayParticipantFn;

  selectParticipant(participant: Participant): void {
    patchParticipantFormValues(this.participantForm, participant);
  }

  addParticipant(): void {
    if (this.participantForm.invalid) {
      this.error.set(this.errorMessages.invalid_form);
      this.participantForm.markAllAsTouched();
      return;
    }

    const participant = mapFormToParticipant(this.participantForm.value);

    if (!this.eventId) {
      console.error('Event ID is missing');
      this.error.set(this.errorMessages.participant_add_failed);
      return;
    }

    this.participantService.createParticipant(participant).pipe(
      switchMap(newParticipant => {
        if (!newParticipant.id) {
          return throwError(() => new Error('New participant ID is missing'));
        }
        return this.eventService.addParticipantToEvent(+this.eventId!, {
          id: newParticipant.id,
          type: newParticipant.type
        }).pipe(
          map(() => newParticipant)
        );
      })
    ).subscribe({
      next: (newParticipant) => {
        this.participants.update((parts) => [...parts, newParticipant]);
        resetParticipantForm(this.participantForm);
        this.error.set(null);
        this.router.navigate(['/events']);
      },
      error: (err) => {
        console.error('Error in participant creation or event assignment:', err);
        this.handleServerError(err, this.participantForm.value);
      }
    });
  }

  private handleServerError(err: any, formValue: any): void {
    if (err.status === 409) {
      const searchField = formValue.type === 'PERSON' ? 'personalCode' : 'registrationCode';
      const searchValue = formValue.type === 'PERSON' ? formValue.personalCode : formValue.registrationCode;

      if (!searchValue) {
        console.warn('No search value for existing participant:', formValue);
        this.error.set(this.errorMessages.participant_add_failed);
        return;
      }

      this.participantService.searchParticipants(searchValue, formValue.type, searchField).subscribe({
        next: (existingParticipants) => {
          const existingParticipant = existingParticipants.find(p =>
            (formValue.type === 'PERSON' && p.personalCode === formValue.personalCode) ||
            (formValue.type === 'COMPANY' && p.registrationCode === formValue.registrationCode)
          );

          if (!existingParticipant || !existingParticipant.id) {
            console.warn('No matching existing participant found:', existingParticipants);
            this.error.set(this.errorMessages.participant_add_failed);
            return;
          }

          this.eventService.addParticipantToEvent(+this.eventId!, {
            id: existingParticipant.id,
            type: existingParticipant.type
          }).subscribe({
            next: () => {
              this.participants.update((parts) => [...parts, existingParticipant]);
              resetParticipantForm(this.participantForm);
              this.error.set(null);
              this.router.navigate(['/events']);
            },
            error: (eventErr) => {
              console.error('Failed to add existing participant to event:', eventErr);
              if (eventErr.status === 409) {
                this.error.set(this.errorMessages.participant_already_added);
                if (formValue.type === 'PERSON') {
                  this.participantForm.get('personalCode')?.setErrors({ serverError: this.errorMessages.duplicate_personal_code });
                } else {
                  this.participantForm.get('registrationCode')?.setErrors({ serverError: this.errorMessages.duplicate_registration_code });
                }
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
    } else if (err.status === 400) {
      if (err.error.message?.includes('additional info exceeds maximum length')) {
        this.error.set(this.errorMessages.additional_info_too_long);
        this.participantForm.get('additionalInfo')?.setErrors({ serverError: this.errorMessages.additional_info_too_long });
      } else if (err.error.message?.includes('personal code')) {
        this.participantForm.get('personalCode')?.setErrors({ serverError: this.errorMessages.invalid_personal_code });
        this.error.set(this.errorMessages.invalid_personal_code);
      } else if (err.error.message?.includes('Invalid registration code format')) {
        this.participantForm.get('registrationCode')?.setErrors({ serverError: this.errorMessages.invalid_registration_code });
        this.error.set(this.errorMessages.invalid_registration_code);
      } else {
        this.error.set(this.errorMessages.participant_add_failed);
      }
    } else {
      this.error.set(this.errorMessages.participant_add_failed);
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
