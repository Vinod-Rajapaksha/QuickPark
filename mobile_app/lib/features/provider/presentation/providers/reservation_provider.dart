import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/features/reservations/domain/models/reservation.dart';
import 'package:mobile_app/features/provider/domain/reservation_repository.dart';

final reservationProvider = FutureProvider.family<Reservation, String>((
  ref,
  id,
) async {
  final repository = ref.read(reservationRepositoryProvider);
  return repository.getReservationById(id);
});

final pendingReservationProvider = FutureProvider.autoDispose<Reservation?>((
  ref,
) async {
  final repository = ref.read(reservationRepositoryProvider);
  final reservations = await repository.getProviderReservations(
    status: 'PENDING',
  );
  return reservations.isNotEmpty ? reservations.first : null;
});

class ReservationActionNotifier extends Notifier<AsyncValue<void>> {
  @override
  AsyncValue<void> build() {
    return const AsyncData(null);
  }

  Future<void> approveReservation(String id) async {
    state = const AsyncLoading();
    try {
      final repository = ref.read(reservationRepositoryProvider);
      await repository.approveReservation(id);
      ref.invalidate(pendingReservationProvider);
      state = const AsyncData(null);
    } catch (e, st) {
      state = AsyncError(e, st);
      rethrow;
    }
  }

  Future<void> rejectReservation(String id, {String? reason}) async {
    state = const AsyncLoading();
    try {
      final repository = ref.read(reservationRepositoryProvider);
      await repository.rejectReservation(id, reason: reason);
      ref.invalidate(pendingReservationProvider);
      state = const AsyncData(null);
    } catch (e, st) {
      state = AsyncError(e, st);
      rethrow;
    }
  }

  Future<void> sendMessage(String id, String message) async {
    state = const AsyncLoading();
    try {
      final repository = ref.read(reservationRepositoryProvider);
      await repository.sendMessage(id, message);
      state = const AsyncData(null);
    } catch (e, st) {
      state = AsyncError(e, st);
      rethrow;
    }
  }

  /// The returns carry the reservation's new status, which is what the scanner
  /// shows after an action: the server owns the transition, the client only reports it.
  Future<Reservation> checkIn(String id) async {
    state = const AsyncLoading();
    try {
      final repository = ref.read(reservationRepositoryProvider);
      final reservation = await repository.checkIn(id);
      ref.invalidate(pendingReservationProvider);
      state = const AsyncData(null);
      return reservation;
    } catch (e, st) {
      state = AsyncError(e, st);
      rethrow;
    }
  }

  Future<Reservation> checkOut(String id) async {
    state = const AsyncLoading();
    try {
      final repository = ref.read(reservationRepositoryProvider);
      final reservation = await repository.checkOut(id);
      ref.invalidate(pendingReservationProvider);
      state = const AsyncData(null);
      return reservation;
    } catch (e, st) {
      state = AsyncError(e, st);
      rethrow;
    }
  }
}

final reservationActionProvider =
    NotifierProvider.autoDispose<ReservationActionNotifier, AsyncValue<void>>(
      ReservationActionNotifier.new,
    );
