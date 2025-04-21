// src/models/participant-response.model.ts
export interface ParticipantResponse {
  participant: {
    id: number;
    type: string | null;
    name: string | null;
    code: string | null;
    paymentMethod: string;
    additionalInfo: string | null;
    email: string | null;
    phone: string | null;
    participantCount: number | null;
    contactPerson: string | null;
  };
  attendanceStatus: string;
  registeredAt: string;
}
