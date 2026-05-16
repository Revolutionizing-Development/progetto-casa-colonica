export type PhotoCategory =
  | 'aerial'
  | 'exterior_front'
  | 'exterior_rear'
  | 'courtyard'
  | 'interior_living'
  | 'interior_kitchen'
  | 'interior_bedroom'
  | 'interior_bathroom'
  | 'land'
  | 'outbuilding'
  | 'roof'
  | 'detail';

export const PHOTO_CATEGORY_LABELS: Record<PhotoCategory, string> = {
  aerial: 'Aerial',
  exterior_front: 'Exterior (front)',
  exterior_rear: 'Exterior (rear)',
  courtyard: 'Courtyard',
  interior_living: 'Living room',
  interior_kitchen: 'Kitchen',
  interior_bedroom: 'Bedroom',
  interior_bathroom: 'Bathroom',
  land: 'Land',
  outbuilding: 'Outbuilding',
  roof: 'Roof',
  detail: 'Detail',
};

export const ALL_PHOTO_CATEGORIES: PhotoCategory[] = [
  'aerial', 'exterior_front', 'exterior_rear', 'courtyard',
  'interior_living', 'interior_kitchen', 'interior_bedroom', 'interior_bathroom',
  'land', 'outbuilding', 'roof', 'detail',
];
