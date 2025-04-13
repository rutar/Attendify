import { Participant } from './participant.model';

export interface Event {
  id: number;
  title: string;
  date: string;
  isPast: boolean;
  location?: string;
  description?: string;
  participants?: Participant[];
}
