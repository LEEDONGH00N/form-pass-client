// src/types/event.ts

// ScheduleRequest DTO에 대응
export interface ScheduleRequest {
  startTime: string; 
  endTime: string;   
  capacity: number;  
}

// QuestionRequest DTO에 대응 (간단하게 정의)
export interface QuestionRequest {
  type: 'TEXT' | 'SELECT' | 'CHECKBOX'; 
  label: string; 
  required: boolean; 
}

// CreateEventRequest DTO에 대응
export interface CreateEventRequest {
  title: string;
  location: string; // 현재 UI에는 없으나 DTO에 있으므로 추가
  thumbnailUrl: string;
  description: string;
  schedules: ScheduleRequest[];
  questions: QuestionRequest[];
}

export interface EventResponse {
    id: number; // DB에서 생성된 이벤트 ID
    title: string;
    location: string;
    thumbnailUrl: string;
    description: string;
    schedules: ScheduleResponse[]; // 위에서 정의한 ScheduleResponse 타입 사용
    questions: QuestionResponse[]; // 위에서 정의한 QuestionResponse 타입 사용
}

// ScheduleResponse DTO에 대응
export interface ScheduleResponse {
    id: number;           // DB에서 생성된 스케줄 ID
    startTime: string;    // 백엔드의 LocalDateTime (예: "2025-12-30T14:00:00")
    endTime: string;      // 백엔드의 LocalDateTime
    maxCapacity: number;  // 최대 정원 (DTO: maxCapacity)
    reservedCount: number; // 현재 예약된 인원 수
}

// 백엔드의 QuestionType Enum에 대응 (필요시 상세 정의)
export type QuestionType = 'TEXT' | 'SELECT' | 'CHECKBOX'; 

// QuestionResponse DTO에 대응
export interface QuestionResponse {
    id: number;              // DB에서 생성된 질문 ID
    questionText: string;    // 질문 내용 (DTO: questionText)
    questionType: QuestionType; // 질문 유형 (DTO: questionType)
    isRequired: boolean;     // 필수 여부 (DTO: isRequired)
}