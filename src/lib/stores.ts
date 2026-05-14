/**
 * Aditus adapter instantiation.
 *
 * createPostgresAdapter is part of the adapters module (src/adapters/) which
 * is still being built in Aditus. Once released, import it here and pass the
 * pool — the rest of the app already calls stores.user in the correct pattern.
 *
 * Current Aditus status (2026-05-14):
 *   ✅ checkAccess (src/core/check-access.ts)
 *   ✅ State machine, permission matrix
 *   🔜 createPostgresAdapter (src/adapters/) — pending
 *   🔜 createMeteringMiddleware — pending
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

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createPostgresAdapter } = require('@revolutionizing-development/aditus');
    _stores = { user: createPostgresAdapter(pool) };
  } catch {
    // Aditus adapters not yet released — stub until available
    _stores = {
      user: {
        _pool: pool,
        _stub: true,
      },
    };
  }

  return _stores;
}

export const stores = new Proxy({} as { user: unknown }, {
  get(_target, prop) {
    return getStores()[prop as 'user'];
  },
});
