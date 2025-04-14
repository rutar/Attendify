import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ParticipantService } from '../../services/participant.service';
import { updateParticipantValidators } from '../../utils/form-utils';
import { Person } from '../../models/person.model';
import { Company } from '../../models/company.model';

@Component({
  selector: 'app-participant-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './participant-detail.component.html',
  styleUrls: ['./participant-detail.component.scss'],
})
export class ParticipantDetailComponent implements OnInit {
  // Osavõtja vorm
  participantForm: FormGroup;
  // Muutmise režiimi signaal
  isEditMode = signal(false);
  // Vea teade
  error = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private participantService: ParticipantService
  ) {
    // Vormi initsialiseerimine
    this.participantForm = this.fb.group({
      type: ['PERSON', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      personalCode: ['', Validators.required],
      companyName: [''],
      registrationCode: [''],
      paymentMethod: ['CASH', Validators.required],
      additionalInfo: [''],
      status: ['confirmed', Validators.required], // Lisame staatuse välja
    });
  }

  // Komponendi initsialiseerimine
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isEditMode.set(!!id);

    // Tüübi muutuse jälgimine
    this.participantForm.get('type')?.valueChanges.subscribe((type) => {
      updateParticipantValidators(this.participantForm, type);
    });

    if (this.isEditMode()) {
      // Osavõtja andmete laadimine
      this.participantService.getParticipant(Number(id)).subscribe({
        next: (participant) => {
          if (participant) {
            this.participantForm.patchValue({
              type: participant.type,
              firstName: (participant as Person).firstName,
              lastName: (participant as Person).lastName,
              personalCode: (participant as Person).personalCode,
              companyName: (participant as Company).companyName,
              registrationCode: (participant as Company).registrationCode,
              paymentMethod: participant.paymentMethod,
              additionalInfo: participant.additionalInfo,
              status: participant.status, // Lisame staatuse
            });
            updateParticipantValidators(this.participantForm, participant.type);
          } else {
            this.error.set('Osavõtjat ei leitud');
          }
        },
        error: () => this.error.set('Osavõtja laadimine ebaõnnestus'),
      });
    } else {
      // Algsete valiidaatorite seadistamine uue osavõtja jaoks
      updateParticipantValidators(this.participantForm, 'PERSON');
    }
  }

  // Vormi esitamine
  onSubmit(): void {
    if (this.participantForm.invalid) {
      this.error.set('Palun täitke kohustuslikud väljad');
      return;
    }

    const formValue = this.participantForm.value;
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (formValue.type === 'PERSON') {
      const person: Person = {
        id: this.isEditMode() ? id : 0, // Kasutame olemasolevat ID-d või ajutist 0 uutega
        type: 'PERSON',
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        personalCode: formValue.personalCode,
        paymentMethod: formValue.paymentMethod,
        additionalInfo: formValue.additionalInfo,
        status: formValue.status || 'confirmed', // Tagame staatuse olemasolu
      };

      const action = this.isEditMode()
        ? this.participantService.updatePerson(id, person)
        : this.participantService.createPerson(person);

      // Eraisiku loomine või uuendamine
      action.subscribe({
        next: () => this.router.navigate(['/participants']),
        error: () => this.error.set('Eraisiku salvestamine ebaõnnestus'),
      });
    } else {
      const company: Company = {
        id: this.isEditMode() ? id : 0, // Kasutame olemasolevat ID-d või ajutist 0 uutega
        type: 'COMPANY',
        companyName: formValue.companyName,
        registrationCode: formValue.registrationCode,
        paymentMethod: formValue.paymentMethod,
        additionalInfo: formValue.additionalInfo,
        status: formValue.status || 'confirmed', // Tagame staatuse olemasolu
      };

      const action = this.isEditMode()
        ? this.participantService.updateCompany(id, company)
        : this.participantService.createCompany(company);

      // Ettevõtte loomine või uuendamine
      action.subscribe({
        next: () => this.router.navigate(['/participants']),
        error: () => this.error.set('Ettevõtte salvestamine ebaõnnestus'),
      });
    }
  }

  // Tagasi navigeerimine
  goBack(): void {
    this.router.navigate(['/participants']);
  }
}
