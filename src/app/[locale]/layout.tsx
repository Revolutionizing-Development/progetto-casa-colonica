import { ClerkProvider } from '@clerk/nextjs';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { locales, type Locale } from '@/i18n/config';
import NavBar from '@/components/layout/NavBar';
import '../globals.css';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale as Locale)) notFound();

  const { userId } = await auth();
  const messages = await getMessages();

  return (
    <ClerkProvider>
      <html lang={locale}>
        <body className="bg-stone-50 text-stone-900 antialiased min-h-screen flex flex-col">
          <NextIntlClientProvider locale={locale} messages={messages}>
            {userId && <NavBar />}
            <div className="flex-1">{children}</div>
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
