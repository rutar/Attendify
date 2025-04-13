export interface Participant {
  id: number;
  type: 'person' | 'company';
  paymentMethod: 'sularaha' | 'kaart' | 'ülekanne';
  extraInfo?: string;
  firstName?: string;
  lastName?: string;
  idCode?: string;
  companyName?: string;
  regCode?: string;
}
