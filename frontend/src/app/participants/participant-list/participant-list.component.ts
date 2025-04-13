import {Component, OnInit, Signal, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ParticipantService } from '../../services/participant.service';
import { EventService } from '../../services/event.service';
import { Participant } from '../../models/participant.model';
import { Event } from '../../models/event.model';

@Component({
  selector: 'app-participant-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './participant-list.component.html',
  styleUrls: ['./participant-list.component.scss'],
})
export class ParticipantListComponent implements OnInit {
  event = signal<Event | null>(null);
  participantForm: FormGroup;
  selectedType = signal<'person' | 'company'>('person');
  error = signal<string | null>(null);
  participants!: Signal<Participant[]>; // Non-null assertion

  constructor(
    private fb: FormBuilder,
    private participantService: ParticipantService,
    private eventService: EventService,
    private route: ActivatedRoute
  ) {
    this.participantForm = this.fb.group({
      type: ['person', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      idCode: ['', Validators.required],
      companyName: [''],
      regCode: [''],
      paymentMethod: ['sularaha', Validators.required],
      extraInfo: [''],
    });
  }

  ngOnInit(): void {
    this.participants = this.participantService.getParticipants();
    const eventId = this.route.snapshot.paramMap.get('id');
    if (eventId) {
      const events = this.eventService.getEvents()();
      const foundEvent = events.find(e => e.id === +eventId);
      this.event.set(foundEvent || null);
      this.participantService.fetchParticipants(+eventId);
    } else {
      this.participantService.fetchParticipants();
    }

    this.participantForm.get('type')?.valueChanges.subscribe(type => {
      this.selectedType.set(type);
      this.updateValidators(type);
    });
  }

  private updateValidators(type: 'person' | 'company') {
    const personControls = ['firstName', 'lastName', 'idCode'];
    const companyControls = ['companyName', 'regCode'];

    if (type === 'person') {
      personControls.forEach(control => this.participantForm.get(control)?.setValidators([Validators.required]));
      companyControls.forEach(control => this.participantForm.get(control)?.clearValidators());
    } else {
      companyControls.forEach(control => this.participantForm.get(control)?.setValidators([Validators.required]));
      personControls.forEach(control => this.participantForm.get(control)?.clearValidators());
    }

    personControls.concat(companyControls).forEach(control => this.participantForm.get(control)?.updateValueAndValidity());
  }

  addParticipant() {
    if (this.participantForm.invalid) {
      this.error.set('Palun täitke kohustuslikud väljad');
      return;
    }

    const formValue = this.participantForm.value;
    const participant: Participant = {
      id: 0, // Будет заменено бэкендом
      type: formValue.type,
      paymentMethod: formValue.paymentMethod,
      extraInfo: formValue.extraInfo,
      ...(formValue.type === 'person'
        ? {
          firstName: formValue.firstName,
          lastName: formValue.lastName,
          idCode: formValue.idCode,
        }
        : {
          companyName: formValue.companyName,
          regCode: formValue.regCode,
        }),
    };

    const eventId = this.route.snapshot.paramMap.get('id');
    this.participantService.createParticipant(participant, eventId ? +eventId : undefined).subscribe({
      next: () => {
        this.participantForm.reset({ type: this.selectedType(), paymentMethod: 'sularaha' });
        this.error.set(null);
      },
      error: () => this.error.set('Osavõtja lisamine ebaõnnestus'),
    });
  }

  deleteParticipant(participant: Participant) {
    const eventId = this.route.snapshot.paramMap.get('id');
    this.participantService.deleteParticipant(participant.id, eventId ? +eventId : undefined).subscribe({
      next: () => this.error.set(null),
      error: () => this.error.set('Osavõtja kustutamine ebaõnnestus'),
    });
  }

  trackById(index: number, participant: Participant): number {
    return participant.id;
  }
}
