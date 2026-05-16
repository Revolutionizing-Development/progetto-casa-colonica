'use server';

import { withAccess } from '@/lib/access';
import { createClient } from '@/lib/supabase/server';
import type { PropertyRow } from './properties';
import type { RenovationScenario } from '@/types/renovation';
import type { ProjectType } from '@/types/project';

export interface ProjectComparisonData {
  projectId: string;
  projectName: string;
  projectType: ProjectType;
  property: PropertyRow | null;
  scenario: RenovationScenario | null;
  scenarioType: string;
}

export async function getProjectComparisonData(
  projectId: string,
): Promise<ProjectComparisonData> {
  const uid = await withAccess('project:read');
  const supabase = createClient();

  const { data: project } = await supabase
    .from('projects')
    .select('id, name, project_type')
    .eq('id', projectId)
    .eq('user_id', uid)
    .single();

  if (!project) {
    return { projectId, projectName: '', projectType: 'farmstead_hosting', property: null, scenario: null, scenarioType: '' };
  }

  const projectType = (project.project_type as ProjectType) ?? 'farmstead_hosting';

  const { data: properties } = await supabase
    .from('properties')
    .select('id, project_id, user_id, name, pipeline_stage, listed_price, sqm_house, sqm_land, land_ha, region, province, commune, num_bedrooms, num_bathrooms, energy_class, created_at, updated_at')
    .eq('project_id', projectId)
    .eq('user_id', uid)
    .order('created_at', { ascending: true })
    .limit(1);

  const property = (properties?.[0] as PropertyRow) ?? null;

  let scenario: RenovationScenario | null = null;
  let scenarioType = '';

  if (property) {
    const { data: scenarios } = await supabase
      .from('renovation_scenarios')
      .select('*')
      .eq('property_id', property.id)
      .eq('is_active', true)
      .order('type', { ascending: true });

    const allScenarios = (scenarios ?? []) as RenovationScenario[];
    scenario =
      allScenarios.find((s) => s.type === 'lifestyle') ??
      allScenarios.find((s) => s.type === 'basic') ??
      allScenarios[0] ??
      null;
    scenarioType = scenario?.type ?? '';
  }

  return {
    projectId,
    projectName: project.name,
    projectType,
    property,
    scenario,
    scenarioType,
  };
}
