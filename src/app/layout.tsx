import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { getLocale } from 'next-intl/server';
import './globals.css';

export const metadata: Metadata = {
  title: 'Progetto Casa Colonica',
  description: 'Italian farmhouse acquisition and renovation feasibility analysis',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();

  return (
    <ClerkProvider>
      <html lang={locale}>
        <body className="bg-stone-50 text-stone-900 antialiased min-h-screen flex flex-col">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
