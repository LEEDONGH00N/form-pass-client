const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export const API_HOST = IS_PRODUCTION
  ? 'https://api.form-pass.life'
  : 'http://localhost:8080';

export const API_ENDPOINTS = {
  EVENTS: (eventCode: string) => `${API_HOST}/api/events/${eventCode}`,
  RESERVATIONS: `${API_HOST}/api/reservations`,
  RESERVATIONS_LOOKUP: `${API_HOST}/api/reservations/lookup`,
} as const;
