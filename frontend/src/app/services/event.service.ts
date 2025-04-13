import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Event } from '../models/event.model';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class EventService {
  private events = signal<Event[]>([]);

  constructor(private http: HttpClient) {}

  getEvents() {
    return this.events.asReadonly();
  }

  fetchEvents() {
    this.http.get<Event[]>('http://localhost:3000/events').subscribe(data => this.events.set(data));
  }

  getEvent(id: number): Observable<Event> {
    return this.http.get<Event>(`http://localhost:3000/events/${id}`);
  }

  removeEvent(id: number): Observable<void> {
    return this.http.delete<void>(`http://localhost:3000/events/${id}`).pipe(
      tap(() => this.events.update(events => events.filter(e => e.id !== id)))
    );
  }
}
