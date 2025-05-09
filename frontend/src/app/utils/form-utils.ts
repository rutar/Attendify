import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Participant } from '../models/participant.model';
import { Observable, of } from 'rxjs';
import {catchError, debounceTime, distinctUntilChanged, map, switchMap, tap} from 'rxjs/operators';
import { ParticipantService } from '../services/participant.service';
import {EventService} from '../services/event.service';
import {WritableSignal} from '@angular/core';
import {EventData} from '../models/event.model';

// Constants for form configuration
export const PERSON_ADDITIONAL_INFO_MAX_LENGTH = 1000;
export const COMPANY_ADDITIONAL_INFO_MAX_LENGTH = 5000;

// Standard error messages
export interface ErrorMessages {
  event_load_failed: string;
  participants_load_failed: string;
  participant_add_failed: string;
  participant_delete_failed: string;
  invalid_form: string;
  participant_already_added?: string;
  additional_info_too_long?: string;
  duplicate_personal_code?: string;
  duplicate_registration_code?: string;
  invalid_personal_code?: string;
  invalid_registration_code?: string;
}

export const DEFAULT_ERROR_MESSAGES: ErrorMessages = {
  event_load_failed: 'Ürituse andmete laadimine ebaõnnestus',
  participants_load_failed: 'Osalejate nimekirja laadimine ebaõnnestus',
  participant_add_failed: 'Osaleja lisamine ebaõnnestus',
  participant_delete_failed: 'Osaleja kustutamine ebaõnnestus',
  invalid_form: 'Palun täitke kohustuslikud väljad korrektselt',
  participant_already_added: 'Osaleja on juba üritusele lisatud',
  additional_info_too_long: 'Lisainfo on liiga pikk',
  duplicate_personal_code: 'See isikukood on juba registreeritud',
  duplicate_registration_code: 'See registrikood on juba registreeritud',
  invalid_personal_code: 'Isikukood on vigane',
  invalid_registration_code: 'Registrikood peab olema 8-kohaline number'
};

/**
 * Updates form validators based on participant type
 */
export function updateParticipantValidators(form: FormGroup, type: string | null): void {
  // Fields for person and company participant types
  const personControls = ['firstName', 'lastName', 'personalCode'];
  const companyControls = ['companyName', 'registrationCode', 'participantCount'];

  // Update validators based on type
  if (type === 'PERSON') {
    personControls.forEach((control) =>
      form.get(control)?.setValidators([Validators.required])
    );
    companyControls.forEach((control) => form.get(control)?.clearValidators());

    // Special case for registration code
    form.get('registrationCode')?.setValidators([Validators.pattern(/^\d{8}$/)]);
  } else if (type === 'COMPANY') {
    companyControls.forEach((control) => {
      if (control === 'participantCount') {
        form.get(control)?.setValidators([Validators.required, Validators.min(1)]);
      } else if (control === 'registrationCode') {
        form.get(control)?.setValidators([Validators.required, Validators.pattern(/^\d{8}$/)]);
      } else {
        form.get(control)?.setValidators([Validators.required]);
      }
    });
    personControls.forEach((control) => form.get(control)?.clearValidators());
  } else {
    // If type is null, clear all validators
    personControls.concat(companyControls).forEach((control) =>
      form.get(control)?.clearValidators()
    );
  }

  // Update validity for all fields
  personControls.concat(companyControls).forEach((control) =>
    form.get(control)?.updateValueAndValidity()
  );
}

/**
 * Updates the additionalInfo validator based on participant type
 */
export function updateAdditionalInfoValidator(form: FormGroup, type: string): void {
  const additionalInfoControl = form.get('additionalInfo');
  if (type === 'PERSON') {
    additionalInfoControl?.setValidators([Validators.maxLength(PERSON_ADDITIONAL_INFO_MAX_LENGTH)]);
  } else if (type === 'COMPANY') {
    additionalInfoControl?.setValidators([Validators.maxLength(COMPANY_ADDITIONAL_INFO_MAX_LENGTH)]);
  }
  additionalInfoControl?.updateValueAndValidity();
}

/**
 * Creates the participant form with default configuration
 */
export function createParticipantForm(fb: FormBuilder): FormGroup {
  return fb.group({
    type: ['PERSON', Validators.required],
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
    additionalInfo: ['', Validators.maxLength(PERSON_ADDITIONAL_INFO_MAX_LENGTH)]
  });
}

/**
 * Resets the participant form to default values
 */
export function resetParticipantForm(form: FormGroup): void {
  form.reset({
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
  updateParticipantValidators(form, 'PERSON');
  updateAdditionalInfoValidator(form, 'PERSON');
}

/**
 * Maps form values to a Participant object
 */
export function mapFormToParticipant(formValue: any): Participant {
  return {
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
}

/**
 * Formats participant display name
 */
export function displayParticipantFn(participant: Participant | string): string {
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

/**
 * Sets up autocomplete for participant first name search
 */
export function setupFirstNameAutocomplete(
  form: FormGroup,
  participantService: ParticipantService,
  existingParticipants: Participant[]
): Observable<Participant[]> {
  return form.get('firstName')!.valueChanges.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(value => {
      if (typeof value === 'string' && value) {
        return participantService.searchParticipants(value, 'PERSON', 'firstName').pipe(
          map(participants => participants.filter(
            p => !existingParticipants.some(existing => existing.id === p.id)
          ))
        );
      }
      return of([]);
    })
  );
}

/**
 * Sets up autocomplete for participant last name search
 */
export function setupLastNameAutocomplete(
  form: FormGroup,
  participantService: ParticipantService,
  existingParticipants: Participant[]
): Observable<Participant[]> {
  return form.get('lastName')!.valueChanges.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(value => {
      if (typeof value === 'string' && value) {
        return participantService.searchParticipants(value, 'PERSON', 'lastName').pipe(
          map(participants => participants.filter(
            p => !existingParticipants.some(existing => existing.id === p.id)
          ))
        );
      }
      return of([]);
    })
  );
}

/**
 * Sets up autocomplete for company name search
 */
export function setupCompanyNameAutocomplete(
  form: FormGroup,
  participantService: ParticipantService,
  existingParticipants: Participant[]
): Observable<Participant[]> {
  return form.get('companyName')!.valueChanges.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(value => {
      if (typeof value === 'string' && value) {
        return participantService.searchParticipants(value, 'COMPANY', 'companyName').pipe(
          map(participants => participants.filter(
            p => p.companyName &&
              p.companyName.trim() !== '' &&
              !existingParticipants.some(existing => existing.id === p.id)
          ))
        );
      }
      return of([]);
    })
  );
}

/**
 * Patch form values when selecting an existing participant
 */
export function patchParticipantFormValues(form: FormGroup, participant: Participant): void {
  let participantType: 'PERSON' | 'COMPANY' | null = null;
  if (participant.firstName || participant.lastName) {
    participantType = 'PERSON';
  } else if (participant.companyName) {
    participantType = 'COMPANY';
  }

  form.patchValue({
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

  updateParticipantValidators(form, participantType);
  updateAdditionalInfoValidator(form, participantType || 'PERSON');
}


export function loadEventAndParticipants(
  eventId: string | null,
  eventService: EventService,
  event: WritableSignal<EventData | null>,
  participants: WritableSignal<Participant[]>,
  error: WritableSignal<string | null | undefined>,
  errorMessages: any
): Observable<void> {
  if (!eventId) {
    error.set(errorMessages.event_load_failed);
    participants.set([]);
    return of(void 0);
  }

  return eventService.getEvent(+eventId).pipe(
    tap((eventData) => event.set(eventData)),
    switchMap(() =>
      eventService.getEventParticipants(+eventId).pipe(
        tap((eventParticipants) => {
          console.log('Participants loaded:', eventParticipants);
          participants.set(eventParticipants || []);
        }),
        catchError((err) => {
          console.error('Failed to load participants:', err);
          error.set(errorMessages.participants_load_failed); // Fixed key name here
          participants.set([]);
          return of([]);
        })
      )
    ),
    map(() => void 0),
    catchError((err) => {
      console.error('Failed to load event:', err);
      error.set(errorMessages.event_load_failed);
      participants.set([]);
      return of(void 0);
    })
  );
}
