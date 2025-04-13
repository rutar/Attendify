import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Participant } from '../models/participant.model';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ParticipantService {
  private participants = signal<Participant[]>([]);

  constructor(private http: HttpClient) {}

  getParticipants() {
    return this.participants.asReadonly();
  }

  fetchParticipants(eventId?: number) {
    const url = eventId ? `http://localhost:3000/events/${eventId}/participants` : 'http://localhost:3000/participants';
    this.http.get<Participant[]>(url).subscribe({
      next: (data) => this.participants.set(data),
      error: () => this.participants.set([]),
    });
  }

  getParticipant(id: number): Observable<Participant> {
    return this.http.get<Participant>(`http://localhost:3000/participants/${id}`).pipe(
      catchError(() => of(null as any))
    );
  }

  createParticipant(participant: Participant, eventId?: number): Observable<Participant> {
    const url = eventId ? `http://localhost:3000/events/${eventId}/participants` : 'http://localhost:3000/participants';
    return this.http.post<Participant>(url, participant).pipe(
      tap((newParticipant) => this.participants.update(parts => [...parts, newParticipant]))
    );
  }

  updateParticipant(id: number, participant: Participant): Observable<Participant> {
    return this.http.put<Participant>(`http://localhost:3000/participants/${id}`, participant).pipe(
      tap((updated) => this.participants.update(parts => parts.map(p => (p.id === id ? updated : p))))
    );
  }

  deleteParticipant(id: number, eventId?: number): Observable<void> {
    const url = eventId !== undefined ? `http://localhost:3000/events/${eventId}/participants/${id}` : `http://localhost:3000/participants/${id}`;
    return this.http.delete<void>(url).pipe(
      tap(() => {
        console.log(`Deleted participant id=${id}${eventId !== undefined ? ` from event=${eventId}` : ''}`);
        this.participants.update(parts => parts.filter(p => p.id !== id));
      }),
      catchError((error) => {
        console.error(`Failed to delete participant with id=${id}`, error);
        return of(void 0);
      })
    );
  }
}
