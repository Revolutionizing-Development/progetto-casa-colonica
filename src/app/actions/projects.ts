'use server';

import { withAccess } from '@/lib/access';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { ProjectType } from '@/types/project';
export type { ProjectType } from '@/types/project';

const ProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  project_type: z.enum(['private_homestead', 'farmstead_hosting']),
});

export type ProjectRow = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  project_type: ProjectType;
  created_at: string;
  updated_at: string;
};

export type ActionResult<T> = { data: T; error?: never } | { data?: never; error: string };

export async function getProjects(): Promise<ProjectRow[]> {
  const uid = await withAccess('project:read');
  const supabase = createClient();

  const { data, error } = await supabase
    .from('projects')
    .select('id, user_id, name, description, project_type, created_at, updated_at')
    .eq('user_id', uid)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as ProjectRow[];
}

export async function getProject(id: string): Promise<ProjectRow | null> {
  const uid = await withAccess('project:read');
  const supabase = createClient();

  const { data, error } = await supabase
    .from('projects')
    .select('id, user_id, name, description, project_type, created_at, updated_at')
    .eq('id', id)
    .eq('user_id', uid)
    .single();

  if (error) return null;
  return data as ProjectRow;
}

export async function createProject(
  _prev: ActionResult<ProjectRow> | null,
  formData: FormData,
): Promise<ActionResult<ProjectRow>> {
  const uid = await withAccess('project:create');

  const parsed = ProjectSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    project_type: formData.get('project_type'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = createClient();
  const { data, error } = await supabase
    .from('projects')
    .insert({ ...parsed.data, user_id: uid })
    .select('id, user_id, name, description, project_type, created_at, updated_at')
    .single();

  if (error) return { error: error.message };

  revalidatePath('/', 'layout');
  return { data: data as ProjectRow };
}

export async function updateProject(
  id: string,
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const uid = await withAccess('project:update');

  const parsed = ProjectSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = createClient();
  const { error } = await supabase
    .from('projects')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', uid);

  if (error) return { error: error.message };

  revalidatePath('/', 'layout');
  return { data: { id } };
}

export async function deleteProject(id: string): Promise<ActionResult<{ id: string }>> {
  const uid = await withAccess('project:delete');

  const supabase = createClient();
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', uid);

  if (error) return { error: error.message };

  revalidatePath('/', 'layout');
  return { data: { id } };
}
