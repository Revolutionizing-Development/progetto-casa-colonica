import { getHouseholdProfile } from '@/app/actions/household';
import HouseholdProfileForm from '@/components/settings/HouseholdProfileForm';

export default async function SettingsPage() {
  const profile = await getHouseholdProfile();

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-stone-900 mb-2">Settings</h1>
      <p className="text-sm text-stone-500 mb-8">
        Household inputs that flow into every project&apos;s financial model.
      </p>

      <HouseholdProfileForm initialProfile={profile} />
    </main>
  );
}
