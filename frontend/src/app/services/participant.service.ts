import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Participant } from '../models/participantbase.model';
import { Person } from '../models/person.model';
import { Company } from '../models/company.model';
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

  getParticipantFormOptions(
    type: 'PERSON' | 'COMPANY'
  ): Observable<any> {
    return this.http.post<any>(
      `${this.configService.getApiBaseUrl()}/participants/type`,
      { type }
    );
  }

  createPerson(person: Person): Observable<Person> {
    return this.http
      .post<Person>(
        `${this.configService.getApiBaseUrl()}/participants/persons`,
        person
      )
      .pipe(
        tap((newPerson) =>
          this.participants.update((parts) => [...parts, newPerson])
        )
      );
  }

  createCompany(company: Company): Observable<Company> {
    return this.http
      .post<Company>(
        `${this.configService.getApiBaseUrl()}/participants/companies`,
        company
      )
      .pipe(
        tap((newCompany) =>
          this.participants.update((parts) => [...parts, newCompany])
        )
      );
  }

  updatePerson(id: number, person: Person): Observable<Person> {
    return this.http
      .put<Person>(
        `${this.configService.getApiBaseUrl()}/participants/persons/${id}`,
        person
      )
      .pipe(
        tap((updated) =>
          this.participants.update((parts) =>
            parts.map((p) => (p.id === id ? updated : p))
          )
        )
      );
  }

  updateCompany(id: number, company: Company): Observable<Company> {
    return this.http
      .put<Company>(
        `${this.configService.getApiBaseUrl()}/participants/companies/${id}`,
        company
      )
      .pipe(
        tap((updated) =>
          this.participants.update((parts) =>
            parts.map((p) => (p.id === id ? updated : p))
          )
        )
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
