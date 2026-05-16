/**
 * Access control wrapper for all protected routes.
 *
 * TODO: when @revolutionizing-development/aditus ships and adapters are ready,
 * restore the full checkAccess call:
 *
 *   import { checkAccess } from '@revolutionizing-development/aditus';
 *   import { getStores } from './stores';
 *   import { matrix } from '@/config/permissions';
 *
 *   const stores = getStores();
 *   const decision = await checkAccess(uid, action, { stores: stores.user, matrix });
 *   if (!decision.allowed) throw new Error(decision.reason ?? 'Access denied');
 */
import { requireUid } from './auth';
import { type Action } from '@/config/permissions';

/**
 * Every protected route calls withAccess() first.
 * Returns the verified Clerk uid on success; throws on auth failure.
 * Permission matrix enforcement is stubbed until Aditus adapters ship.
 */
export async function withAccess(_action: Action): Promise<string> {
  return requireUid();
}
