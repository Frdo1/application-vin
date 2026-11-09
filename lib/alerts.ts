// Version web : pas de notifications.
import type { CellarItem } from './types';

export { plannedAlerts } from './alerts-plan';

export const alertsSupported = false;
export async function alertsEnabled() {
  return false;
}
export async function enableAlerts(_on: boolean) {
  return false;
}
export async function scheduleAlerts(_cellar: CellarItem[]) {
  return 0;
}
