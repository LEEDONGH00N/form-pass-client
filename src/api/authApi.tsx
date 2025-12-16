import axios from 'axios';

// Axios 인스턴스 생성
const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: baseURL, 
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- 타입 정의 (DTO) ---
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  name: string;
  password: string;
}

export interface EmailRequest {
  email: string;
}

export interface VerifyRequest {
  email: string;
  authCode: string;
}

// --- API 함수 모음 ---
export const authApi = {
  // 로그인
  login: (data: LoginRequest) => api.post('/api/auth/login', data),
  
  // 회원가입
  signup: (data: SignupRequest) => api.post('/api/auth/signup', data),
  
  // 인증 메일 발송
  sendEmail: (data: EmailRequest) => api.post('/api/auth/email/send', data),
  
  // 인증 코드 검증
  verifyEmail: (data: VerifyRequest) => api.post('/api/auth/email/verify', data),
};