import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ParticipantDetailComponent } from './participant-detail.component';
import { ParticipantService } from '../../services/participant.service';
import { Participant } from '../../models/participant.model';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

describe('ParticipantDetailComponent', () => {
  let component: ParticipantDetailComponent;
  let fixture: ComponentFixture<ParticipantDetailComponent>;
  let participantServiceMock: jasmine.SpyObj<ParticipantService>;
  let routerMock: jasmine.SpyObj<Router>;
  let activatedRouteMock: any;

  const mockParticipant: Participant = {
    id: 1,
    type: 'PERSON',
    firstName: 'John',
    lastName: 'Doe',
    personalCode: '12345678901',
    paymentMethod: 'CARD',
    companyName: undefined,
    registrationCode: undefined,
    participantCount: undefined,
    contactPerson: undefined,
    email: undefined,
    phone: undefined,
    additionalInfo: undefined
  };

  beforeEach(async () => {
    participantServiceMock = jasmine.createSpyObj('ParticipantService', ['getParticipant', 'updateParticipant']);
    routerMock = jasmine.createSpyObj('Router', ['navigate']);
    activatedRouteMock = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue(null)
        },
        pathFromRoot: [
          { paramMap: { has: () => false }, routeConfig: { path: '' } },
          { paramMap: { has: () => false }, routeConfig: { path: 'events/:id' } }
        ]
      }
    };

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        ParticipantDetailComponent
      ],
      providers: [
        { provide: ParticipantService, useValue: participantServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ParticipantDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with default values and validators', () => {
    fixture.detectChanges();
    const form = component.participantForm;

    expect(form.get('type')?.value).toBe('PERSON');
    expect(form.get('firstName')?.hasValidator(Validators.required)).toBeTrue();
    expect(form.get('lastName')?.hasValidator(Validators.required)).toBeTrue();
    expect(form.get('personalCode')?.hasValidator(Validators.required)).toBeTrue();
    expect(form.get('paymentMethod')?.hasValidator(Validators.required)).toBeTrue();
    expect(form.get('companyName')?.hasValidator(Validators.required)).toBeFalse();
    expect(form.get('registrationCode')?.hasValidator(Validators.required)).toBeFalse();
  });

  it('should set edit mode and load participant data when id is provided', () => {
    activatedRouteMock.snapshot.paramMap.get.and.returnValue('1');
    participantServiceMock.getParticipant.and.returnValue(of(mockParticipant));

    fixture.detectChanges();

    expect(component.isEditMode()).toBeTrue();
    expect(participantServiceMock.getParticipant).toHaveBeenCalledWith(1);
    expect(component.participantForm.get('firstName')?.value).toBe('John');
    expect(component.participantForm.get('lastName')?.value).toBe('Doe');
    expect(component.participantForm.get('personalCode')?.value).toBe('12345678901');
    expect(component.participantForm.get('paymentMethod')?.value).toBe('CARD');
  });

  it('should set error message when participant loading fails or returns null', () => {
    activatedRouteMock.snapshot.paramMap.get.and.returnValue('1');
    participantServiceMock.getParticipant.and.returnValue(of(null as any as Participant));

    fixture.detectChanges();

    expect(component.error()).toBe('Osavõtja andmete laadimine ebaõnnestus');

    participantServiceMock.getParticipant.and.returnValue(throwError(() => new Error('Load failed')));
    fixture.detectChanges();

    expect(component.error()).toBe('Osavõtja andmete laadimine ebaõnnestus');
  });

  it('should update validators when type changes to COMPANY', () => {
    fixture.detectChanges();
    component.participantForm.get('type')?.setValue('COMPANY');
    fixture.detectChanges();

    expect(component.participantForm.get('firstName')?.hasValidator(Validators.required)).toBeFalse();
    expect(component.participantForm.get('lastName')?.hasValidator(Validators.required)).toBeFalse();
    expect(component.participantForm.get('personalCode')?.hasValidator(Validators.required)).toBeFalse();
    expect(component.participantForm.get('companyName')?.hasValidator(Validators.required)).toBeTrue();
    expect(component.participantForm.get('registrationCode')?.hasValidator(Validators.required)).toBeTrue();
  });

  it('should show invalid form error when submitting invalid form', () => {
    fixture.detectChanges();
    component.onSubmit();

    expect(component.error()).toBe('Palun täitke kohustuslikud väljad korrektselt');
    expect(component.participantForm.get('firstName')?.touched).toBeTrue();
    expect(component.participantForm.get('lastName')?.touched).toBeTrue();
    expect(component.participantForm.get('personalCode')?.touched).toBeTrue();
    expect(component.participantForm.get('paymentMethod')?.touched).toBeTrue();
  });

  it('should submit valid form and navigate on success', () => {
    activatedRouteMock.snapshot.paramMap.get.and.returnValue('1');
    participantServiceMock.getParticipant.and.returnValue(of(mockParticipant));
    participantServiceMock.updateParticipant.and.returnValue(of(mockParticipant));

    component.participantForm.setValue({
      type: 'PERSON',
      firstName: 'John',
      lastName: 'Doe',
      personalCode: '12345678901',
      companyName: '',
      registrationCode: '',
      participantCount: null,
      contactPerson: '',
      paymentMethod: 'CARD',
      email: '',
      phone: '',
      additionalInfo: ''
    });

    fixture.detectChanges();
    component.onSubmit();

    expect(participantServiceMock.updateParticipant).toHaveBeenCalledWith(1, jasmine.objectContaining({
      id: 1,
      type: 'PERSON',
      firstName: 'John',
      lastName: 'Doe',
      personalCode: '12345678901',
      paymentMethod: 'CARD'
    }));
    expect(routerMock.navigate).toHaveBeenCalledWith(['/participants']);
    expect(component.error()).toBeNull();
  });

  it('should set error message when participant update fails', () => {
    activatedRouteMock.snapshot.paramMap.get.and.returnValue('1');
    // Ensure getParticipant returns an Observable to avoid subscribe error
    participantServiceMock.getParticipant.and.returnValue(of(mockParticipant));
    participantServiceMock.updateParticipant.and.returnValue(throwError(() => new Error('Update failed')));

    component.participantForm.setValue({
      type: 'PERSON',
      firstName: 'John',
      lastName: 'Doe',
      personalCode: '12345678901',
      companyName: '',
      registrationCode: '',
      participantCount: null,
      contactPerson: '',
      paymentMethod: 'CARD',
      email: '',
      phone: '',
      additionalInfo: ''
    });

    fixture.detectChanges(); // Triggers ngOnInit, which calls getParticipant
    component.onSubmit(); // Triggers updateParticipant

    expect(component.error()).toBe('Osavõtja salvestamine ebaõnnestus');
  });

  it('should navigate to events when no event_id is found in goBack', () => {
    fixture.detectChanges();
    component.goBack();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/events']);
  });

  it('should navigate to event participants when event_id is found in goBack', () => {
    activatedRouteMock.snapshot.pathFromRoot = [
      { paramMap: { has: () => false }, routeConfig: { path: '' } },
      {
        paramMap: {
          has: jasmine.createSpy().and.returnValue(true),
          get: jasmine.createSpy().and.returnValue('123')
        },
        routeConfig: { path: 'events/:id' }
      }
    ];

    fixture.detectChanges();
    component.goBack();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/events/123/participants']);
  });
});
