import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ParticipantCreateComponent } from './participant-create.component';
import { ParticipantService } from '../../services/participant.service';
import { EventService } from '../../services/event.service';
import { Participant } from '../../models/participant.model';
import {  EventData } from '../../models/event.model';
import { Validators } from '@angular/forms';

describe('ParticipantCreateComponent', () => {
  let component: ParticipantCreateComponent;
  let fixture: ComponentFixture<ParticipantCreateComponent>;
  let participantService: jasmine.SpyObj<ParticipantService>;
  let eventService: jasmine.SpyObj<EventService>;
  let router: Router;

  const mockEvent: EventData = {
    id: 1,
    name: 'Test Event',
    dateTime: '2025-05-07T10:00:00Z',
    totalParticipants: 0,
    status: 'ACTIVE'
  };
  const mockParticipant: Participant = {
    id: 1,
    type: 'PERSON',
    firstName: 'John',
    lastName: 'Doe',
    personalCode: '12345678901',
    paymentMethod: 'CARD'
  };

  beforeEach(async () => {
    const participantServiceSpy = jasmine.createSpyObj('ParticipantService', ['createParticipant', 'searchParticipants', 'deleteParticipant']);
    const eventServiceSpy = jasmine.createSpyObj('EventService', ['getEvent', 'getEventParticipants', 'addParticipantToEvent', 'removeParticipantFromEvent']);

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        RouterTestingModule,
        HttpClientTestingModule,
        NoopAnimationsModule,
        MatAutocompleteModule,
        MatInputModule,
        MatFormFieldModule,
        ParticipantCreateComponent
      ],
      providers: [
        { provide: ParticipantService, useValue: participantServiceSpy },
        { provide: EventService, useValue: eventServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () =>'1' } }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ParticipantCreateComponent);
    component = fixture.componentInstance;
    participantService = TestBed.inject(ParticipantService) as jasmine.SpyObj<ParticipantService>;
    eventService = TestBed.inject(EventService) as jasmine.SpyObj<EventService>;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    eventService.getEvent.and.returnValue(of(mockEvent));
    eventService.getEventParticipants.and.returnValue(of([]));
    participantService.searchParticipants.and.returnValue(of([]));
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with default values and validators for PERSON', () => {
    fixture.detectChanges();
    const form = component.participantForm;
    expect(form.get('type')?.value).toBe('PERSON');
    expect(form.get('firstName')?.hasValidator(Validators.required)).toBeTrue();
    expect(form.get('lastName')?.hasValidator(Validators.required)).toBeTrue();
    expect(form.get('personalCode')?.hasValidator(Validators.required)).toBeTrue();
    expect(form.get('companyName')?.hasValidator(Validators.required)).toBeFalse();
    expect(form.get('paymentMethod')?.hasValidator(Validators.required)).toBeTrue();
  });

  it('should load event and participants on init', () => {
    fixture.detectChanges();
    expect(eventService.getEvent).toHaveBeenCalledWith(1);
    expect(eventService.getEventParticipants).toHaveBeenCalledWith(1);
    expect(component.event()).toEqual(mockEvent);
    expect(component.participants()).toEqual([]);
  });

  it('should update validators when type changes to COMPANY', fakeAsync(() => {
    fixture.detectChanges();
    component.participantForm.get('type')?.setValue('COMPANY');
    tick();
    expect(component.participantForm.get('firstName')?.hasValidator(Validators.required)).toBeFalse();
    expect(component.participantForm.get('lastName')?.hasValidator(Validators.required)).toBeFalse();
    expect(component.participantForm.get('personalCode')?.hasValidator(Validators.required)).toBeFalse();
    expect(component.participantForm.get('companyName')?.hasValidator(Validators.required)).toBeTrue();
  }));

  it('should display error message for invalid form on submit', () => {
    fixture.detectChanges();
    component.addParticipant();
    expect(component.error()).toBe('Palun täitke kohustuslikud väljad korrektselt');
    expect(component.participantForm.touched).toBeTrue();
  });

  it('should add participant successfully and navigate', fakeAsync(() => {
    fixture.detectChanges();
    participantService.createParticipant.and.returnValue(of(mockParticipant));
    eventService.addParticipantToEvent.and.returnValue(of(mockParticipant));

    component.participantForm.patchValue({
      type: 'PERSON',
      firstName: 'John',
      lastName: 'Doe',
      personalCode: '12345678901',
      paymentMethod: 'CARD'
    });

    component.addParticipant();
    tick();

    expect(participantService.createParticipant).toHaveBeenCalledWith(jasmine.objectContaining({
      type: 'PERSON',
      firstName: 'John',
      lastName: 'Doe',
      personalCode: '12345678901',
      paymentMethod: 'CARD'
    }));
    expect(eventService.addParticipantToEvent).toHaveBeenCalledWith(1, { id: 1, type: 'PERSON' });
    expect(component.participants()).toContain(mockParticipant);
    expect(router.navigate).toHaveBeenCalledWith(['/events']);
    expect(component.participantForm.value.type).toBe('PERSON');
  }));

  it('should handle duplicate participant (409) and add existing participant', fakeAsync(() => {
    fixture.detectChanges();
    const existingParticipant: Participant = { ...mockParticipant, id: 2 };
    participantService.createParticipant.and.returnValue(throwError(() => ({ status: 409 })));
    participantService.searchParticipants.and.returnValue(of([existingParticipant]));
    eventService.addParticipantToEvent.and.returnValue(of(existingParticipant));

    component.participantForm.patchValue({
      type: 'PERSON',
      firstName: 'John',
      lastName: 'Doe',
      personalCode: '12345678901',
      paymentMethod: 'CARD'
    });

    component.addParticipant();
    tick();

    expect(participantService.searchParticipants).toHaveBeenCalledWith('12345678901', 'PERSON', 'personalCode');
    expect(eventService.addParticipantToEvent).toHaveBeenCalledWith(1, { id: 2, type: 'PERSON' });
    expect(component.participants()).toContain(existingParticipant);
    expect(router.navigate).toHaveBeenCalledWith(['/events']);
  }));

  it('should handle invalid personal code (400)', fakeAsync(() => {
    fixture.detectChanges();
    participantService.createParticipant.and.returnValue(throwError(() => ({
      status: 400,
      error: { message: 'Invalid personal code' }
    })));

    component.participantForm.patchValue({
      type: 'PERSON',
      firstName: 'John',
      lastName: 'Doe',
      personalCode: '123',
      paymentMethod: 'CARD'
    });

    component.addParticipant();
    tick();

    expect(component.error()).toBe('Isikukood on vigane');
    expect(component.participantForm.get('personalCode')?.errors).toEqual({ serverError: 'Isikukood on vigane' });
  }));

  it('should handle autocomplete selection for PERSON', fakeAsync(() => {
    fixture.detectChanges();
    const selectedParticipant: Participant = {
      type: 'PERSON',
      firstName: 'Jane',
      lastName: 'Smith',
      personalCode: '98765432109',
      paymentMethod: 'CARD',
      additionalInfo: 'Test info'
    };
    component.selectParticipant(selectedParticipant);
    tick();

    expect(component.participantForm.value).toEqual(jasmine.objectContaining({
      firstName: 'Jane',
      lastName: 'Smith',
      personalCode: '98765432109',
      paymentMethod: 'CARD',
      additionalInfo: 'Test info'
    }));
  }));

  it('should handle autocomplete selection for COMPANY', fakeAsync(() => {
    fixture.detectChanges();
    const selectedParticipant: Participant = {
      type: 'COMPANY',
      companyName: 'Test Corp',
      registrationCode: '12345678',
      participantCount: 5,
      paymentMethod: 'BANK_TRANSFER',
      additionalInfo: 'Company info'
    };
    component.selectParticipant(selectedParticipant);
    tick();

    expect(component.participantForm.value).toEqual(jasmine.objectContaining({
      companyName: 'Test Corp',
      registrationCode: '12345678',
      participantCount: 5,
      paymentMethod: 'BANK_TRANSFER',
      additionalInfo: 'Company info'
    }));
  }));

  it('should clear server errors on field input', fakeAsync(() => {
    fixture.detectChanges();
    component.participantForm.get('personalCode')?.setErrors({ serverError: 'Invalid code' });
    component.participantForm.get('personalCode')?.setValue('12345678901');
    tick();
    expect(component.participantForm.get('personalCode')?.errors).toBeNull();
  }));

  it('should delete participant successfully', () => {
    fixture.detectChanges();
    component.participants.set([mockParticipant]);
    eventService.removeParticipantFromEvent.and.returnValue(of(undefined));

    component.deleteParticipant(1);
    expect(eventService.removeParticipantFromEvent).toHaveBeenCalledWith(1, 1);
    expect(component.participants()).toEqual([]);
  });

  it('should handle participant deletion error', () => {
    fixture.detectChanges();
    component.participants.set([mockParticipant]);
    eventService.removeParticipantFromEvent.and.returnValue(throwError(() => ({ status: 500 })));

    component.deleteParticipant(1);
    expect(component.error()).toBe('Osaleja kustutamine ebaõnnestus');
    expect(component.participants()).toContain(mockParticipant);
  });

  it('should clean up subscriptions on destroy', () => {
    fixture.detectChanges();
    const destroySpy = spyOn(component['destroy$'], 'next');
    component.ngOnDestroy();
    expect(destroySpy).toHaveBeenCalled();
    expect(component['destroy$'].isStopped).toBeTrue();
  });

  it('should render form fields for PERSON type', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('#firstName')).toBeTruthy();
    expect(compiled.querySelector('#lastName')).toBeTruthy();
    expect(compiled.querySelector('#personalCode')).toBeTruthy();
    expect(compiled.querySelector('#companyName')).toBeNull();
    expect(compiled.querySelector('#registrationCode')).toBeNull();
  });

  it('should render form fields for COMPANY type', () => {
    component.participantForm.get('type')?.setValue('COMPANY');
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('#firstName')).toBeNull();
    expect(compiled.querySelector('#lastName')).toBeNull();
    expect(compiled.querySelector('#personalCode')).toBeNull();
    expect(compiled.querySelector('#companyName')).toBeTruthy();
    expect(compiled.querySelector('#registrationCode')).toBeTruthy();
    expect(compiled.querySelector('#participantCount')).toBeTruthy();
  });

  it('should display error message when form is invalid', () => {
    fixture.detectChanges();
    component.addParticipant();
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.alert.alert-danger').textContent).toContain('Palun täitke kohustuslikud väljad korrektselt');
  });
});
