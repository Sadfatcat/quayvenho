import { matchesTimePref } from './clock';
import type { CabinClass, Flight, Order, OwnedSeat, RouteId } from './models';

const hasAvailableSeat = (flight: Flight, seats: readonly OwnedSeat[], cabin: CabinClass | null): boolean =>
  seats.some(
    (seat) => seat.flightId === flight.id && seat.state === 'AVAILABLE' && (cabin === null || seat.cabin === cabin),
  );

/** §8.5: a sellable flight on the route, in the time window, with an AVAILABLE seat of the cabin. */
export const canServe = (
  order: Pick<Order, 'routeId' | 'cabin' | 'timePref'>,
  flights: readonly Flight[],
  seats: readonly OwnedSeat[],
): boolean =>
  flights.some(
    (flight) =>
      flight.routeId === order.routeId &&
      flight.status === 'SCHEDULED' &&
      matchesTimePref(flight.departAt, order.timePref) &&
      hasAvailableSeat(flight, seats, order.cabin),
  );

export const routeHasAvailableSeat = (
  routeId: RouteId,
  flights: readonly Flight[],
  seats: readonly OwnedSeat[],
): boolean =>
  flights.some((flight) => flight.routeId === routeId && flight.status === 'SCHEDULED' && hasAvailableSeat(flight, seats, null));
