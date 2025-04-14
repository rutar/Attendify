import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Event } from '../models/event.model';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Participant } from '../models/participantbase.model';
import { ConfigService } from './config.service';

@Injectable({ providedIn: 'root' })
export class EventService {
  private futureEvents = signal<Event[]>([]);
  private pastEvents = signal<Event[]>([]);

  constructor(private http: HttpClient, private configService: ConfigService) {}

  getFutureEvents() {
    return this.futureEvents.asReadonly();
  }

  getPastEvents() {
    return this.pastEvents.asReadonly();
  }

  fetchEvents() {
    this.http
      .get<{ futureEvents: Event[]; pastEvents: Event[] }>(
        `${this.configService.getApiBaseUrl()}/events`
      )
      .subscribe((data) => {
        console.log('Fetched events:', data);
        this.futureEvents.set(data.futureEvents);
        this.pastEvents.set(data.pastEvents);
      });
  }

  getEvent(id: number): Observable<Event> {
    return this.http.get<Event>(`${this.configService.getApiBaseUrl()}/events/${id}`);
  }

  createEvent(event: Event): Observable<Event> {
    return this.http
      .post<Event>(`${this.configService.getApiBaseUrl()}/events`, event)
      .pipe(
        tap((newEvent) =>
          this.futureEvents.update((events) => [...events, newEvent])
        )
      );
  }

  updateEvent(id: number, event: Event): Observable<Event> {
    return this.http
      .put<Event>(`${this.configService.getApiBaseUrl()}/events/${id}`, event)
      .pipe(
        tap((updatedEvent) => {
          const updateInList = (events: Event[]) =>
            events.map((e) => (e.id === id ? updatedEvent : e));

          this.futureEvents.update(updateInList);
          this.pastEvents.update(updateInList);
        })
      );
  }

  removeEvent(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.configService.getApiBaseUrl()}/events/${id}`)
      .pipe(
        tap(() => {
          this.futureEvents.update((events) =>
            events.filter((e) => e.id !== id)
          );
          this.pastEvents.update((events) => events.filter((e) => e.id !== id));
        })
      );
  }

  getEventParticipants(eventId: number): Observable<Participant[]> {
    return this.http.get<Participant[]>(
      `${this.configService.getApiBaseUrl()}/events/${eventId}/participants`
    );
  }

  addParticipantToEvent(
    eventId: number,
    participantId: number,
    status?: string
  ): Observable<Participant> {
    const query = status ? `?status=${status}` : '';
    return this.http.post<Participant>(
      `${this.configService.getApiBaseUrl()}/events/${eventId}/participants/${participantId}${query}`,
      {}
    );
  }

  updateParticipantStatus(
    eventId: number,
    participantId: number,
    status: string
  ): Observable<Participant> {
    return this.http.put<Participant>(
      `${this.configService.getApiBaseUrl()}/events/${eventId}/participants/${participantId}/status?status=${status}`,
      {}
    );
  }

  removeParticipantFromEvent(
    eventId: number,
    participantId: number
  ): Observable<void> {
    return this.http.delete<void>(
      `${this.configService.getApiBaseUrl()}/events/${eventId}/participants/${participantId}`
    );
  }
}
