import { SAFETY_NET_ECO_COST_MULT, SAFETY_NET_GIFT_SEATS } from '@data/balance';
import { giftSeats } from './inventory';
import type { Flight, OwnedSeat, RouteId } from './models';
import { rngFor } from './rng';
import { getRoute } from './routes';

import { routeOnDay } from './economy';

const cheapestRoute = (unlockedRoutes: readonly RouteId[], day: number) =>
  unlockedRoutes.map((routeId) => routeOnDay(getRoute(routeId), day)).reduce((best, route) => (route.cost.ECONOMY < best.cost.ECONOMY ? route : best));

/** §3.10: checked at the start of PREP. */
export const needsSupport = (money: number, unlockedRoutes: readonly RouteId[], day = 1): boolean =>
  money < SAFETY_NET_ECO_COST_MULT * cheapestRoute(unlockedRoutes, day).cost.ECONOMY;

/** 3 free ECONOMY seats on the earliest flight of the cheapest route. */
export const supportGift = (
  seed: number,
  day: number,
  flights: readonly Flight[],
  seats: readonly OwnedSeat[],
  unlockedRoutes: readonly RouteId[],
): { flight: Flight; seats: OwnedSeat[] } | null => {
  const route = cheapestRoute(unlockedRoutes, day);
  const flight = flights
    .filter((candidate) => candidate.routeId === route.id && candidate.status === 'SCHEDULED')
    .reduce<Flight | null>((earliest, candidate) => (!earliest || candidate.departAt < earliest.departAt ? candidate : earliest), null);
  if (!flight) return null;
  return { flight, seats: giftSeats(flight, 'ECONOMY', SAFETY_NET_GIFT_SEATS, seats, rngFor(seed, day, 'support')) };
};
