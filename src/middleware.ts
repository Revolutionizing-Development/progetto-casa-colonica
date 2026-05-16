import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from '@/i18n/config';
import { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

const isPublicRoute = createRouteMatcher([
  '/:locale',
  '/:locale/sign-in(.*)',
  '/:locale/sign-up(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

// API routes are handled by Next.js directly — no locale prefix, no intl rewriting.
const isApiRoute = (req: NextRequest) =>
  req.nextUrl.pathname.startsWith('/api/') || req.nextUrl.pathname.startsWith('/trpc/');

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Skip i18n middleware for API and tRPC routes entirely.
  // Clerk auth.protect() still runs to block unauthenticated requests.
  if (isApiRoute(req)) {
    if (!isPublicRoute(req)) {
      await auth.protect();
    }
    return; // Let Next.js route the request normally, no locale rewriting
  }

  if (isPublicRoute(req)) {
    return intlMiddleware(req);
  }

  await auth.protect();
  return intlMiddleware(req);
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
