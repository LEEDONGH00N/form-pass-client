import axios, { AxiosError } from 'axios';
import {
  EventDetail,
  ReservationRequest,
  ReservationResponse,
  ReservationLookupRequest,
  ReservationLookupResponse,
} from '../types/event';
import { API_ENDPOINTS } from '../constants/api';

// Axios 인스턴스 생성 (쿠키 기반 인증)
const apiClient = axios.create({
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface FetchEventConfig {
  eventCode: string;
}

export const fetchEventDetails = async ({
  eventCode,
}: FetchEventConfig): Promise<EventDetail> => {
  const response = await apiClient.get<EventDetail>(
    API_ENDPOINTS.EVENTS(eventCode)
  );

  const data = response.data;
  const images =
    data.images && data.images.length > 0
      ? data.images
      : data.thumbnailUrl
      ? [data.thumbnailUrl]
      : [];

  return { ...data, images };
};

export const createReservation = async (
  request: ReservationRequest
): Promise<ReservationResponse> => {
  const response = await apiClient.post<ReservationResponse>(
    API_ENDPOINTS.RESERVATIONS,
    request
  );
  return response.data;
};

export const lookupReservations = async (
  request: ReservationLookupRequest
): Promise<ReservationLookupResponse[]> => {
  const response = await apiClient.post<ReservationLookupResponse[]>(
    API_ENDPOINTS.RESERVATIONS_LOOKUP,
    request
  );
  return response.data;
};

export const isAxiosError = (error: unknown): error is AxiosError => {
  return axios.isAxiosError(error);
};
