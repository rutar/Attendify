import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { EventData } from '../models/event.model';
import { Participant } from '../models/participant.model';
import { ConfigService } from './config.service';

@Injectable({ providedIn: 'root' })
export class EventService {
  // Angular Signals for reactive state management
  private futureEvents = signal<EventData[]>([]);
  private pastEvents = signal<EventData[]>([]);
  private readonly eventsApiUrl: string;



  constructor(private http: HttpClient, private configService: ConfigService) {
    this.eventsApiUrl = `${this.configService.getApiBaseUrl()}/events`;
  }


  // Public getters for signals (read-only)
  getFutureEvents() {
    return this.futureEvents.asReadonly();
  }
  getPastEvents() {
    return this.pastEvents.asReadonly();
  }

  // Fetch all events and update signals
  fetchEvents(): void {
    this.http
      .get<{ futureEvents: EventData[]; pastEvents: EventData[] }>(this.eventsApiUrl)
      .pipe(catchError(this.handleError))
      .subscribe((data) => {
        console.log('Fetched events:', data);
        this.futureEvents.set(data.futureEvents);
        this.pastEvents.set(data.pastEvents);
      });
  }

  // Get event details by id (assuming the backend exposes GET /api/events/{id})
  getEvent(id: number): Observable<EventData> {
    const url = `${this.eventsApiUrl}/${id}`;
    return this.http.get<EventData>(url).pipe(catchError(this.handleError));
  }

  // Create a new event and append it to the futureEvents list
  createEvent(event: EventData): Observable<EventData> {
    return this.http.post<EventData>(this.eventsApiUrl, event).pipe(
      tap((newEvent) => {
        // Update future events (assuming newly created events are future events)
        this.futureEvents.update((events) => [...events, newEvent]);
      }),
      catchError(this.handleError)
    );
  }

  // Update an existing event in both event lists if necessary
  updateEvent(id: number, event: EventData): Observable<EventData> {
    const url = `${this.eventsApiUrl}/${id}`;
    return this.http.put<EventData>(url, event).pipe(
      tap((updatedEvent) => {
        const updateList = (events: EventData[]) =>
          events.map((e) => (e.id === id ? updatedEvent : e));
        this.futureEvents.update(updateList);
        this.pastEvents.update(updateList);
      }),
      catchError(this.handleError)
    );
  }

  // Remove an event and update signals
  removeEvent(id: number): Observable<void> {
    const url = `${this.eventsApiUrl}/${id}`;
    return this.http.delete<void>(url).pipe(
      tap(() => {
        this.futureEvents.update((events) => events.filter((e) => e.id !== id));
        this.pastEvents.update((events) => events.filter((e) => e.id !== id));
      }),
      catchError(this.handleError)
    );
  }

  // Get participants for a specific event
  getEventParticipants(eventId: number): Observable<Participant[]> {
    const url = `${this.eventsApiUrl}/${eventId}/participants`;
    return this.http.get<Participant[]>(url).pipe(
      map((participants) => participants.map(this.mapParticipant)),
      catchError(this.handleError)
    );
  }

  // Add a participant to an event
  addParticipantToEvent(eventId: number, participant: Participant): Observable<Participant> {
    const url = `${this.eventsApiUrl}/${eventId}/participants`;
    return this.http.post<Participant>(url, participant).pipe(catchError(this.handleError));
  }

  // Remove a participant from an event
  removeParticipantFromEvent(eventId: number, participantId: number): Observable<void> {
    const url = `${this.eventsApiUrl}/${eventId}/participants/${participantId}`;
    return this.http.delete<void>(url).pipe(catchError(this.handleError));
  }

  // Helper method: Maps raw participant response data to proper Participant object
  private mapParticipant = (p: any): Participant => {
    return {
      id: p.id,
      type: p.type,
      firstName: p.type === 'PERSON' ? p.firstName : undefined,
      lastName: p.type === 'PERSON' ? p.lastName : undefined,
      personalCode: p.type === 'PERSON' ? p.personalCode : undefined,
      companyName: p.type === 'COMPANY' ? p.companyName : undefined,
      registrationCode: p.type === 'COMPANY' ? p.registrationCode : undefined,
      participantCount: p.type === 'COMPANY' ? p.participantCount : undefined,
      contactPerson: p.type === 'COMPANY' ? p.contactPerson : undefined,
      paymentMethod: p.paymentMethod,
      email: p.email,
      phone: p.phone,
      additionalInfo: p.additionalInfo,
    } as Participant;
  };

  // Centralized error handling method
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 400:
          errorMessage = `Bad Request: ${error.error || 'Invalid data provided'}`;
          break;
        case 404:
          errorMessage = `Not Found: ${error.error || 'Resource not found'}`;
          break;
        case 409:
          errorMessage = `Conflict: ${error.error || 'Participant already registered'}`;
          break;
        default:
          errorMessage = `Server Error: ${error.status} - ${error.error || 'Unknown error'}`;
      }
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
