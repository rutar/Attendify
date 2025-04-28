import {ComponentFixture, fakeAsync, flush, TestBed, tick} from '@angular/core/testing';
import {EventListComponent} from './event-list.component';
import {EventService} from '../../services/event.service';
import {of, throwError} from 'rxjs';
import {EventData} from '../../models/event.model';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {signal} from '@angular/core';
import {ActivatedRoute, RouterModule} from '@angular/router';

describe('EventListComponent', () => {
  let component: EventListComponent;
  let fixture: ComponentFixture<EventListComponent>;
  let mockEventService: jasmine.SpyObj<EventService>;

  const mockFutureEvents: EventData[] = [{
    id: 1,
    name: 'Tulevane Üritus 1',
    dateTime: '2025-04-28T11:42:53.984Z',
    location: 'Tallinn',
    totalParticipants: 5,
    status: 'upcoming'
  }];

  const mockPastEvents: EventData[] = [{
    id: 2,
    name: 'Toimunud Üritus 1',
    dateTime: '2025-04-28T11:42:53.984Z',
    location: 'Tartu',
    totalParticipants: 10,
    status: 'completed'
  }];

  beforeEach(async () => {
    mockEventService = jasmine.createSpyObj('EventService', [
      'fetchEvents',
      'getFutureEvents',
      'getPastEvents',
      'removeEvent'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        EventListComponent,
        HttpClientTestingModule,
        RouterModule.forRoot([])
      ],
      providers: [
        {provide: EventService, useValue: mockEventService},
        {provide: ActivatedRoute, useValue: {}}
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EventListComponent);
    component = fixture.componentInstance;
  });

  it('should load events successfully and update signals', fakeAsync(() => {

    // Override the default mock implementation
    mockEventService.fetchEvents.and.returnValue(of(undefined));

    // Create actual signals with the mock data
    const futureEventsSignal = signal<EventData[]>(mockFutureEvents);
    const pastEventsSignal = signal<EventData[]>(mockPastEvents);

    mockEventService.getFutureEvents.and.returnValue(futureEventsSignal.asReadonly());
    mockEventService.getPastEvents.and.returnValue(pastEventsSignal.asReadonly());

    // 3. Trigger the load
    component.ngOnInit(); // This calls loadEvents()
    tick();

    // 4. Verify expectations
    expect(mockEventService.fetchEvents).toHaveBeenCalled();

    // Check the signals were updated
    expect(component.futureEvents()).toEqual(mockFutureEvents);
    expect(component.pastEvents()).toEqual(mockPastEvents);
    expect(component.error()).toBeNull();
  }));

  it('should handle error when loading events fails', fakeAsync(() => {
    // Mock failed response
    mockEventService.fetchEvents.and.returnValue(
      throwError(() => new Error('Test Error'))
    );

    component.ngOnInit();
    tick();

    expect(component.error()).toBe('Ürituste laadimine ebaõnnestus');
  }));

  it('should open and close the delete modal', () => {
    component.openDeleteModal(mockFutureEvents[0]);
    expect(component.eventToDelete).toEqual(mockFutureEvents[0]);

    component.closeDeleteModal();
    expect(component.eventToDelete).toBeNull();
  });

  it('should confirm and call removeEvent, then reload events', fakeAsync(() => {
    component.eventToDelete = mockFutureEvents[0];
    mockEventService.removeEvent.and.returnValue(of(void 0));
    mockEventService.fetchEvents.and.stub();
    mockEventService.getFutureEvents.and.returnValue(signal<EventData[]>([]));
    mockEventService.getPastEvents.and.returnValue(signal<EventData[]>([]));

    spyOn(component as any, 'loadEvents');

    component.confirmDelete();
    tick();

    expect(mockEventService.removeEvent).toHaveBeenCalledWith(1);
    expect(component.eventToDelete).toBeNull();
    expect((component as any).loadEvents).toHaveBeenCalled();

    flush();
  }));

  it('should set error if removeEvent fails', fakeAsync(() => {
    component.eventToDelete = mockFutureEvents[0];
    mockEventService.removeEvent.and.returnValue(throwError(() => new Error('fail')));
    mockEventService.getFutureEvents.and.returnValue(signal<EventData[]>([]));
    mockEventService.getPastEvents.and.returnValue(signal<EventData[]>([]));
    mockEventService.fetchEvents.and.stub();

    component.confirmDelete();
    tick();

    expect(component.error()).toBe('Ürituse kustutamine ebaõnnestus');

    flush();
  }));

  it('should close modal on Escape key press', () => {
    component.openDeleteModal(mockFutureEvents[0]);
    const event = new KeyboardEvent('keydown', {key: 'Escape'});
    component.onEscapePress(event);
    expect(component.eventToDelete).toBeNull();
  });
});

