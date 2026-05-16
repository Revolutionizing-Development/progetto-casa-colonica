import type { PropertyRow } from '@/app/actions/properties';
import type { PropertyInput } from '@/lib/ai/multi-agent';

interface PropertyPhoto {
  id: string;
  property_id: string;
  url: string;
  category: string;
}

const CATEGORY_TO_PHOTO_TYPE: Record<string, string> = {
  exterior: 'facade',
  interior: 'interior',
  aerial: 'aerial',
  roof: 'roof',
  structural: 'structural',
  land: 'land',
  floorplan: 'floorplan',
};

export function mapPropertyToInput(
  property: PropertyRow,
  photos: PropertyPhoto[] = [],
): PropertyInput {
  const farmFeatures: string[] = [];
  if (property.has_olive_grove) farmFeatures.push('orchard');
  if (property.has_vineyard) farmFeatures.push('garden');
  if (property.has_pizza_oven) farmFeatures.push('pizza_oven');
  if (property.has_pool) farmFeatures.push('garden');

  return {
    commune: property.commune || 'Unknown',
    province: property.province || 'Unknown',
    region: property.region || 'Unknown',
    askingPrice: property.listed_price,
    buildingAreaSqm: property.sqm_house,
    landAreaSqm: property.sqm_land,
    numberOfFloors: 2,
    constructionType: 'stone',
    energyClass: mapEnergyClass(property.energy_class),
    conditionCategory: 'moderate_renovation',
    description: property.listing_description || property.notes || `${property.name} — rural Italian property`,
    photos: photos.map((p) => ({
      type: CATEGORY_TO_PHOTO_TYPE[p.category] ?? 'facade',
      url: p.url,
    })),
    searchCriteria: {
      intendedUse: 'airbnb',
      numberOfAirbnbUnits: 2,
      farmFeatures,
    },
  };
}

function mapEnergyClass(ec: string | null): 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' {
  if (!ec) return 'G';
  const letter = ec.charAt(0).toUpperCase();
  if (['A', 'B', 'C', 'D', 'E', 'F', 'G'].includes(letter)) {
    return letter as 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
  }
  return 'G';
}
