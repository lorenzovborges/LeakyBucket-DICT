import type { AuthTenant } from '../modules/tenant/tenant.repository';

export interface AppState {
  tenant?: AuthTenant;
}
