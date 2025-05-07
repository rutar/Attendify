import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ParticipantCreateComponent } from './participant-create.component';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router, convertToParamMap, ParamMap } from '@angular/router';
import { ParticipantService } from '../../services/participant.service';
import { EventService } from '../../services/event.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { Participant } from '../../models/participant.model';
import { EventData } from '../../models/event.model';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatAutocompleteHarness } from '@angular/material/autocomplete/testing';
import { By } from '@angular/platform-browser';

describe('ParticipantCreateComponent', () => {
  let component: ParticipantCreateComponent;
  let fixture: ComponentFixture<ParticipantCreateComponent>;
  let participantService: jasmine.SpyObj<ParticipantService>;
  let eventService: jasmine.SpyObj<EventService>;
  let router: jasmine.SpyObj<Router>;
  let loader: HarnessLoader;

  // Mock data
  const mockEventId = '123';
  const mockEvent: EventData = {
    id: 123,
    name: 'Test Event',
    startDate: new Date(),
    endDate: new Date(),
    location: 'Test Location',
    description: 'Test Description'
  };

  const mockPersonParticipant: Participant = {
    id: 1,
    type: 'PERSON',
    firstName: 'John',
    lastName: 'Doe',
    personalCode: '12345678901',
    paymentMethod: 'CARD'
  };

  const mockCompanyParticipant: Participant = {
    id: 2,
    type: 'COMPANY',
    companyName: 'Test Company',
    registrationCode: '12345678',
    participantCount: 5,
    paymentMethod: 'BANK_TRANSFER'
  };

  const mockParticipants: Participant[] = [
    mockPersonParticipant,
    mockCompanyParticipant
  ];

  beforeEach(async () => {
    // Create spies for services
    const participantServiceSpy = jasmine.createSpyObj('ParticipantService', [
      'createParticipant',
      'searchParticipants',
      'deleteParticipant'
    ]);

    const eventServiceSpy = jasmine.createSpyObj('EventService', [
      'getEvent',
      'getEventParticipants',
      'addParticipantToEvent',
      'removeParticipantFromEvent'
    ]);

    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        MatAutocompleteModule,
        MatInputModule,
        MatFormFieldModule,
        NoopAnimationsModule,
        ParticipantCreateComponent
      ],
      providers: [
        FormBuilder,
        { provide: ParticipantService, useValue: participantServiceSpy },
        { provide: EventService, useValue: eventServiceSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (param: string) => param === 'id' ? mockEventId : null
              }
            }
          }
        }
      ]
    }).compileComponents();

    participantService = TestBed.inject(ParticipantService) as jasmine.SpyObj<ParticipantService>;
    eventService = TestBed.inject(EventService) as jasmine.SpyObj<EventService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Setup default return values for spies
    eventService.getEvent.and.returnValue(of(mockEvent));
    eventService.getEventParticipants.and.returnValue(of(mockParticipants));
    participantService.searchParticipants.and.returnValue(of([]));

    fixture = TestBed.createComponent(ParticipantCreateComponent);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with PERSON type selected by default', () => {
    expect(component.participantForm.get('type')?.value).toBe('PERSON');

    // PERSON fields should be visible
    const personFields = fixture.debugElement.query(By.css('#firstName'));
    expect(personFields).toBeTruthy();

    // COMPANY fields should not be visible
    const companyFields = fixture.debugElement.query(By.css('#companyName'));
    expect(companyFields).toBeFalsy();
  });

  it('should load event data on init', () => {
    expect(eventService.getEvent).toHaveBeenCalledWith(+mockEventId);
    expect(eventService.getEventParticipants).toHaveBeenCalledWith(+mockEventId);
    expect(component.event()).toEqual(mockEvent);
    expect(component.participants()).toEqual(mockParticipants);
  });

  it('should handle event loading error', () => {
    eventService.getEvent.and.returnValue(throwError(() => new Error('Test error')));

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.error()).toBe('Ürituse andmete laadimine ebaõnnestus');
  });

  it('should handle participants loading error', () => {
    eventService.getEventParticipants.and.returnValue(throwError(() => new Error('Test error')));

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.error()).toBe('Osalejate nimekirja laadimine ebaõnnestus');
  });

  it('should toggle between PERSON and COMPANY fields when type changes', () => {
    // Initially PERSON is selected
    expect(fixture.debugElement.query(By.css('#firstName'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('#companyName'))).toBeFalsy();

    // Change to COMPANY
    component.participantForm.get('type')?.setValue('COMPANY');
    fixture.detectChanges();

    // Now COMPANY fields should be visible and PERSON fields hidden
    expect(fixture.debugElement.query(By.css('#firstName'))).toBeFalsy();
    expect(fixture.debugElement.query(By.css('#companyName'))).toBeTruthy();
  });

  it('should update validators when type changes', () => {
    // Initially PERSON validators
    expect(component.participantForm.get('firstName')?.validator).toBeTruthy();
    expect(component.participantForm.get('companyName')?.validator).toBeFalsy();

    // Change to COMPANY
    component.participantForm.get('type')?.setValue('COMPANY');
    fixture.detectChanges();

    // Now COMPANY validators should be active
    expect(component.participantForm.get('firstName')?.validator).toBeFalsy();
    expect(component.participantForm.get('companyName')?.validator).toBeTruthy();
  });

  it('should update additionalInfo maxLength based on type', () => {
    // For PERSON (default), maxLength should be 1000
    component.participantForm.get('additionalInfo')?.setValue('a'.repeat(1001));
    expect(component.participantForm.get('additionalInfo')?.valid).toBeFalsy();

    component.participantForm.get('additionalInfo')?.setValue('a'.repeat(1000));
    expect(component.participantForm.get('additionalInfo')?.valid).toBeTruthy();

    // Change to COMPANY where maxLength should be 5000
    component.participantForm.get('type')?.setValue('COMPANY');
    fixture.detectChanges();

    component.participantForm.get('additionalInfo')?.setValue('a'.repeat(5001));
    expect(component.participantForm.get('additionalInfo')?.valid).toBeFalsy();

    component.participantForm.get('additionalInfo')?.setValue('a'.repeat(5000));
    expect(component.participantForm.get('additionalInfo')?.valid).toBeTruthy();
  });

  it('should handle form submission for PERSON participant', fakeAsync(() => {
    const personData = {
      type: 'PERSON',
      firstName: 'Jane',
      lastName: 'Smith',
      personalCode: '38712345678',
      paymentMethod: 'CARD',
      additionalInfo: 'Test info'
    };

    const newParticipant = { ...personData, id: 101 };

    participantService.createParticipant.and.returnValue(of(newParticipant));
    eventService.addParticipantToEvent.and.returnValue(of({}));

    // Fill the form
    component.participantForm.patchValue(personData);

    // Submit the form
    component.addParticipant();
    tick();

    // Check that services were called correctly
    expect(participantService.createParticipant).toHaveBeenCalledWith(jasmine.objectContaining(personData));
    expect(eventService.addParticipantToEvent).toHaveBeenCalledWith(
      +mockEventId,
      { id: newParticipant.id, type: newParticipant.type }
    );

    // Check that navigation occurred
    expect(router.navigate).toHaveBeenCalledWith(['/events']);
  }));

  it('should handle form submission for COMPANY participant', fakeAsync(() => {
    const companyData = {
      type: 'COMPANY',
      companyName: 'New Company',
      registrationCode: '87654321',
      participantCount: 10,
      paymentMethod: 'BANK_TRANSFER',
      additionalInfo: 'Company info'
    };

    const newParticipant = { ...companyData, id: 102 };

    participantService.createParticipant.and.returnValue(of(newParticipant));
    eventService.addParticipantToEvent.and.returnValue(of({}));

    // Fill the form
    component.participantForm.patchValue(companyData);

    // Submit the form
    component.addParticipant();
    tick();

    // Check that services were called correctly
    expect(participantService.createParticipant).toHaveBeenCalledWith(jasmine.objectContaining(companyData));
    expect(eventService.addParticipantToEvent).toHaveBeenCalledWith(
      +mockEventId,
      { id: newParticipant.id, type: newParticipant.type }
    );

    // Check that navigation occurred
    expect(router.navigate).toHaveBeenCalledWith(['/events']);
  }));

  it('should handle form validation errors', () => {
    // Submit an invalid form (empty required fields)
    component.addParticipant();
    fixture.detectChanges();

    // Check error message
    expect(component.error()).toBe('Palun täitke kohustuslikud väljad korrektselt');

    // Verify service methods were not called
    expect(participantService.createParticipant).not.toHaveBeenCalled();
    expect(eventService.addParticipantToEvent).not.toHaveBeenCalled();
  });

  it('should handle duplicate participant error (409)', fakeAsync(() => {
    const personData = {
      type: 'PERSON',
      firstName: 'Jane',
      lastName: 'Smith',
      personalCode: '38712345678',
      paymentMethod: 'CARD'
    };

    // Setup duplicate error
    participantService.createParticipant.and.returnValue(throwError(() => ({
      status: 409,
      error: { message: 'Participant with this personal code already exists' }
    })));

    // Setup search to find the existing participant
    const existingParticipant = { ...personData, id: 999 };
    participantService.searchParticipants.and.returnValue(of([existingParticipant]));

    // Add existing participant to event succeeds
    eventService.addParticipantToEvent.and.returnValue(of({}));

    // Fill the form
    component.participantForm.patchValue(personData);

    // Submit the form
    component.addParticipant();
    tick();

    // Check that the existing participant is added to the event
    expect(participantService.searchParticipants).toHaveBeenCalled();
    expect(eventService.addParticipantToEvent).toHaveBeenCalledWith(
      +mockEventId,
      { id: existingParticipant.id, type: existingParticipant.type }
    );

    // Check that navigation occurred
    expect(router.navigate).toHaveBeenCalledWith(['/events']);
  }));

  it('should handle participant already added to event error', fakeAsync(() => {
    const personData = {
      type: 'PERSON',
      firstName: 'Jane',
      lastName: 'Smith',
      personalCode: '38712345678',
      paymentMethod: 'CARD'
    };

    // Setup duplicate error
    participantService.createParticipant.and.returnValue(throwError(() => ({
      status: 409,
      error: { message: 'Participant with this personal code already exists' }
    })));

    // Setup search to find the existing participant
    const existingParticipant = { ...personData, id: 999 };
    participantService.searchParticipants.and.returnValue(of([existingParticipant]));

    // Add existing participant to event fails with 409 (already added)
    eventService.addParticipantToEvent.and.returnValue(throwError(() => ({
      status: 409,
      error: { message: 'Participant already added to this event' }
    })));

    // Fill the form
    component.participantForm.patchValue(personData);

    // Submit the form
    component.addParticipant();
    tick();

    // Check error message
    expect(component.error()).toBe('Osaleja on juba üritusele lisatud');
    expect(component.participantForm.get('personalCode')?.errors?.['serverError']).toBe('See isikukood on juba registreeritud');
  }));

  it('should handle invalid personal code error', fakeAsync(() => {
    const personData = {
      type: 'PERSON',
      firstName: 'Jane',
      lastName: 'Smith',
      personalCode: 'invalid',
      paymentMethod: 'CARD'
    };

    // Setup validation error
    participantService.createParticipant.and.returnValue(throwError(() => ({
      status: 400,
      error: { message: 'Invalid personal code format' }
    })));

    // Fill the form
    component.participantForm.patchValue(personData);

    // Submit the form
    component.addParticipant();
    tick();

    // Check error message
    expect(component.error()).toBe('Isikukood on vigane');
    expect(component.participantForm.get('personalCode')?.errors?.['serverError']).toBe('Isikukood on vigane');
  }));

  it('should handle invalid registration code error', fakeAsync(() => {
    const companyData = {
      type: 'COMPANY',
      companyName: 'Test Company',
      registrationCode: 'invalid',
      paymentMethod: 'BANK_TRANSFER'
    };

    // Setup validation error
    participantService.createParticipant.and.returnValue(throwError(() => ({
      status: 400,
      error: { message: 'Invalid registration code format' }
    })));

    // Fill the form
    component.participantForm.patchValue(companyData);

    // Submit the form
    component.addParticipant();
    tick();

    // Check error message
    expect(component.error()).toBe('Registrikood peab olema 8-kohaline number');
    expect(component.participantForm.get('registrationCode')?.errors?.['serverError']).toBe('Registrikood peab olema 8-kohaline number');
  }));

  it('should handle additional info too long error', fakeAsync(() => {
    const personData = {
      type: 'PERSON',
      firstName: 'Jane',
      lastName: 'Smith',
      personalCode: '38712345678',
      paymentMethod: 'CARD',
      additionalInfo: 'Very long text...'
    };

    // Setup validation error
    participantService.createParticipant.and.returnValue(throwError(() => ({
      status: 400,
      error: { message: 'additional info exceeds maximum length' }
    })));

    // Fill the form
    component.participantForm.patchValue(personData);

    // Submit the form
    component.addParticipant();
    tick();

    // Check error message
    expect(component.error()).toBe('Lisainfo on liiga pikk');
    expect(component.participantForm.get('additionalInfo')?.errors?.['serverError']).toBe('Lisainfo on liiga pikk');
  }));

  it('should test autocomplete functionality for firstName', fakeAsync(async () => {
    const searchResults = [
      { id: 101, firstName: 'John', lastName: 'Smith', personalCode: '38712345678', type: 'PERSON', paymentMethod: 'CARD' },
      { id: 102, firstName: 'Johnny', lastName: 'Walker', personalCode: '38712345679', type: 'PERSON', paymentMethod: 'CASH' }
    ];

    participantService.searchParticipants.and.returnValue(of(searchResults));

    // Get the input field
    const input = fixture.debugElement.query(By.css('#firstName input')).nativeElement;

    // Set a value to trigger the search
    input.value = 'John';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    tick(300); // Wait for debounce time

    // Get the autocomplete harness
    const autocomplete = await loader.getHarness(MatAutocompleteHarness);
    await autocomplete.focus();

    // Check that options are available
    const options = await autocomplete.getOptions();
    expect(options.length).toBe(2);

    // Select first option
    await options[0].click();
    fixture.detectChanges();

    // Check that the form was populated with the selected participant's data
    expect(component.participantForm.get('firstName')?.value).toBe('John');
    expect(component.participantForm.get('lastName')?.value).toBe('Smith');
    expect(component.participantForm.get('personalCode')?.value).toBe('38712345678');
  }));

  it('should delete participant correctly', () => {
    const participantId = 42;
    eventService.removeParticipantFromEvent.and.returnValue(of({}));

    component.deleteParticipant(participantId);

    expect(eventService.removeParticipantFromEvent).toHaveBeenCalledWith(+mockEventId, participantId);
  });

  it('should reset form to initial state', () => {
    // First fill the form with data
    component.participantForm.patchValue({
      type: 'COMPANY',
      companyName: 'Test Company',
      registrationCode: '12345678',
      paymentMethod: 'BANK_TRANSFER'
    });

    // Call private resetForm method via a public method that uses it
    const createParticipantSpy = spyOn(participantService, 'createParticipant').and.returnValue(of({ id: 123 }));
    const addParticipantToEventSpy = spyOn(eventService, 'addParticipantToEvent').and.returnValue(of({}));
    const navigateSpy = spyOn(router, 'navigate');

    component.addParticipant();

    // Check that form was reset
    expect(component.participantForm.get('type')?.value).toBe('PERSON');
    expect(component.participantForm.get('firstName')?.value).toBe('');
    expect(component.participantForm.get('lastName')?.value).toBe('');
    expect(component.participantForm.get('paymentMethod')?.value).toBeNull();
  });
});
