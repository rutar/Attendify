import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ParticipantService } from '../../services/participant.service';
import { Participant } from '../../models/participant.model';

interface ErrorMessages {
  participant_load_failed: string;
  participant_save_failed: string;
  invalid_form: string;
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

  private errorMessages: ErrorMessages = {
    participant_load_failed: 'Osavõtja andmete laadimine ebaõnnestus',
    participant_save_failed: 'Osavõtja salvestamine ebaõnnestus',
    invalid_form: 'Palun täitke kohustuslikud väljad korrektselt'
  };

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private participantService: ParticipantService
  ) {
    this.participantForm = this.fb.group({
      type: ['PERSON', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      personalCode: ['', Validators.required],
      companyName: [''],
      registrationCode: [''],
      participantCount: [null, [Validators.min(1)]],
      contactPerson: [''],
      paymentMethod: [null, Validators.required],
      email: [''],
      phone: [''],
      additionalInfo: ['']
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isEditMode.set(!!id);

    this.participantForm.get('type')?.valueChanges.subscribe((type) => {
      this.updateValidators(type);
    });

    if (this.isEditMode()) {
      this.participantService.getParticipant(Number(id)).subscribe({
        next: (participant) => {
          if (participant) {
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
            this.updateValidators(participant.type);
          } else {
            this.error.set(this.errorMessages.participant_load_failed);
          }
        },
        error: () => this.error.set(this.errorMessages.participant_load_failed)
      });
    } else {
      this.updateValidators('PERSON');
    }
  }

  private updateValidators(type: 'PERSON' | 'COMPANY' | null): void {
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
    } else if (type === 'COMPANY') {
      firstName?.clearValidators();
      lastName?.clearValidators();
      personalCode?.clearValidators();
      companyName?.setValidators(Validators.required);
      registrationCode?.setValidators(Validators.required);
      participantCount?.setValidators([Validators.required, Validators.min(1)]);
    } else {
      firstName?.clearValidators();
      lastName?.clearValidators();
      personalCode?.clearValidators();
      companyName?.clearValidators();
      registrationCode?.clearValidators();
      participantCount?.clearValidators();
    }

    firstName?.updateValueAndValidity();
    lastName?.updateValueAndValidity();
    personalCode?.updateValueAndValidity();
    companyName?.updateValueAndValidity();
    registrationCode?.updateValueAndValidity();
    participantCount?.updateValueAndValidity();
  }

  onSubmit(): void {
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

    const id = Number(this.route.snapshot.paramMap.get('id'));
    participant.id = id;
    this.participantService.updateParticipant(id, participant).subscribe({
      next: () => this.router.navigate(['/events']),
      error: () => this.error.set(this.errorMessages.participant_save_failed)
    });
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
    console.log('Retrieved event_id:', eventId);
    if (eventId) {
      this.router.navigate([`/events/${eventId}/participants`]);
    } else {
      console.warn('No event_id found, navigating to /events');
      this.router.navigate(['/events']);
    }
  }
}
