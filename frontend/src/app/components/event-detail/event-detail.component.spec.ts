import {ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {EventDetailComponent} from './event-detail.component';
import {ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';
import {ParticipantService} from '../../services/participant.service';
import {EventService} from '../../services/event.service';
import {of, throwError} from 'rxjs';
import {EventData} from '../../models/event.model';
import {Participant} from '../../models/participant.model';
import {By} from '@angular/platform-browser';

describe('EventDetailComponent', () => {
  let component: EventDetailComponent;
  let fixture: ComponentFixture<EventDetailComponent>;
  let participantService: jasmine.SpyObj<ParticipantService>;
  let eventService: jasmine.SpyObj<EventService>;
  let activatedRoute: any;

  const mockEvent: EventData = {
    id: 1,
    name: 'Test Event',
    dateTime: '2025-04-25T10:00:00',
    location: 'Test Location',
    totalParticipants: 0,
    status: 'ACTIVE',
  };

  const mockParticipant: Participant = {
    id: 1,
    type: 'PERSON',
    firstName: 'John',
    lastName: 'Doe',
    personalCode: '123456789',
    paymentMethod: 'CARD',
  };

  beforeEach(async () => {
    const participantServiceSpy = jasmine.createSpyObj('ParticipantService', ['createParticipant', 'deleteParticipant']);
    const eventServiceSpy = jasmine.createSpyObj('EventService', ['getEvent', 'getEventParticipants', 'addParticipantToEvent', 'removeParticipantFromEvent']);
    activatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue('1'),
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule.forRoot([]),
        EventDetailComponent,
      ],
      providers: [
        {provide: ParticipantService, useValue: participantServiceSpy},
        {provide: EventService, useValue: eventServiceSpy},
        {provide: ActivatedRoute, useValue: activatedRoute},
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EventDetailComponent);
    component = fixture.componentInstance;
    participantService = TestBed.inject(ParticipantService) as jasmine.SpyObj<ParticipantService>;
    eventService = TestBed.inject(EventService) as jasmine.SpyObj<EventService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with event and participants data on ngOnInit', fakeAsync(() => {
    eventService.getEvent.and.returnValue(of(mockEvent));
    eventService.getEventParticipants.and.returnValue(of([mockParticipant]));

    fixture.detectChanges(); // Triggers ngOnInit
    tick();

    expect(component.event()).toEqual(mockEvent);
    expect(component.participants()).toEqual([mockParticipant]);
    expect(eventService.getEvent).toHaveBeenCalledWith(1);
    expect(eventService.getEventParticipants).toHaveBeenCalledWith(1);
  }));

  it('should set error message when event loading fails', fakeAsync(() => {
    eventService.getEvent.and.returnValue(throwError(() => new Error('Failed')));
    eventService.getEventParticipants.and.returnValue(of([]));

    fixture.detectChanges();
    tick();

    expect(component.error()).toBe('Ürituse andmete laadimine ebaõnnestus');
  }));

  it('should set error message when participants loading fails', fakeAsync(() => {
    eventService.getEvent.and.returnValue(of(mockEvent));
    eventService.getEventParticipants.and.returnValue(throwError(() => new Error('Failed')));

    fixture.detectChanges();
    tick();

    expect(component.error()).toBe('Osalejate nimekirja laadimine ebaõnnestus');
  }));


  it('should require companyName when type is COMPANY', () => {
    // 1. Set the type to COMPANY
    component.participantForm.get('type')?.setValue('COMPANY');

    // 2. Manually trigger the validator update (since valueChanges might be async)
    component.participantForm.get('type')?.updateValueAndValidity();

    // 3. Get the companyName control
    const companyNameControl = component.participantForm.get('companyName');

    // 4. Verify it's required
    expect(companyNameControl?.hasValidator(Validators.required)).toBeTrue();

    // 5. Additional check - verify the control is invalid when empty
    companyNameControl?.setValue('');
    expect(companyNameControl?.invalid).toBeTrue();
    expect(companyNameControl?.errors?.['required']).toBeTruthy();
  });


  it('should add participant successfully', fakeAsync(() => {
    eventService.getEvent.and.returnValue(of(mockEvent));
    eventService.getEventParticipants.and.returnValue(of([]));
    participantService.createParticipant.and.returnValue(of(mockParticipant));
    eventService.addParticipantToEvent.and.returnValue(of({} as Participant));

    fixture.detectChanges();
    tick();

    component.participantForm.setValue({
      type: 'PERSON',
      firstName: 'John',
      lastName: 'Doe',
      personalCode: '123456789',
      companyName: '',
      registrationCode: '',
      participantCount: null,
      contactPerson: '',
      paymentMethod: 'CARD',
      email: '',
      phone: '',
      additionalInfo: '',
    });

    component.addParticipant();
    tick();

    expect(participantService.createParticipant).toHaveBeenCalledWith(jasmine.objectContaining({
      type: 'PERSON',
      firstName: 'John',
      lastName: 'Doe',
      personalCode: '123456789',
      paymentMethod: 'CARD',
    }));
    expect(eventService.addParticipantToEvent).toHaveBeenCalledWith(1, {id: 1, type: 'PERSON'});
    expect(component.participants()).toContain(mockParticipant);
    expect(component.participantForm.value.type).toBe('PERSON');
    expect(component.error()).toBeNull();
  }));

  it('should set error when form is invalid on add participant', () => {
    // 1. Set up invalid form state
    component.participantForm.setValue({
      type: 'PERSON',
      firstName: '', // Invalid - required field empty
      lastName: '',  // Invalid - required field empty
      personalCode: '',
      companyName: '',
      registrationCode: '',
      participantCount: null,
      contactPerson: '',
      paymentMethod: null, // Invalid - required field empty
      email: '',
      phone: '',
      additionalInfo: ''
    });


    // 3. Trigger the add action
    component.addParticipant();

    // 4. Verify behavior
    expect(component.error()).toBe('Palun täitke kohustuslikud väljad korrektselt');
    expect(participantService.createParticipant).not.toHaveBeenCalled();
    expect(eventService.addParticipantToEvent).not.toHaveBeenCalled();
  });

  it('should set error when adding participant fails', fakeAsync(() => {
    eventService.getEvent.and.returnValue(of(mockEvent));
    eventService.getEventParticipants.and.returnValue(of([]));
    participantService.createParticipant.and.returnValue(throwError(() => new Error('Failed')));

    fixture.detectChanges();
    tick();

    component.participantForm.setValue({
      type: 'PERSON',
      firstName: 'John',
      lastName: 'Doe',
      personalCode: '123456789',
      companyName: '',
      registrationCode: '',
      participantCount: null,
      contactPerson: '',
      paymentMethod: 'CARD',
      email: '',
      phone: '',
      additionalInfo: '',
    });

    component.addParticipant();
    tick();

    expect(component.error()).toBe('Osaleja lisamine ebaõnnestus');
  }));

  it('should delete participant successfully', fakeAsync(() => {
    eventService.getEvent.and.returnValue(of(mockEvent));
    eventService.getEventParticipants.and.returnValue(of([mockParticipant]));
    eventService.removeParticipantFromEvent.and.returnValue(of(void 0));

    fixture.detectChanges();
    tick();

    component.deleteParticipant(1);
    tick();

    expect(eventService.removeParticipantFromEvent).toHaveBeenCalledWith(1, 1);
    expect(component.participants()).toEqual([]);
    expect(component.error()).toBeNull();
  }));

  it('should set error when deleting participant fails', fakeAsync(() => {
    eventService.getEvent.and.returnValue(of(mockEvent));
    eventService.getEventParticipants.and.returnValue(of([mockParticipant]));
    eventService.removeParticipantFromEvent.and.returnValue(throwError(() => new Error('Failed')));

    fixture.detectChanges();
    tick();

    component.deleteParticipant(1);
    tick();

    expect(component.error()).toBe('Osaleja kustutamine ebaõnnestus');
  }));

  it('should display event details in the template', fakeAsync(() => {
    eventService.getEvent.and.returnValue(of(mockEvent));
    eventService.getEventParticipants.and.returnValue(of([]));

    fixture.detectChanges();
    tick();

    const eventName = fixture.debugElement.query(By.css('.event-value')).nativeElement.textContent;
    expect(eventName).toBe('Test Event');
  }));

  it('should display participants in the template', fakeAsync(() => {
    eventService.getEvent.and.returnValue(of(mockEvent));
    eventService.getEventParticipants.and.returnValue(of([mockParticipant]));

    fixture.detectChanges();
    tick();

    const participantName = fixture.debugElement.query(By.css('.participant-col.name')).nativeElement.textContent.trim();
    expect(participantName).toBe('John Doe');
  }));

  it('should display no participants message when participants list is empty', fakeAsync(() => {
    eventService.getEvent.and.returnValue(of(mockEvent));
    eventService.getEventParticipants.and.returnValue(of([]));

    fixture.detectChanges();
    tick();

    const noParticipants = fixture.debugElement.query(By.css('.no-participants')).nativeElement.textContent;
    expect(noParticipants).toBe('Osavõtjaid pole');
  }));
});
