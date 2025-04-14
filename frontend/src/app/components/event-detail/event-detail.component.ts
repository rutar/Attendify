import {Component, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, RouterModule} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {EventService} from '../../services/event.service';
import {ParticipantService} from '../../services/participant.service';
import {Event} from '../../models/event.model';
import {Participant, ParticipantStatus} from '../../models/participantbase.model';
import {Person} from '../../models/person.model';
import {Company} from '../../models/company.model';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.scss'],
})
export class EventDetailComponent implements OnInit {
  // Ürituse andmed
  event = signal<Event | null>(null);
  // Ürituse osalejate nimekiri
  participants = signal<Participant[]>([]);
  // Kõik osalejad süsteemis
  allParticipants = signal<Participant[]>([]);
  // Laadimise olek
  isLoading = signal<boolean>(true);
  // Vea teade
  error = signal<string | null>(null);
  // Valitud osaleja ID olemasoleva osaleja lisamiseks
  selectedParticipantId = signal<number | null>(null);
  // Osaleja staatuse vaikimisi väärtus
  participantStatus = signal<string>('confirmed');
  // Uue osaleja tüüp (füüsiline või juriidiline isik)
  newParticipantType = signal<'PERSON' | 'COMPANY' | null>(null);
  // Uue füüsilise isiku andmed
  newPerson = signal<Partial<Person>>({
    type: 'PERSON',
    firstName: '',
    lastName: '',
    personalCode: '',
    paymentMethod: '',
    status: ParticipantStatus.CONFIRMED, // Lisame vaikimisi staatuse
    email: '',
    phone: '',
    additionalInfo: '',
  });
  // Uue ettevõtte andmed
  newCompany = signal<Partial<Company>>({
    type: 'COMPANY',
    companyName: '',
    registrationCode: '',
    paymentMethod: '',
    status: ParticipantStatus.CONFIRMED, // Lisame vaikimisi staatuse
    participantCount: undefined,
    contactPerson: '',
    email: '',
    phone: '',
    additionalInfo: '',
  });

  constructor(
    private eventService: EventService,
    private participantService: ParticipantService,
    private route: ActivatedRoute
  ) {}

  // Komponendi initsialiseerimine
  ngOnInit(): void {
    // Laeme kõik osalejad
    this.participantService.fetchParticipants();
    // Võtame osalejate signaali väärtuse ja uuendame allParticipants
    this.allParticipants.set(this.participantService.getParticipants()());

    // Võtame URL-ist ürituse ID
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const eventId = +id;
      // Laeme ürituse andmed
      this.eventService.getEvent(eventId).subscribe({
        next: (event) => {
          this.event.set(event);
          this.isLoading.set(false);
          this.loadParticipants(eventId);
        },
        error: () => {
          this.error.set('Ürituse andmete laadimine ebaõnnestus');
          this.isLoading.set(false);
        },
      });
    }
  }

  // Laeb ürituse osalejad
  loadParticipants(eventId: number): void {
    this.eventService.getEventParticipants(eventId).subscribe({
      next: (participants) => this.participants.set(participants),
      error: () => this.error.set('Osalejate nimekirja laadimine ebaõnnestus'),
    });
  }

  // Lisab olemasoleva osaleja üritusele
  addExistingParticipant(): void {
    const eventId = this.event()?.id;
    const participantId = this.selectedParticipantId();
    if (eventId && participantId) {
      this.eventService
        .addParticipantToEvent(eventId, participantId, this.participantStatus())
        .subscribe({
          next: (participant) => {
            this.participants.update((parts) => [...parts, participant]);
            this.selectedParticipantId.set(null);
            this.participantStatus.set('confirmed');
          },
          error: () => this.error.set('Osaleja lisamine ebaõnnestus'),
        });
    }
  }

  // Loob uue osaleja ja lisab selle üritusele
  createNewParticipant(): void {
    const eventId = this.event()?.id;
    if (!eventId || !this.newParticipantType()) return;

    if (this.newParticipantType() === 'PERSON') {
      const person = this.newPerson();
      // Kontrollime kohustuslikke välju
      if (!person.firstName || !person.lastName || !person.personalCode || !person.paymentMethod) {
        this.error.set('Eesnimi, perekonnanimi, isikukood ja makseviis on kohustuslikud');
        return;
      }
      this.participantService.createPerson(person as Person).subscribe({
        next: (newPerson) => {
          this.eventService
            .addParticipantToEvent(eventId, newPerson.id, this.participantStatus())
            .subscribe({
              next: (participant) => {
                this.participants.update((parts) => [...parts, participant]);
                this.resetNewParticipantForm();
              },
              error: () => this.error.set('Osaleja lisamine üritusele ebaõnnestus'),
            });
        },
        error: () => this.error.set('Füüsilise isiku loomine ebaõnnestus'),
      });
    } else {
      const company = this.newCompany();
      // Kontrollime kohustuslikke välju
      if (!company.companyName || !company.registrationCode || !company.paymentMethod) {
        this.error.set('Ettevõtte nimi, registrikood ja makseviis on kohustuslikud');
        return;
      }
      this.participantService.createCompany(company as Company).subscribe({
        next: (newCompany) => {
          this.eventService
            .addParticipantToEvent(eventId, newCompany.id, this.participantStatus())
            .subscribe({
              next: (participant) => {
                this.participants.update((parts) => [...parts, participant]);
                this.resetNewParticipantForm();
              },
              error: () => this.error.set('Osaleja lisamine üritusele ebaõnnestus'),
            });
        },
        error: () => this.error.set('Ettevõtte loomine ebaõnnestus'),
      });
    }
  }

  // Uuendab osaleja staatust
  updateParticipantStatus(participantId: number, status: string): void {
    const eventId = this.event()?.id;
    if (eventId) {
      this.eventService.updateParticipantStatus(eventId, participantId, status).subscribe({
        next: (updatedParticipant) => {
          this.participants.update((parts) =>
            parts.map((p) => (p.id === participantId ? updatedParticipant : p))
          );
        },
        error: () => this.error.set('Osaleja staatuse uuendamine ebaõnnestus'),
      });
    }
  }

  // Eemaldab osaleja ürituselt
  removeParticipant(participantId: number): void {
    const eventId = this.event()?.id;
    if (eventId) {
      this.eventService.removeParticipantFromEvent(eventId, participantId).subscribe({
        next: () => {
          this.participants.update((parts) => parts.filter((p) => p.id !== participantId));
        },
        error: () => this.error.set('Osaleja eemaldamine ebaõnnestus'),
      });
    }
  }

  // Tagastab osaleja nime vastavalt tüübile
  getParticipantName(participant: Participant): string {
    if (participant.type === 'PERSON') {
      const person = participant as Person;
      return `${person.firstName} ${person.lastName}`;
    }
    return (participant as Company).companyName;
  }

  // Lähtestab uue osaleja vormi
  resetNewParticipantForm(): void {
    this.newParticipantType.set(null);
    this.newPerson.set({
      type: 'PERSON',
      firstName: '',
      lastName: '',
      personalCode: '',
      paymentMethod: '',
      status: ParticipantStatus.CONFIRMED,
      email: '',
      phone: '',
      additionalInfo: '',
    });
    this.newCompany.set({
      type: 'COMPANY',
      companyName: '',
      registrationCode: '',
      paymentMethod: '',
      status: ParticipantStatus.CONFIRMED,
      participantCount: undefined,
      contactPerson: '',
      email: '',
      phone: '',
      additionalInfo: '',
    });
    this.participantStatus.set('confirmed');
  }
}
