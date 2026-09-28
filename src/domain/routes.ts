import { ROUTES } from '@data/routes';
import { invariant } from './common/invariant';
import type { Route, RouteId } from './models';

export const getRoute = (routeId: RouteId): Route => {
  const route = ROUTES.find((candidate) => candidate.id === routeId);
  invariant(route, `unknown route ${routeId}`);
  return route;
};

export const routeNumber = (routeId: RouteId): number => {
  const index = ROUTES.findIndex((route) => route.id === routeId);
  invariant(index >= 0, `unknown route ${routeId}`);
  return index + 1;
};

export const startingRouteIds = (): RouteId[] =>
  ROUTES.filter((route) => route.unlock === null).map((route) => route.id);
