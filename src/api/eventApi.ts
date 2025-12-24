import axios, { AxiosError } from 'axios';
import {
  EventDetail,
  ReservationRequest,
  ReservationResponse,
  ReservationLookupRequest,
  ReservationLookupResponse,
} from '../types/event';
import { API_ENDPOINTS } from '../constants/api';

interface FetchEventConfig {
  eventCode: string;
  accessToken?: string | null;
}

export const fetchEventDetails = async ({
  eventCode,
  accessToken,
}: FetchEventConfig): Promise<EventDetail> => {
  const config = accessToken
    ? { headers: { Authorization: `Bearer ${accessToken}` } }
    : {};

  const response = await axios.get<EventDetail>(
    API_ENDPOINTS.EVENTS(eventCode),
    config
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
  const response = await axios.post<ReservationResponse>(
    API_ENDPOINTS.RESERVATIONS,
    request
  );
  return response.data;
};

export const lookupReservations = async (
  request: ReservationLookupRequest
): Promise<ReservationLookupResponse[]> => {
  const response = await axios.post<ReservationLookupResponse[]>(
    API_ENDPOINTS.RESERVATIONS_LOOKUP,
    request
  );
  return response.data;
};

export const isAxiosError = (error: unknown): error is AxiosError => {
  return axios.isAxiosError(error);
};
