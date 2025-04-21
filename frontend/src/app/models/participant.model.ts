export interface Participant {
  id?: number;
  type: 'PERSON' | 'COMPANY' | null;
  firstName?: string;
  lastName?: string;
  personalCode?: string;
  companyName?: string;
  registrationCode?: string;
  participantCount?: number;
  contactPerson?: string;
  paymentMethod?: 'CARD' | 'BANK_TRANSFER' | 'CASH' | null;
  email?: string;
  phone?: string;
  additionalInfo?: string;
}
