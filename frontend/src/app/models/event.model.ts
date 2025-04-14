import { Participant } from './participantbase.model';

export interface Event {
  id: number;
  name: string;
  dateTime: string;
  isPast: boolean;
  location?: string;
  additionalInfo?: string;
  participantCount?: Participant[];
}
