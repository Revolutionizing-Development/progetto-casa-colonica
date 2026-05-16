import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}

/**
 * Plain service-role client for Route Handlers and background jobs.
 * No cookie management — safe to call from any async context.
 * Service role bypasses RLS, so ownership checks must be done in app code.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * Set the Clerk user ID in the Supabase session so RLS policies can read it
 * via current_clerk_uid(). Call this at the start of every Server Action or
 * Route Handler that queries Supabase on behalf of a user.
 */
export async function setClerkUid(client: ReturnType<typeof createClient>, uid: string) {
  await client.rpc('set_config', {
    setting: 'app.current_user_id',
    value: uid,
    is_local: true,
  });
}
