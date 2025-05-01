import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ParticipantCreateComponent } from './participant-create.component';
import { ParticipantService } from '../../services/participant.service';
import { EventService } from '../../services/event.service';
import { Participant } from '../../models/participant.model';
import { EventData } from '../../models/event.model';
import { By } from '@angular/platform-browser';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('ParticipantCreateComponent', () => {
  let component: ParticipantCreateComponent;
  let fixture: ComponentFixture<ParticipantCreateComponent>;
  let participantServiceSpy: jasmine.SpyObj<ParticipantService>;
  let eventServiceSpy: jasmine.SpyObj<EventService>;

  const mockEventData: EventData = {
    id: 1,
    name: 'Test Event',
    dateTime: '2025-05-01T10:00:00',
    location: 'Test Location',
    totalParticipants: 1,
    status: 'ACTIVE',
    additionalInfo: 'Test additional info',
    createdAt: '2025-04-25T08:00:00',
    updatedAt: '2025-04-25T08:00:00'
  };

  const mockParticipants: Participant[] = [
    {
      id: 1,
      type: 'PERSON',
      firstName: 'Test',
      lastName: 'Person',
      personalCode: '12345678901',
      paymentMethod: 'CARD'
    }
  ];

  const mockActivatedRoute = {
    snapshot: {
      paramMap: {
        get: (param: string) => {
          if (param === 'id') {
            return '1';
          }
          return null;
        }
      }
    }
  };

  beforeEach(async () => {
    // Create spies for services
    participantServiceSpy = jasmine.createSpyObj('ParticipantService',
      ['createParticipant', 'deleteParticipant']);
    eventServiceSpy = jasmine.createSpyObj('EventService',
      ['getEvent', 'getEventParticipants', 'addParticipantToEvent', 'removeParticipantFromEvent']);

    // Configure spy return values
    eventServiceSpy.getEvent.and.returnValue(of(mockEventData));
    eventServiceSpy.getEventParticipants.and.returnValue(of(mockParticipants));

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        RouterModule,
        ParticipantCreateComponent
      ],
      providers: [
        { provide: ParticipantService, useValue: participantServiceSpy },
        { provide: EventService, useValue: eventServiceSpy },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ParticipantCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load event data and participants on init', () => {
    expect(eventServiceSpy.getEvent).toHaveBeenCalledWith(1);
    expect(eventServiceSpy.getEventParticipants).toHaveBeenCalledWith(1);
    expect(component.event()).toEqual(mockEventData);
    expect(component.participants()).toEqual(mockParticipants);
  });

  it('should initialize the form with default PERSON type', () => {
    expect(component.participantForm.get('type')?.value).toBe('PERSON');
    expect(component.participantForm.get('firstName')?.validator).toBeTruthy();
    expect(component.participantForm.get('lastName')?.validator).toBeTruthy();
    expect(component.participantForm.get('personalCode')?.validator).toBeTruthy();
  });

  it('should update validators when type changes to COMPANY', () => {
    component.participantForm.get('type')?.setValue('COMPANY');
    fixture.detectChanges();

    expect(component.participantForm.get('companyName')?.validator).toBeTruthy();
    expect(component.participantForm.get('registrationCode')?.validator).toBeTruthy();
    expect(component.participantForm.get('firstName')?.validator).toBeFalsy();
  });

  it('should show error when form is invalid and submitted', () => {
    // Try to submit without filling required fields
    const submitButton = fixture.debugElement.query(By.css('button[type="submit"]'));
    submitButton.nativeElement.click();
    fixture.detectChanges();

    expect(component.error()).toBe('Palun täitke kohustuslikud väljad korrektselt');
    expect(participantServiceSpy.createParticipant).not.toHaveBeenCalled();
  });

  it('should successfully add a person participant', fakeAsync(() => {
    const newParticipant: Participant = {
      id: 2,
      type: 'PERSON',
      firstName: 'New',
      lastName: 'Person',
      personalCode: '38712345678',
      paymentMethod: 'CARD'
    };

    participantServiceSpy.createParticipant.and.returnValue(of(newParticipant));
    eventServiceSpy.addParticipantToEvent.and.returnValue(of(newParticipant));

    // Fill form
    component.participantForm.setValue({
      type: 'PERSON',
      firstName: 'New',
      lastName: 'Person',
      personalCode: '38712345678',
      companyName: '',
      registrationCode: '',
      participantCount: null,
      contactPerson: '',
      paymentMethod: 'CARD',
      email: '',
      phone: '',
      additionalInfo: ''
    });

    component.addParticipant();
    tick();

    expect(participantServiceSpy.createParticipant).toHaveBeenCalled();
    expect(eventServiceSpy.addParticipantToEvent).toHaveBeenCalledWith(1, { id: 2, type: 'PERSON' });
    expect(component.participants().length).toBe(2);
    expect(component.participants()[1]).toEqual(newParticipant);
  }));

  it('should successfully add a company participant', fakeAsync(() => {
    const newCompany: Participant = {
      id: 3,
      type: 'COMPANY',
      companyName: 'Test Company',
      registrationCode: '12345678',
      paymentMethod: 'BANK_TRANSFER'
    };

    participantServiceSpy.createParticipant.and.returnValue(of(newCompany));
    eventServiceSpy.addParticipantToEvent.and.returnValue(of(newCompany));

    // Switch to company type
    component.participantForm.get('type')?.setValue('COMPANY');
    fixture.detectChanges();

    // Fill form
    component.participantForm.patchValue({
      companyName: 'Test Company',
      registrationCode: '12345678',
      paymentMethod: 'BANK_TRANSFER'
    });

    component.addParticipant();
    tick();

    expect(participantServiceSpy.createParticipant).toHaveBeenCalled();
    expect(eventServiceSpy.addParticipantToEvent).toHaveBeenCalledWith(1, { id: 3, type: 'COMPANY' });
    expect(component.participants().length).toBe(2);
    expect(component.participants()[1]).toEqual(newCompany);
  }));

  it('should handle error when creating participant fails', fakeAsync(() => {
    participantServiceSpy.createParticipant.and.returnValue(throwError(() => new Error('Server error')));

    // Fill form with valid data
    component.participantForm.setValue({
      type: 'PERSON',
      firstName: 'New',
      lastName: 'Person',
      personalCode: '38712345678',
      companyName: '',
      registrationCode: '',
      participantCount: null,
      contactPerson: '',
      paymentMethod: 'CARD',
      email: '',
      phone: '',
      additionalInfo: ''
    });

    component.addParticipant();
    tick();

    expect(participantServiceSpy.createParticipant).toHaveBeenCalled();
    expect(component.error()).toBe('Osaleja lisamine ebaõnnestus');
    expect(component.participants().length).toBe(1); // No new participant added
  }));

  it('should handle error when adding participant to event fails', fakeAsync(() => {
    const newParticipant: Participant = {
      id: 2,
      type: 'PERSON',
      firstName: 'New',
      lastName: 'Person',
      personalCode: '38712345678',
      paymentMethod: 'CARD'
    };

    participantServiceSpy.createParticipant.and.returnValue(of(newParticipant));
    eventServiceSpy.addParticipantToEvent.and.returnValue(throwError(() => new Error('Server error')));

    // Fill form
    component.participantForm.setValue({
      type: 'PERSON',
      firstName: 'New',
      lastName: 'Person',
      personalCode: '38712345678',
      companyName: '',
      registrationCode: '',
      participantCount: null,
      contactPerson: '',
      paymentMethod: 'CARD',
      email: '',
      phone: '',
      additionalInfo: ''
    });

    component.addParticipant();
    tick();

    expect(participantServiceSpy.createParticipant).toHaveBeenCalled();
    expect(eventServiceSpy.addParticipantToEvent).toHaveBeenCalled();
    expect(component.error()).toBe('Osaleja lisamine ebaõnnestus');
  }));

  it('should delete a participant', fakeAsync(() => {
    eventServiceSpy.removeParticipantFromEvent.and.returnValue(of(undefined));

    component.deleteParticipant(1);
    tick();

    expect(eventServiceSpy.removeParticipantFromEvent).toHaveBeenCalledWith(1, 1);
    expect(component.participants().length).toBe(0);
    expect(component.error()).toBeNull();
  }));

  it('should handle error when deleting participant fails', fakeAsync(() => {
    eventServiceSpy.removeParticipantFromEvent.and.returnValue(throwError(() => new Error('Server error')));

    component.deleteParticipant(1);
    tick();

    expect(eventServiceSpy.removeParticipantFromEvent).toHaveBeenCalledWith(1, 1);
    expect(component.participants().length).toBe(1); // Participant not removed
    expect(component.error()).toBe('Osaleja kustutamine ebaõnnestus');
  }));

  it('should reset form after successful participant creation', fakeAsync(() => {
    const newParticipant: Participant = {
      id: 2,
      type: 'PERSON',
      firstName: 'New',
      lastName: 'Person',
      personalCode: '38712345678',
      paymentMethod: 'CARD'
    };

    participantServiceSpy.createParticipant.and.returnValue(of(newParticipant));
    eventServiceSpy.addParticipantToEvent.and.returnValue(of(newParticipant));

    // Fill form and change some values
    component.participantForm.setValue({
      type: 'PERSON',
      firstName: 'New',
      lastName: 'Person',
      personalCode: '38712345678',
      companyName: '',
      registrationCode: '',
      participantCount: null,
      contactPerson: '',
      paymentMethod: 'CARD',
      email: 'test@example.com',
      phone: '+3725512345',
      additionalInfo: 'Test info'
    });

    component.addParticipant();
    tick();

    // Check form is reset
    expect(component.participantForm.get('firstName')?.value).toBe('');
    expect(component.participantForm.get('lastName')?.value).toBe('');
    expect(component.participantForm.get('personalCode')?.value).toBe('');
    expect(component.participantForm.get('paymentMethod')?.value).toBeNull();
    expect(component.participantForm.get('email')?.value).toBe('');
    expect(component.participantForm.get('phone')?.value).toBe('');
    expect(component.participantForm.get('additionalInfo')?.value).toBe('');
    expect(component.error()).toBeNull();
  }));

  it('should correctly show UI elements based on participant type', () => {
    // Check person fields are visible by default
    let personFields = fixture.debugElement.query(By.css('#firstName'));
    expect(personFields).toBeTruthy();

    let companyFields = fixture.debugElement.query(By.css('#companyName'));
    expect(companyFields).toBeFalsy();

    // Switch to company
    component.participantForm.get('type')?.setValue('COMPANY');
    fixture.detectChanges();

    // Check company fields are now visible
    personFields = fixture.debugElement.query(By.css('#firstName'));
    expect(personFields).toBeFalsy();

    companyFields = fixture.debugElement.query(By.css('#companyName'));
    expect(companyFields).toBeTruthy();
  });

  it('should show validation errors when fields are touched and invalid', () => {
    // Mark fields as touched
    component.participantForm.get('firstName')?.setValue('');
    component.participantForm.get('firstName')?.markAsTouched();
    fixture.detectChanges();

    const errorMsg = fixture.debugElement.query(By.css('.error-msg'));
    expect(errorMsg).toBeTruthy();
    expect(errorMsg.nativeElement.textContent.trim()).toBe('Eesnimi on kohustuslik');
  });
});
