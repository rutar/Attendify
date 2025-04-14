

// Ettevõtte interfeis
import {ParticipantBase} from './participantbase.model';

export interface Company extends ParticipantBase {
  type: 'COMPANY';
  companyName: string;
  registrationCode: string;
  participantCount?: number;
  contactPerson?: string;
  email?: string;
  phone?: string;
}
