
// Füüsilise isiku interfeis
import {ParticipantBase} from './participantbase.model';

export interface Person extends ParticipantBase {
  type: 'PERSON';
  firstName: string;
  lastName: string;
  personalCode: string;
  email?: string;
  phone?: string;
}
