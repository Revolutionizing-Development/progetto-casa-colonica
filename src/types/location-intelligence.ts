import type { ProjectType } from './project';

export type RegulatoryLight = 'green' | 'yellow' | 'red';

export interface RegulatoryItem {
  question: string;
  status: RegulatoryLight;
  detail: string;
  source_hint: string;
}

export interface DistanceCard {
  category: string;
  name: string;
  drive_minutes: number;
  distance_km: number;
  lng: number;
  lat: number;
}

export interface TransportHub {
  type: 'train_station' | 'airport';
  name: string;
  drive_minutes: number;
  distance_km: number;
  lng: number;
  lat: number;
  connections: string[];
}

export interface CommunityProfile {
  expat_presence: string;
  demographics: string;
  language_environment: string;
  local_events: string;
  outdoor_activities: string;
  cycling: string;
  internet_connectivity: string;
  overall_vibe: string;
}

export interface LocationIntelligence {
  generated_at: string;
  regulatory_checklist: RegulatoryItem[];
  distances: DistanceCard[];
  transport_hubs: TransportHub[];
  community: CommunityProfile;
  isochrone_minutes: number[];
}

export const DISTANCE_CATEGORIES = [
  'supermarket',
  'bakery',
  'pharmacy',
  'hospital',
  'veterinarian',
  'train_station',
  'airport',
] as const;

export type DistanceCategory = (typeof DISTANCE_CATEGORIES)[number];

export const DISTANCE_CATEGORY_LABELS: Record<DistanceCategory, string> = {
  supermarket: 'Supermarket',
  bakery: 'Bakery / Forno',
  pharmacy: 'Pharmacy',
  hospital: 'Hospital / Pronto Soccorso',
  veterinarian: 'Veterinarian',
  train_station: 'Train Station',
  airport: 'Airport',
};
