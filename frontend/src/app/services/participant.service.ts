import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Participant } from '../models/participant.model';
import { ConfigService } from './config.service';

@Injectable({ providedIn: 'root' })
export class ParticipantService {
  private participants = signal<Participant[]>([]);

  constructor(private http: HttpClient, private configService: ConfigService) {}

  getParticipants() {
    return this.participants.asReadonly();
  }

  fetchParticipants() {
    this.http
      .get<Participant[]>(`${this.configService.getApiBaseUrl()}/participants`)
      .subscribe({
        next: (data) => this.participants.set(data),
        error: () => this.participants.set([]),
      });
  }

  getParticipant(id: number): Observable<Participant> {
    return this.http
      .get<Participant>(
        `${this.configService.getApiBaseUrl()}/participants/${id}`
      )
      .pipe(catchError(() => of(null as any)));
  }

  createParticipant(participant: Participant): Observable<Participant> {
    return this.http.post<Participant>(
      `${this.configService.getApiBaseUrl()}/participants`,
      participant
    );
  }

  updateParticipant(id: number, participant: Participant): Observable<Participant> {
    return this.http.put<Participant>(
      `${this.configService.getApiBaseUrl()}/participants/${id}`,
      participant
    );
  }

  searchParticipants(query: string, type?: string, field?: string): Observable<Participant[]> {
    let url = `${this.configService.getApiBaseUrl()}/participants`;
    const queryParams: string[] = [];

    if (query) {
      queryParams.push(`query=${encodeURIComponent(query)}`);
    }
    if (type) {
      queryParams.push(`type=${encodeURIComponent(type)}`);
    }
    if (field) {
      queryParams.push(`field=${encodeURIComponent(field)}`);
    }

    if (queryParams.length > 0) {
      url += `?${queryParams.join('&')}`;
    }

    //console.log('Search URL:', url);
    return this.http.get<{ content: Participant[] }>(url).pipe(
      map((response) => {
        // Extract content array, ensure it's an array
        return Array.isArray(response?.content) ? response.content : [];
      }),
      catchError((error) => {
        console.error('Search participants failed:', error);
        return of([]);
      })
    );
  }

  deleteParticipant(id: number): Observable<void> {
    return this.http
      .delete<void>(
        `${this.configService.getApiBaseUrl()}/participants/${id}`
      )
      .pipe(
        tap(() =>
          this.participants.update((parts) =>
            parts.filter((p) => p.id !== id)
          )
        ),
        catchError((error) => {
          console.error(`Failed to delete participant with id=${id}`, error);
          return of(void 0);
        })
      );
  }
}
