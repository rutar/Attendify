
// Baasiinterfeis kõigile osalejatele
import {Person} from './person.model';
import {Company} from './company.model';

// src/app/models/participantbase.model.ts
export interface ParticipantBase {
  id: number;
  paymentMethod: string;
  additionalInfo?: string;
  status: ParticipantStatus;
}

// Osaleja tüübid
export type Participant = Person | Company;

export enum ParticipantStatus {
  CONFIRMED = 'confirmed',
  PENDING = 'pending',
  DECLINED = 'declined',
}

