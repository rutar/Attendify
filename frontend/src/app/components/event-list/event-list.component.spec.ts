import { ComponentFixture, TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
import { EventListComponent } from './event-list.component';
import { EventService } from '../../services/event.service';
import { of, throwError } from 'rxjs';
import { EventData } from '../../models/event.model';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgOptimizedImage } from '@angular/common';
import {signal} from '@angular/core';

describe('EventListComponent', () => {
  let component: EventListComponent;
  let fixture: ComponentFixture<EventListComponent>;
  let eventService: jasmine.SpyObj<EventService>;

  const mockFutureEvents: EventData[] = [
    {
      id: 1,
      name: 'Tulevane Üritus 1',
      dateTime: new Date().toISOString(),
      location: 'Tallinn',
      totalParticipants: 5,
      status: 'upcoming',
    },
  ];
  const mockPastEvents: EventData[] = [
    {
      id: 2,
      name: 'Toimunud Üritus 1',
      dateTime: new Date().toISOString(),
      location: 'Tartu',
      totalParticipants: 10,
      status: 'completed',
    },
  ];

  beforeEach(async () => {
    const eventServiceSpy = jasmine.createSpyObj<EventService>('EventService', [
      'fetchEvents',
      'getFutureEvents',
      'getPastEvents',
      'removeEvent',
    ]);

    await TestBed.configureTestingModule({
      imports: [EventListComponent, RouterTestingModule, HttpClientTestingModule, NgOptimizedImage],
      providers: [{ provide: EventService, useValue: eventServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(EventListComponent);
    component = fixture.componentInstance;
    eventService = TestBed.inject(EventService) as jasmine.SpyObj<EventService>;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load future and past events on init', () => {
    eventService.getFutureEvents.and.returnValue(signal<EventData[]>(mockFutureEvents));
    eventService.getPastEvents.and.returnValue(signal<EventData[]>(mockPastEvents));
    eventService.fetchEvents.and.stub();

    component.ngOnInit();

    expect(eventService.fetchEvents).toHaveBeenCalled();
    expect(component.futureEvents().length).toBe(1);
    expect(component.pastEvents().length).toBe(1);
    expect(component.error()).toBeNull();
  });

  it('should handle fetch error and show error message', () => {
    spyOn(component as any, 'loadEvents').and.callFake(() => {
      component.error.set('Ürituste laadimine ebaõnnestus');
    });

    component.ngOnInit();

    expect(component.error()).toBe('Ürituste laadimine ebaõnnestus');
  });

  it('should open and close the delete modal', () => {
    component.openDeleteModal(mockFutureEvents[0]);
    expect(component.eventToDelete).toEqual(mockFutureEvents[0]);

    component.closeDeleteModal();
    expect(component.eventToDelete).toBeNull();
  });

  it('should confirm and call removeEvent, then reload events', fakeAsync(() => {
    component.eventToDelete = mockFutureEvents[0];
    eventService.removeEvent.and.returnValue(of(void 0));
    eventService.fetchEvents.and.stub();
    eventService.getFutureEvents.and.returnValue(signal<EventData[]>([]));
    eventService.getPastEvents.and.returnValue(signal<EventData[]>([]));

    spyOn(component as any, 'loadEvents');

    component.confirmDelete();
    tick();

    expect(eventService.removeEvent).toHaveBeenCalledWith(1);
    expect(component.eventToDelete).toBeNull();
    expect((component as any).loadEvents).toHaveBeenCalled();

    flush();
  }));

  it('should set error if removeEvent fails', fakeAsync(() => {
    component.eventToDelete = mockFutureEvents[0];
    eventService.removeEvent.and.returnValue(throwError(() => new Error('fail')));
    eventService.getFutureEvents.and.returnValue(signal<EventData[]>([]));
    eventService.getPastEvents.and.returnValue(signal<EventData[]>([]));
    eventService.fetchEvents.and.stub();

    component.confirmDelete();
    tick();

    expect(component.error()).toBe('Ürituse kustutamine ebaõnnestus');

    flush();
  }));

  it('should close modal on Escape key press', () => {
    component.openDeleteModal(mockFutureEvents[0]);
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    component.handleModalKeydown(event);
    expect(component.eventToDelete).toBeNull();
  });
});
