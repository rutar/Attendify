import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ParticipantService } from '../../services/participant.service';
import { EventService } from '../../services/event.service';
import { Event } from '../../models/event.model';
import { updateParticipantValidators } from '../../utils/form-utils';
import { Participant } from '../../models/participantbase.model';
import { Person } from '../../models/person.model';
import { Company } from '../../models/company.model';

@Component({
  selector: 'app-participant-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './participant-list.component.html',
  styleUrls: ['./participant-list.component.scss'],
})
export class ParticipantListComponent implements OnInit {
  // Signaal ürituse andmetele
  event = signal<Event | null>(null);
  // Signaal osavõtjate nimekirjale
  participants = signal<Participant[]>([]);
  // Osavõtja lisamise vorm
  participantForm: FormGroup;
  // Valitud osavõtja tüüp
  selectedType = signal<'PERSON' | 'COMPANY'>('PERSON');
  // Vea teade
  error = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private participantService: ParticipantService,
    private eventService: EventService,
    private route: ActivatedRoute
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
      status: ['confirmed'], // Lisame staatuse vaikimisi väärtuse
    });
  }

  // Komponendi initsialiseerimine
  ngOnInit(): void {
    const eventId = this.route.snapshot.paramMap.get('id');
    if (eventId) {
      // Laadime ürituse andmed
      this.eventService.getEvent(+eventId).subscribe({
        next: (event) => this.event.set(event),
        error: () => this.error.set('Ürituse laadimine ebaõnnestus'),
      });

      // Laadime ürituse osavõtjad
      this.eventService.getEventParticipants(+eventId).subscribe({
        next: (participants) => this.participants.set(participants),
        error: () => this.error.set('Osavõtjate laadimine ebaõnnestus'),
      });
    }

    // Vormi tüübi muutuse jälgimine
    this.participantForm.get('type')?.valueChanges.subscribe((type) => {
      this.selectedType.set(type);
      updateParticipantValidators(this.participantForm, type);
    });

    // Algsete valiidaatorite seadistamine
    updateParticipantValidators(this.participantForm, 'PERSON');
  }

  // Osavõtja lisamine
  addParticipant() {
    if (this.participantForm.invalid) {
      this.error.set('Palun täitke kohustuslikud väljad');
      return;
    }

    const formValue = this.participantForm.value;
    const eventId = this.route.snapshot.paramMap.get('id');

    if (formValue.type === 'PERSON') {
      const person: Person = {
        id: 0, // Ajutine ID, kuna server määrab tegeliku ID
        type: 'PERSON',
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        personalCode: formValue.personalCode,
        paymentMethod: formValue.paymentMethod,
        additionalInfo: formValue.additionalInfo,
        status: formValue.status || 'confirmed', // Tagame staatuse olemasolu
      };

      // Eraisiku loomine
      this.participantService.createPerson(person).subscribe({
        next: (newPerson) => {
          if (eventId) {
            // Osavõtja lisamine üritusele
            this.eventService.addParticipantToEvent(+eventId, newPerson.id, newPerson.status).subscribe({
              next: () => {
                this.participants.update((parts) => [...parts, newPerson]);
                this.resetForm();
              },
              error: () => this.error.set('Osavõtja lisamine üritusele ebaõnnestus'),
            });
          } else {
            this.participants.update((parts) => [...parts, newPerson]);
            this.resetForm();
          }
        },
        error: () => this.error.set('Eraisiku loomine ebaõnnestus'),
      });
    } else {
      const company: Company = {
        id: 0, // Ajutine ID, kuna server määrab tegeliku ID
        type: 'COMPANY',
        companyName: formValue.companyName,
        registrationCode: formValue.registrationCode,
        paymentMethod: formValue.paymentMethod,
        additionalInfo: formValue.additionalInfo,
        status: formValue.status || 'confirmed', // Tagame staatuse olemasolu
      };

      // Ettevõtte loomine
      this.participantService.createCompany(company).subscribe({
        next: (newCompany) => {
          if (eventId) {
            // Osavõtja lisamine üritusele
            this.eventService.addParticipantToEvent(+eventId, newCompany.id, newCompany.status).subscribe({
              next: () => {
                this.participants.update((parts) => [...parts, newCompany]);
                this.resetForm();
              },
              error: () => this.error.set('Osavõtja lisamine üritusele ebaõnnestus'),
            });
          } else {
            this.participants.update((parts) => [...parts, newCompany]);
            this.resetForm();
          }
        },
        error: () => this.error.set('Ettevõtte loomine ebaõnnestus'),
      });
    }
  }

  // Osavõtja kustutamine
  deleteParticipant(participant: Participant) {
    const eventId = this.route.snapshot.paramMap.get('id');
    if (eventId) {
      // Osavõtja eemaldamine ürituselt
      this.eventService.removeParticipantFromEvent(+eventId, participant.id).subscribe({
        next: () => {
          this.participants.update((parts) => parts.filter((p) => p.id !== participant.id));
          this.error.set(null);
        },
        error: () => this.error.set('Osavõtja eemaldamine ürituselt ebaõnnestus'),
      });
    } else {
      // Osavõtja täielik kustutamine
      this.participantService.deleteParticipant(participant.id).subscribe({
        next: () => {
          this.participants.update((parts) => parts.filter((p) => p.id !== participant.id));
          this.error.set(null);
        },
        error: () => this.error.set('Osavõtja kustutamine ebaõnnestus'),
      });
    }
  }

  // Vormi lähtestamine
  private resetForm() {
    this.participantForm.reset({
      type: this.selectedType(),
      paymentMethod: 'CASH',
      status: 'confirmed', // Lisame staatuse vaikimisi väärtuse
    });
    this.error.set(null);
  }

  // Osavõtja jälgimine ID järgi
  trackById(index: number, participant: Participant): number {
    return participant.id;
  }
}
