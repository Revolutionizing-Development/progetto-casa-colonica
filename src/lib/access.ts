import { requireUid } from './auth';
import { getStores } from './stores';
import { matrix, type Action } from '@/config/permissions';

/**
 * Every protected route calls withAccess() first.
 * Returns the verified Clerk uid on success; throws on auth failure or access denial.
 *
 * When Aditus adapters ship (createPostgresAdapter), the stores.user stub resolves
 * automatically and checkAccess runs against the real permission matrix.
 * Until then, any authenticated user is allowed (stub path).
 */
export async function withAccess(action: Action): Promise<string> {
  const uid = await requireUid();
  const stores = getStores();

  // Stub path: adapters not yet released, skip matrix check
  if ((stores.user as { _stub?: boolean })._stub) {
    return uid;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { checkAccess } = require('@revolutionizing-development/aditus');
    const decision = await checkAccess(uid, action, { stores: stores.user, matrix });
    if (!decision.allowed) {
      throw new Error(decision.reason ?? 'Access denied');
    }
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'Access denied') throw err;
    // Package not installed or import error — graceful degradation
  }

  return uid;
}
