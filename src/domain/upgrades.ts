import { BASE_MODIFIERS } from '@data/balance';
import { ROUTES } from '@data/routes';
import { UPGRADES } from '@data/upgrades';
import { err, ok, type Result } from './common/result';
import { isTravelVietOpen } from './demand';
import type { Modifiers, RouteId, UpgradeDef, UpgradeId } from './models';

const MULTIPLIED: readonly (keyof Modifiers)[] = ['patienceMult', 'tipMult'];

/** Multipliers stack by product; other effects override. */
export const computeModifiers = (upgradeIds: readonly UpgradeId[]): Modifiers =>
  UPGRADES.filter((upgrade) => upgradeIds.includes(upgrade.id)).reduce<Modifiers>((mods, upgrade) => {
    const next = { ...mods };
    for (const [key, value] of Object.entries(upgrade.effect) as [keyof Modifiers, number | boolean][]) {
      if (MULTIPLIED.includes(key)) (next[key] as number) = (mods[key] as number) * (value as number);
      else (next[key] as number | boolean) = value;
    }
    return next;
  }, BASE_MODIFIERS);

export const findUpgrade = (upgradeId: UpgradeId): UpgradeDef | undefined =>
  UPGRADES.find((upgrade) => upgrade.id === upgradeId);

interface ShopContext {
  day: number;
  money: number;
  travelViet: number;
}

export type UpgradeError = 'UNKNOWN_UPGRADE' | 'ALREADY_OWNED' | 'NOT_ENOUGH_MONEY' | 'DAY_TOO_EARLY' | 'TRAVELVIET_LOCKED' | 'TRAVELVIET_TOO_LOW';

const checkTravelViet = (min: number | null, ctx: ShopContext): 'TRAVELVIET_LOCKED' | 'TRAVELVIET_TOO_LOW' | null => {
  if (min === null) return null;
  if (!isTravelVietOpen(ctx.day)) return 'TRAVELVIET_LOCKED';
  return ctx.travelViet < min ? 'TRAVELVIET_TOO_LOW' : null;
};

export const checkUpgrade = (
  upgradeId: UpgradeId,
  owned: readonly UpgradeId[],
  ctx: ShopContext,
): Result<UpgradeDef, UpgradeError> => {
  const upgrade = findUpgrade(upgradeId);
  if (!upgrade) return err('UNKNOWN_UPGRADE');
  if (owned.includes(upgradeId)) return err('ALREADY_OWNED');
  if (upgrade.minDay !== null && ctx.day < upgrade.minDay) return err('DAY_TOO_EARLY');
  const travelVietError = checkTravelViet(upgrade.minTravelViet, ctx);
  if (travelVietError) return err(travelVietError);
  if (ctx.money < upgrade.cost) return err('NOT_ENOUGH_MONEY');
  return ok(upgrade);
};

export type RouteUnlockError = 'UNKNOWN_ROUTE' | 'ALREADY_UNLOCKED' | 'NOT_ENOUGH_MONEY' | 'TRAVELVIET_LOCKED' | 'TRAVELVIET_TOO_LOW';

export const checkRouteUnlock = (
  routeId: RouteId,
  unlocked: readonly RouteId[],
  ctx: ShopContext,
): Result<number, RouteUnlockError> => {
  const route = ROUTES.find((candidate) => candidate.id === routeId);
  if (!route) return err('UNKNOWN_ROUTE');
  if (unlocked.includes(routeId) || route.unlock === null) return err('ALREADY_UNLOCKED');
  const travelVietError = checkTravelViet(route.unlock.minTravelViet, ctx);
  if (travelVietError) return err(travelVietError);
  if (ctx.money < route.unlock.cost) return err('NOT_ENOUGH_MONEY');
  return ok(route.unlock.cost);
};
