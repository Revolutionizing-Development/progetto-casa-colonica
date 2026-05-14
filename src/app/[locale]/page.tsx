import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function LandingPage() {
  const t = useTranslations();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-stone-50">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-4xl font-semibold tracking-tight text-stone-900">
          {t('landing.headline')}
        </h1>
        <p className="text-lg text-stone-600">{t('landing.subheadline')}</p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/sign-up"
            className="px-6 py-3 bg-amber-700 text-white rounded-md hover:bg-amber-800 transition-colors"
          >
            {t('landing.cta')}
          </Link>
          <Link
            href="/sign-in"
            className="px-6 py-3 border border-stone-300 text-stone-700 rounded-md hover:bg-stone-100 transition-colors"
          >
            {t('landing.cta_signin')}
          </Link>
        </div>
      </div>
    </main>
  );
}
