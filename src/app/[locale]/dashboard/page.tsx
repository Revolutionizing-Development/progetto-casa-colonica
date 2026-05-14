import { Suspense } from 'react';
import { getProjects } from '@/app/actions/projects';
import DashboardShell from '@/components/project/DashboardShell';

export default async function DashboardPage() {
  const projects = await getProjects();

  return (
    <Suspense>
      <DashboardShell projects={projects} />
    </Suspense>
  );
}
