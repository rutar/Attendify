import {ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {Router} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {of, throwError} from 'rxjs';
import {EventCreateComponent} from './event-create.component';
import {EventService} from '../../services/event.service';
import {EventData} from '../../models/event.model';
import {By} from '@angular/platform-browser';
import {RouterTestingModule} from '@angular/router/testing';

describe('EventCreateComponent', () => {
  let component: EventCreateComponent;
  let fixture: ComponentFixture<EventCreateComponent>;
  let eventService: jasmine.SpyObj<EventService>;
  let router: Router;

  beforeEach(async () => {
    const eventServiceSpy = jasmine.createSpyObj('EventService', ['createEvent']);

    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        RouterTestingModule,
        EventCreateComponent
      ],
      providers: [
        {provide: EventService, useValue: eventServiceSpy}
      ]
    }).compileComponents();

    eventService = TestBed.inject(EventService) as jasmine.SpyObj<EventService>;
    router = TestBed.inject(Router);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EventCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    spyOn(router, 'navigate');
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty event data', () => {
    expect(component.event).toEqual({
      name: '',
      dateTime: '',
      location: '',
      additionalInfo: '',
      totalParticipants: 0
    });
    expect(component.error).toBeNull();
    expect(component.submitted).toBeFalse();
  });

  it('should render the form with all required fields', () => {
    const form = fixture.debugElement.query(By.css('form'));
    const nameInput = fixture.debugElement.query(By.css('#name'));
    const dateTimeInput = fixture.debugElement.query(By.css('#dateTime'));
    const locationInput = fixture.debugElement.query(By.css('#location'));
    const additionalInfoInput = fixture.debugElement.query(By.css('#additionalInfo'));
    const submitButton = fixture.debugElement.query(By.css('button[type="submit"]'));

    expect(form).toBeTruthy();
    expect(nameInput).toBeTruthy();
    expect(dateTimeInput).toBeTruthy();
    expect(locationInput).toBeTruthy();
    expect(additionalInfoInput).toBeTruthy();
    expect(submitButton).toBeTruthy();
  });

  it('should display error when required fields are missing and form is submitted', () => {
    component.save();
    fixture.detectChanges();

    expect(component.submitted).toBeTrue();
    expect(component.error).toBe('Palun täida kohustuslikud väljad');

    const errorElement = fixture.debugElement.query(By.css('.alert-danger'));
    expect(errorElement.nativeElement.textContent).toBe('Palun täida kohustuslikud väljad');
  });

  it('should validate name field and show error when empty', () => {
    component.event.dateTime = '2025-01-01T10:00';
    component.event.location = 'Test Location';

    component.save();
    fixture.detectChanges();

    const nameError = fixture.debugElement.query(By.css('.error-msg'));
    expect(nameError.nativeElement.textContent).toContain('Ürituse nimi on kohustuslik');
  });

  it('should validate dateTime field and show error when empty', () => {
    component.event.name = 'Test Event';
    component.event.location = 'Test Location';

    component.save();
    fixture.detectChanges();

    const dateTimeError = fixture.debugElement.queryAll(By.css('.error-msg'))[0];
    expect(dateTimeError.nativeElement.textContent).toContain('Toimumisaeg on kohustuslik');
  });

  it('should validate location field and show error when empty', () => {
    component.event.name = 'Test Event';
    component.event.dateTime = '2055-01-01T10:00';

    component.save();
    fixture.detectChanges();

    const locationError = fixture.debugElement.queryAll(By.css('.error-msg'))[0];
    expect(locationError.nativeElement.textContent).toContain('Koht on kohustuslik');
  });


  it('should return false when dateTime is empty', () => {
    component.event.dateTime = '';
    expect(component.isPastDate()).toBeFalse();
  });

  it('should return true when date is in the past', () => {
    const pastDate = new Date();
    pastDate.setFullYear(pastDate.getFullYear() - 1); // Date one year ago
    component.event.dateTime = pastDate.toISOString().slice(0, 16);

    expect(component.isPastDate()).toBeTrue();
  });

  it('should return false when date is in the future', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1); // Date one year in the future
    component.event.dateTime = futureDate.toISOString().slice(0, 16);

    expect(component.isPastDate()).toBeFalse();
  });

  it('should show error when date is in the past and form is submitted', () => {
    component.event.name = 'Test Event';
    component.event.location = 'Test Location';

    const pastDate = new Date();
    pastDate.setFullYear(pastDate.getFullYear() - 1); // Date one year ago
    component.event.dateTime = pastDate.toISOString().slice(0, 16);

    component.save();
    fixture.detectChanges();

    expect(component.error).toBe('Ürituse toimumisaeg ei tohi olla minevikus');
    const dateTimeError = fixture.debugElement.query(By.css('.alert-danger'));
    expect(dateTimeError.nativeElement.textContent).toContain('Ürituse toimumisaeg ei tohi olla minevikus');
  });

  it('should call eventService.createEvent with correct data when form is valid', fakeAsync(() => {
    // Setup valid form data
    component.event.name = 'Test Event';
    component.event.location = 'Test Location';

    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1); // One year in the future
    component.event.dateTime = futureDate.toISOString().slice(0, 16);

    // Mock the service response
    const expectedEvent: EventData = {
      id: 1,
      name: 'Test Event',
      dateTime: futureDate.toISOString(),
      location: 'Test Location',
      additionalInfo: '',
      status: 'ACTIVE',
      totalParticipants: 0
    };

    eventService.createEvent.and.returnValue(of(expectedEvent));

    // Call save method
    component.save();
    tick();

    // Assertions
    expect(component.submitted).toBeTrue();
    expect(component.error).toBeNull();
    expect(eventService.createEvent).toHaveBeenCalled();

    const calledWithArg = eventService.createEvent.calls.first().args[0];
    expect(calledWithArg.name).toBe('Test Event');
    expect(calledWithArg.location).toBe('Test Location');
    expect(calledWithArg.status).toBe('ACTIVE');

    // Verify navigation
    expect(router.navigate).toHaveBeenCalledWith(['/events']);
  }));

  it('should handle error from eventService', fakeAsync(() => {
    // Setup valid form data
    component.event.name = 'Test Event';
    component.event.location = 'Test Location';

    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    component.event.dateTime = futureDate.toISOString().slice(0, 16);

    // Mock service error
    eventService.createEvent.and.returnValue(throwError(() => new Error('Service error')));

    // Call save method
    component.save();
    tick();

    // Assertions
    expect(component.error).toBe('Ürituse lisamine ebaõnnestus');
    expect(router.navigate).not.toHaveBeenCalled();
  }));


  it('should have expected initial form values', () => {
    expect(component.event.name).toBe('');
    expect(component.event.location).toBe('');
    expect(component.event.dateTime).toBe('');
  });

  it('should call save method when form is submitted', () => {
    spyOn(component, 'save');

    const form = fixture.debugElement.query(By.css('form')).nativeElement;
    form.dispatchEvent(new Event('submit'));

    expect(component.save).toHaveBeenCalled();
  });

  it('should have a back button that links to the events page', () => {
    const backButton = fixture.debugElement.query(By.css('.btn-grey'));
    expect(backButton.attributes['routerLink']).toBe('/events');
  });
});
