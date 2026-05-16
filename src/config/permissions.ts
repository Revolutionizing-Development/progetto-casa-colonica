/**
 * Aditus permission matrix for Progetto Casa Colonica.
 *
 * Tiers: free, starter, pro, team
 * Actions: project:*, property:*, ai:*, invoice:*, export:*
 *
 * Used by checkAccess() and createMeteringMiddleware() from Aditus.
 * Import this everywhere you call checkAccess — never define inline.
 */

export type Tier = 'free' | 'starter' | 'pro' | 'team';

export type Action =
  // Project management
  | 'project:create'
  | 'project:read'
  | 'project:update'
  | 'project:delete'
  // Property management
  | 'property:create'
  | 'property:read'
  | 'property:update'
  | 'property:delete'
  | 'property:advance-pipeline'
  // AI actions (metered)
  | 'ai:analyze-property'
  | 'ai:generate-scenarios'
  | 'ai:estimate-renovation'
  | 'ai:assess-regulatory'
  | 'ai:assess-layout'
  | 'ai:assess-energy'
  | 'ai:compare-properties'
  | 'ai:refine-estimate'
  | 'ai:estimate-arv'
  | 'ai:ocr-invoice'
  // Household profile
  | 'household:read'
  | 'household:update'
  // Cost tracking
  | 'invoice:create'
  | 'invoice:read'
  | 'invoice:update'
  | 'invoice:delete'
  // Export
  | 'export:commercialista'
  | 'export:csv';

export interface TierPermissions {
  tier: Tier;
  maxProjects: number;
  maxPropertiesPerProject: number;
  aiRequestsPerMonth: number;
  actions: Action[];
}

export const TIER_PERMISSIONS: Record<Tier, TierPermissions> = {
  free: {
    tier: 'free',
    maxProjects: 1,
    maxPropertiesPerProject: 3,
    aiRequestsPerMonth: 5,
    actions: [
      'project:create',
      'project:read',
      'project:update',
      'property:create',
      'property:read',
      'property:update',
      'ai:analyze-property',
      'household:read',
      'household:update',
      'invoice:create',
      'invoice:read',
    ],
  },
  starter: {
    tier: 'starter',
    maxProjects: 2,
    maxPropertiesPerProject: 10,
    aiRequestsPerMonth: 30,
    actions: [
      'project:create',
      'project:read',
      'project:update',
      'project:delete',
      'property:create',
      'property:read',
      'property:update',
      'property:delete',
      'property:advance-pipeline',
      'ai:analyze-property',
      'ai:generate-scenarios',
      'ai:estimate-renovation',
      'ai:assess-regulatory',
      'ai:ocr-invoice',
      'household:read',
      'household:update',
      'invoice:create',
      'invoice:read',
      'invoice:update',
      'invoice:delete',
      'export:csv',
    ],
  },
  pro: {
    tier: 'pro',
    maxProjects: 5,
    maxPropertiesPerProject: 50,
    aiRequestsPerMonth: 150,
    actions: [
      'project:create',
      'project:read',
      'project:update',
      'project:delete',
      'property:create',
      'property:read',
      'property:update',
      'property:delete',
      'property:advance-pipeline',
      'ai:analyze-property',
      'ai:generate-scenarios',
      'ai:estimate-renovation',
      'ai:assess-regulatory',
      'ai:assess-layout',
      'ai:assess-energy',
      'ai:compare-properties',
      'ai:refine-estimate',
      'ai:estimate-arv',
      'ai:ocr-invoice',
      'household:read',
      'household:update',
      'invoice:create',
      'invoice:read',
      'invoice:update',
      'invoice:delete',
      'export:commercialista',
      'export:csv',
    ],
  },
  team: {
    tier: 'team',
    maxProjects: -1,
    maxPropertiesPerProject: -1,
    aiRequestsPerMonth: 500,
    actions: [
      'project:create',
      'project:read',
      'project:update',
      'project:delete',
      'property:create',
      'property:read',
      'property:update',
      'property:delete',
      'property:advance-pipeline',
      'ai:analyze-property',
      'ai:generate-scenarios',
      'ai:estimate-renovation',
      'ai:assess-regulatory',
      'ai:assess-layout',
      'ai:assess-energy',
      'ai:compare-properties',
      'ai:refine-estimate',
      'ai:estimate-arv',
      'ai:ocr-invoice',
      'household:read',
      'household:update',
      'invoice:create',
      'invoice:read',
      'invoice:update',
      'invoice:delete',
      'export:commercialista',
      'export:csv',
    ],
  },
};

/**
 * Aditus PermissionMatrix shape.
 * Pass this as `matrix` to checkAccess() and createMeteringMiddleware().
 */
export const matrix = {
  tiers: TIER_PERMISSIONS,
  defaultTier: 'free' as Tier,
  aiActions: [
    'ai:analyze-property',
    'ai:generate-scenarios',
    'ai:estimate-renovation',
    'ai:assess-regulatory',
    'ai:assess-layout',
    'ai:assess-energy',
    'ai:compare-properties',
    'ai:refine-estimate',
    'ai:estimate-arv',
    'ai:ocr-invoice',
  ] satisfies Action[],
};
