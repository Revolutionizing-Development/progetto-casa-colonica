'use client';

import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/compare-projects', label: 'Compare' },
  { href: '/guide', label: 'Guide' },
  { href: '/contacts', label: 'Contacts' },
  { href: '/settings', label: 'Settings' },
];

export default function NavBar() {
  const pathname = usePathname();
  const { locale } = useParams<{ locale: string }>();

  function localePath(path: string) {
    return `/${locale}${path}`;
  }

  function isActive(path: string) {
    return pathname.startsWith(localePath(path));
  }

  return (
    <header className="h-14 border-b border-stone-200 bg-white flex items-center px-6 gap-8 shrink-0">
      <Link
        href={localePath('/dashboard')}
        className="text-stone-900 font-semibold tracking-tight text-sm shrink-0"
      >
        Casa Colonica
      </Link>

      <nav className="flex items-center gap-1 flex-1">
        {NAV_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={localePath(href)}
            className={[
              'px-3 py-1.5 rounded text-sm transition-colors',
              isActive(href)
                ? 'bg-stone-100 text-stone-900 font-medium'
                : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50',
            ].join(' ')}
          >
            {label}
          </Link>
        ))}
      </nav>

      <UserButton />
    </header>
  );
}
