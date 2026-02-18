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
  questionType: 'TEXT' | 'CHECKBOX' | 'RADIO';
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
  id: number;
  qrToken: string;
  guestName: string;
  guestPhoneNumber: string;
  ticketCount: number;
  status: 'CONFIRMED' | 'CANCELLED';
  isCheckedIn: boolean;
  eventTitle: string;
  eventLocation: string;
  schedule: {
    id: number;
    startTime: string;
    endTime: string;
  };
  answers: {
    questionId: number;
    questionText: string;
    answerText: string;
  }[];
  createdAt: string;
}

export interface ReservationLookupRequest {
  guestName: string;
  guestPhoneNumber: string;
}

export interface ReservationLookupResponse {
  qrToken: string;
  eventTitle: string;
  guestName: string;
  ticketCount: number;
  createdAt: string;
}

export type ErrorType = 'NONE' | 'PRIVATE' | 'NOT_FOUND' | 'SERVER_ERROR';
