import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reservationApi } from '../api/reservationApi';

export const PROVIDER_RESERVATIONS_QUERY_KEY = ['providerReservations'];

export function useProviderReservations(status?: string) {
  return useQuery({
    queryKey: [...PROVIDER_RESERVATIONS_QUERY_KEY, status],
    queryFn: () => reservationApi.getProvider(status),
  });
}

export function useApproveReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reservationApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROVIDER_RESERVATIONS_QUERY_KEY });
    },
  });
}

export function useRejectReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => reservationApi.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROVIDER_RESERVATIONS_QUERY_KEY });
    },
  });
}

export function useSendReservationMessage() {
  return useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) => reservationApi.sendMessage(id, message),
  });
}
