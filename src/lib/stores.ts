/**
 * Aditus adapter instantiation.
 *
 * TODO: when @revolutionizing-development/aditus ships createPostgresAdapter,
 * import it here and replace the stub:
 *
 *   import { createPostgresAdapter } from '@revolutionizing-development/aditus';
 *   _stores = { user: createPostgresAdapter(pool) };
 */
import { Pool } from 'pg';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _stores: { user: any } | null = null;

function getPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
}

export function getStores() {
  if (_stores) return _stores;
  const pool = getPool();
  // Stub: adapters not yet released — every authenticated user is allowed through
  _stores = { user: { _pool: pool, _stub: true } };
  return _stores;
}

export const stores = new Proxy({} as { user: unknown }, {
  get(_target, prop) {
    return getStores()[prop as 'user'];
  },
});
