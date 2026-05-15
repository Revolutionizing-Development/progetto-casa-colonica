import { z } from 'zod';

export const CostRangeSchema = z.object({
  low: z.number().int().nonnegative(),
  high: z.number().int().nonnegative(),
});

export const PropertyInputSchema = z.object({
  commune: z.string().min(1),
  province: z.string().min(1),
  region: z.string().min(1),
  askingPrice: z.number().int().positive(),
  buildingAreaSqm: z.number().positive(),
  landAreaSqm: z.number().nonnegative(),
  numberOfFloors: z.number().int().positive(),
  constructionType: z.enum(['stone', 'brick', 'mixed', 'concrete']),
  energyClass: z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G']),
  energyConsumption: z.number().positive().optional(),
  conditionCategory: z.enum([
    'ruin',
    'major_renovation',
    'moderate_renovation',
    'cosmetic',
    'habitable',
  ]),
  description: z.string().min(1),
  photos: z.array(
    z.object({
      type: z.enum([
        'facade',
        'aerial',
        'roof',
        'interior',
        'structural',
        'land',
        'floorplan',
      ]),
      url: z.string().min(1),
    }),
  ),
  searchCriteria: z.object({
    intendedUse: z.enum([
      'primary_residence',
      'vacation_home',
      'airbnb',
      'investment',
    ]),
    numberOfAirbnbUnits: z.number().int().nonnegative(),
    ownerResidenceSqm: z.number().positive().optional(),
    farmFeatures: z.array(
      z.enum([
        'chickens',
        'goats',
        'pizza_oven',
        'wine_courtyard',
        'solar',
        'garden',
        'orchard',
      ]),
    ),
  }),
});

export type PropertyInputSchema = z.infer<typeof PropertyInputSchema>;
