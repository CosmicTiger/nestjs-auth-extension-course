import { CoffeesPermissions } from 'src/coffees/coffees.permission';

export const Permission: Record<string, string> = {
  ...CoffeesPermissions,
};

export type PermissionType = CoffeesPermissions;
