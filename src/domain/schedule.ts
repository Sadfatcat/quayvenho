import { ROUTES } from '@data/routes';
import {
  BASE_SLOT_INDEXES,
  FULL_SCHEDULE_FROM_DAY,
  FULL_SCHEDULE_MIN_ROUTE_WEIGHT,
  OTHER_AGENT_SHARE,
  SLOT_DEPART_AT,
} from '@data/schedule';
import { invariant } from './common/invariant';
import type { CabinClass, Flight, Route, RouteId, SeatId } from './models';
import { rngFor } from './rng';
import { getRoute, routeNumber } from './routes';
import { seatsOfCabin } from './seatMap';

const CABINS: readonly CabinClass[] = ['BUSINESS', 'ECONOMY'];

export const slotIndexesFor = (route: Route, day: number): readonly number[] =>
  day >= FULL_SCHEDULE_FROM_DAY && route.weight >= FULL_SCHEDULE_MIN_ROUTE_WEIGHT
    ? SLOT_DEPART_AT.map((_, index) => index)
    : BASE_SLOT_INDEXES;

/** QV + route number + slot, e.g. HAN-SGN slot 0 → QV101. */
export const flightCode = (routeId: RouteId, slotIndex: number): string =>
  `QV${routeNumber(routeId)}0${slotIndex + 1}`;

const pickTakenByOthers = (seed: number, day: number, flightId: string): SeatId[] => {
  const rng = rngFor(seed, day, `schedule:${flightId}`);
  return CABINS.flatMap((cabin) => {
    const seats = seatsOfCabin(cabin);
    const count = rng.int(
      Math.ceil(seats.length * OTHER_AGENT_SHARE.min),
      Math.floor(seats.length * OTHER_AGENT_SHARE.max),
    );
    return rng.shuffle(seats).slice(0, count);
  });
};

export const generateFlights = (seed: number, day: number, unlockedRoutes: readonly RouteId[]): Flight[] =>
  ROUTES.filter((route) => unlockedRoutes.includes(route.id)).flatMap((route) =>
    slotIndexesFor(route, day).map((slotIndex) => {
      const departAt = SLOT_DEPART_AT[slotIndex];
      invariant(departAt !== undefined, `bad slot ${slotIndex}`);
      const id = flightCode(route.id, slotIndex);
      return { id, routeId: route.id, departAt, status: 'SCHEDULED', takenByOthers: pickTakenByOthers(seed, day, id) };
    }),
  );

export const findFlight = (flights: readonly Flight[], flightId: string): Flight | undefined =>
  flights.find((flight) => flight.id === flightId);

export const routeOfFlight = (flight: Flight): Route => getRoute(flight.routeId);
