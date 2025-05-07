import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ParticipantService } from '../../services/participant.service';
import { Participant } from '../../models/participant.model';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import {mapFormToParticipant} from '../../utils/form-utils';

interface ErrorMessages {
  participant_load_failed: string;
  participant_save_failed: string;
  invalid_form: string;
  duplicate_personal_code: string;
  duplicate_registration_code: string;
  invalid_personal_code: string;
  invalid_registration_code: string;
  additional_info_too_long: string;
  invalid_participant_type: string;
  unknown_participant_type: string;
  undefined_participant_type: string;
}

@Component({
  selector: 'app-participant-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './participant-detail.component.html',
  styleUrls: ['./participant-detail.component.scss'],
})
export class ParticipantDetailComponent implements OnInit {
  participantForm: FormGroup;
  isEditMode = signal(false);
  error = signal<string | null>(null);
  private destroy$ = new Subject<void>();
  private readonly PERSON_ADDITIONAL_INFO_MAX_LENGTH = 1000;
  private readonly COMPANY_ADDITIONAL_INFO_MAX_LENGTH = 5000;

  private errorMessages: ErrorMessages = {
    participant_load_failed: 'Osavõtja andmete laadimine ebaõnnestus',
    participant_save_failed: 'Osavõtja salvestamine ebaõnnestus',
    invalid_form: 'Palun täitke kohustuslikud väljad korrektselt',
    duplicate_personal_code: 'See isikukood on juba registreeritud',
    duplicate_registration_code: 'See registrikood on juba registreeritud',
    invalid_personal_code: 'Isikukood on vigane',
    invalid_registration_code: 'Registrikood peab olema 8-kohaline number',
    additional_info_too_long: 'Lisainfo ei tohi ületada {max} tähemärki',
    invalid_participant_type: 'Osaleja tüüpi ei saa muuta (praegune tüüp: {type})',
    unknown_participant_type: 'Tundmatu osaleja tüüp',
    undefined_participant_type: 'Osaleja tüüp on määramata'
  };

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private participantService: ParticipantService,
    private cdr: ChangeDetectorRef
  ) {
    this.participantForm = this.fb.group({
      type: ['PERSON', [Validators.required, Validators.pattern(/^(PERSON|COMPANY)$/)]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      personalCode: ['', Validators.required],
      companyName: [''],
      registrationCode: ['', [Validators.pattern(/^\d{8}$/)]],
      participantCount: [null, [Validators.min(1)]],
      contactPerson: [''],
      paymentMethod: [null, Validators.required],
      email: [''],
      phone: [''],
      additionalInfo: ['', Validators.maxLength(this.PERSON_ADDITIONAL_INFO_MAX_LENGTH)]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isEditMode.set(!!id);

    this.participantForm.get('type')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((type) => {
        //console.log('Type changed to:', type);
        this.updateValidators(type);
        this.updateAdditionalInfoValidator(type);
      });

    // Clear general error on significant form changes
    this.participantForm.valueChanges
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (this.error()) {
          //console.log('Clearing general error due to form change');
          this.error.set(null);
          this.cdr.detectChanges();
        }
      });

    // Clear field-specific server errors on input
    ['personalCode', 'registrationCode', 'additionalInfo'].forEach(field => {
      this.participantForm.get(field)?.valueChanges
        .pipe(
          debounceTime(300),
          takeUntil(this.destroy$)
        )
        .subscribe(() => {
          const control = this.participantForm.get(field);
          if (control?.errors?.['serverError']) {
            //console.log(`Clearing server error for ${field}`);
            control.setErrors(null);
            this.cdr.detectChanges();
          }
        });
    });

    if (this.isEditMode()) {
      this.participantService.getParticipant(Number(id)).subscribe({
        next: (participant) => {
          if (participant) {
            //console.log('Loaded participant type:', participant.type);
            if (participant.type !== 'PERSON' && participant.type !== 'COMPANY') {
              console.error('Invalid participant type received:', participant.type);
              this.error.set(this.errorMessages.unknown_participant_type);
              this.cdr.detectChanges();
              return;
            }
            this.participantForm.patchValue({
              type: participant.type,
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
            //console.log('Type after patchValue:', this.participantForm.get('type')?.value);
            this.updateValidators(participant.type);
            this.updateAdditionalInfoValidator(participant.type);
            // Disable type field in edit mode to prevent mismatch
            this.participantForm.get('type')?.disable();
            //console.log('Type after disable:', this.participantForm.get('type')?.value);
            //console.log('Form raw value:', this.participantForm.getRawValue());
          } else {
            this.error.set(this.errorMessages.participant_load_failed);
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          console.error('Failed to load participant:', err);
          this.error.set(this.errorMessages.participant_load_failed);
          this.cdr.detectChanges();
        }
      });
    } else {
      this.updateValidators('PERSON');
      this.updateAdditionalInfoValidator('PERSON');
    }
  }

  private updateValidators(type: 'PERSON' | 'COMPANY'): void {
    const firstName = this.participantForm.get('firstName');
    const lastName = this.participantForm.get('lastName');
    const personalCode = this.participantForm.get('personalCode');
    const companyName = this.participantForm.get('companyName');
    const registrationCode = this.participantForm.get('registrationCode');
    const participantCount = this.participantForm.get('participantCount');

    if (type === 'PERSON') {
      firstName?.setValidators(Validators.required);
      lastName?.setValidators(Validators.required);
      personalCode?.setValidators(Validators.required);
      companyName?.clearValidators();
      registrationCode?.clearValidators();
      participantCount?.clearValidators();
    } else {
      firstName?.clearValidators();
      lastName?.clearValidators();
      personalCode?.clearValidators();
      companyName?.setValidators(Validators.required);
      registrationCode?.setValidators([Validators.required, Validators.pattern(/^\d{8}$/)]);
      participantCount?.setValidators([Validators.required, Validators.min(1)]);
    }

    firstName?.updateValueAndValidity();
    lastName?.updateValueAndValidity();
    personalCode?.updateValueAndValidity();
    companyName?.updateValueAndValidity();
    registrationCode?.updateValueAndValidity();
    participantCount?.updateValueAndValidity();
  }

  private updateAdditionalInfoValidator(type: 'PERSON' | 'COMPANY'): void {
    const additionalInfoControl = this.participantForm.get('additionalInfo');
    if (type === 'PERSON') {
      additionalInfoControl?.setValidators([Validators.maxLength(this.PERSON_ADDITIONAL_INFO_MAX_LENGTH)]);
    } else {
      additionalInfoControl?.setValidators([Validators.maxLength(this.COMPANY_ADDITIONAL_INFO_MAX_LENGTH)]);
    }
    additionalInfoControl?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.participantForm.invalid) {
      this.error.set(this.errorMessages.invalid_form);
      this.participantForm.markAllAsTouched();
      this.cdr.detectChanges();
      //console.log('Form invalid, errors:', this.participantForm.errors);
      return;
    }

    const formValue = this.participantForm.getRawValue();
    //console.log('Submitting participant with type (raw value):', formValue.type);
    if (!formValue.type || (formValue.type !== 'PERSON' && formValue.type !== 'COMPANY')) {
      console.error('Invalid or undefined form type before submission:', formValue.type);
      this.error.set(this.errorMessages.undefined_participant_type);
      this.cdr.detectChanges();
      return;
    }

    const participant: Participant =  mapFormToParticipant(formValue)

    const id = Number(this.route.snapshot.paramMap.get('id'));
    participant.id = id;
    this.participantService.updateParticipant(id, participant).subscribe({
      next: () => {
        this.router.navigate(['/events']);
      },
      error: (err) => {
        console.error('Error updating participant:', {
          status: err.status,
          error: err.error,
          message: err.message
        });
        this.handleServerError(err, formValue);
      }
    });
  }

  private handleServerError(err: any, formValue: any): void {
    /*console.log('Handling server error:', {
      status: err.status,
      error: err.error,
      message: err.message
    });*/

    const errorMessage = typeof err.error === 'object' && err.error?.message
      ? err.error.message
      : typeof err.error === 'string'
        ? err.error
        : err.message || 'Tundmatu viga';

    if (err.status === 409) {
      const isPerson = formValue.type === 'PERSON';
      this.error.set(isPerson
        ? this.errorMessages.duplicate_personal_code
        : this.errorMessages.duplicate_registration_code);
      const control = this.participantForm.get(isPerson ? 'personalCode' : 'registrationCode');
      control?.setErrors({ serverError: isPerson
          ? this.errorMessages.duplicate_personal_code
          : this.errorMessages.duplicate_registration_code });
      control?.markAsTouched();
      //console.log(`${isPerson ? 'personalCode' : 'registrationCode'} errors:`, control?.errors);
    } else if (err.status === 400) {
      if (errorMessage.includes('additional info exceeds maximum length')) {
        const maxLength = formValue.type === 'PERSON'
          ? this.PERSON_ADDITIONAL_INFO_MAX_LENGTH
          : this.COMPANY_ADDITIONAL_INFO_MAX_LENGTH;
        const control = this.participantForm.get('additionalInfo');
        control?.setErrors({ serverError: this.errorMessages.additional_info_too_long.replace('{max}', maxLength.toString()) });
        control?.markAsTouched();
        //console.log('additionalInfo errors:', control?.errors);
        this.error.set(this.errorMessages.additional_info_too_long.replace('{max}', maxLength.toString()));
      } else if (errorMessage.includes('personal code')) {
        const control = this.participantForm.get('personalCode');
        control?.setErrors({ serverError: this.errorMessages.invalid_personal_code });
        control?.markAsTouched();
        //console.log('personalCode errors:', control?.errors);
        this.error.set(this.errorMessages.invalid_personal_code);
      } else if (errorMessage.includes('registration code')) {
        const control = this.participantForm.get('registrationCode');
        control?.setErrors({ serverError: this.errorMessages.invalid_registration_code });
        control?.markAsTouched();
        //console.log('registrationCode errors:', control?.errors);
        this.error.set(this.errorMessages.invalid_registration_code);
      } else if (errorMessage.includes('Participant type mismatch')) {
        const currentType = formValue.type === 'PERSON' ? 'Eraisik' : 'Ettevõte';
        this.error.set(this.errorMessages.invalid_participant_type.replace('{type}', currentType));
      } else if (errorMessage.includes('unknown participant type')) {
        this.error.set(this.errorMessages.undefined_participant_type);
      } else {
        this.error.set(this.errorMessages.participant_save_failed);
      }
    } else {
      this.error.set(this.errorMessages.participant_save_failed);
    }
    this.cdr.detectChanges();
  }

  private getEventId(): string | null {
    for (const snapshot of this.route.snapshot.pathFromRoot) {
      if (snapshot.paramMap.has('id') && snapshot.routeConfig?.path?.includes('events/:id')) {
        return snapshot.paramMap.get('id');
      }
    }
    return null;
  }

  goBack(): void {
    const eventId = this.getEventId();
    //console.log('Retrieved event_id:', eventId);
    if (eventId) {
      this.router.navigate([`/events/${eventId}/participants`]);
    } else {
      console.warn('No event_id found, navigating to /events');
      this.router.navigate(['/events']);
    }
  }
}
