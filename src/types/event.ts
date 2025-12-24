export interface Schedule {
  id: number;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  reservedCount: number;
}

export interface Question {
  id: number;
  questionText: string;
  questionType: 'TEXT' | 'SELECT' | 'CHECKBOX';
  isRequired: boolean;
}

export interface EventDetail {
  title: string;
  location: string;
  images: string[];
  thumbnailUrl?: string;
  description: string;
  schedules: Schedule[];
  questions: Question[];
  hostName?: string;
}

export interface Answer {
  questionId: number;
  answerText: string;
}

export interface ReservationRequest {
  scheduleId: number;
  guestName: string;
  guestPhoneNumber: string;
  ticketCount: number;
  answers: Answer[];
}

export interface ReservationResponse {
  qrToken: string;
}

export interface ReservationLookupRequest {
  guestName: string;
  guestPhoneNumber: string;
}

export interface ReservationLookupResponse {
  qrToken: string;
  eventTitle: string;
  guestName: string;
  createdAt: string;
}

export type ErrorType = 'NONE' | 'PRIVATE' | 'NOT_FOUND' | 'SERVER_ERROR';
