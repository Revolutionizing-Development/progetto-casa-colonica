import { requireUid } from '@/lib/auth';
import { useTranslations } from 'next-intl';

export default async function DashboardPage() {
  await requireUid();

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold text-stone-900">Dashboard</h1>
      <p className="mt-2 text-stone-500">Your projects and properties will appear here.</p>
    </main>
  );
}
