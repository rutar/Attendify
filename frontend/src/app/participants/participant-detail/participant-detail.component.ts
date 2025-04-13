import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ParticipantService } from '../../services/participant.service';
import { Participant } from '../../models/participant.model';

@Component({
  selector: 'app-participant-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './participant-detail.component.html',
  styleUrls: ['./participant-detail.component.scss'],
})
export class ParticipantDetailComponent implements OnInit {
  participantForm!: FormGroup;
  isEditMode = signal(false);
  error = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private participantService: ParticipantService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isEditMode.set(!!id);

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

    this.participantForm.get('type')?.valueChanges.subscribe(type => {
      this.updateValidators(type);
    });

    if (this.isEditMode()) {
      this.participantService.getParticipant(Number(id)).subscribe({
        next: (participant) => {
          this.participantForm.patchValue(participant);
          this.updateValidators(participant.type);
        },
        error: () => this.error.set('Osavõtja laadimine ebaõnnestus'),
      });
    }
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

  onSubmit(): void {
    if (this.participantForm.invalid) {
      this.error.set('Palun täitke kohustuslikud väljad');
      return;
    }

    const data = this.participantForm.value as Participant;
    const action = this.isEditMode()
      ? this.participantService.updateParticipant(Number(this.route.snapshot.paramMap.get('id')), data)
      : this.participantService.createParticipant(data);

    action.subscribe({
      next: () => this.router.navigate(['/participants']),
      error: () => this.error.set('Salvestamine ebaõnnestus'),
    });
  }

  goBack(): void {
    this.router.navigate(['/participants']);
  }
}
