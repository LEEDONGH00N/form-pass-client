import axios from 'axios';

// Axios 인스턴스 생성
const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- 토큰 관리 함수 ---
const TOKEN_KEY = 'accessToken';

export const getAccessToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setAccessToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeAccessToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};

// --- Request Interceptor: Authorization 헤더 추가 ---
api.interceptors.request.use(
  (config) => {
    // /api/auth/** 요청은 Authorization 헤더 제외
    const isAuthEndpoint = config.url?.startsWith('/api/auth/');

    const token = getAccessToken();
    if (token && !isAuthEndpoint) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- 타입 정의 (DTO) ---
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  email: string;
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
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/api/auth/login', data);
    const { accessToken } = response.data;
    setAccessToken(accessToken);
    return response.data;
  },

  // 로그아웃 (서버 요청 없이 로컬 토큰만 삭제)
  logout: (): void => {
    removeAccessToken();
  },

  // 회원가입
  signup: (data: SignupRequest) => api.post('/api/auth/signup', data),

  // 인증 메일 발송
  sendEmail: (data: EmailRequest) => api.post('/api/auth/email/send', data),

  // 인증 코드 검증
  verifyEmail: (data: VerifyRequest) => api.post('/api/auth/email/verify', data),
};

// 인증이 필요한 API용 axios 인스턴스 export
export { api as authAxios };