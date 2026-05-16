import { getProjects } from '@/app/actions/projects';
import { getHouseholdProfile } from '@/app/actions/household';
import ProjectComparison from '@/components/project/ProjectComparison';

export default async function CompareProjectsPage() {
  const [projects, householdProfile] = await Promise.all([
    getProjects(),
    getHouseholdProfile(),
  ]);

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-stone-900 mb-2">Compare Life Scenarios</h1>
      <p className="text-sm text-stone-500 mb-8">
        Side-by-side comparison of two projects — total investment, income, operating costs,
        and quality of life.
      </p>

      <ProjectComparison projects={projects} householdProfile={householdProfile} />
    </main>
  );
}
