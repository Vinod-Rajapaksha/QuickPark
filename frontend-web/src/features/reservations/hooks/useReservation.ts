import { useQuery } from '@tanstack/react-query';
import { reservationApi } from '../api/reservationApi';

export const RESERVATION_QUERY_KEY = ['reservation'];

export function useReservation(id?: string) {
  return useQuery({
    queryKey: [...RESERVATION_QUERY_KEY, id],
    queryFn: () => (id ? reservationApi.getById(id) : Promise.reject('No ID provided')),
    enabled: !!id,
  });
}
