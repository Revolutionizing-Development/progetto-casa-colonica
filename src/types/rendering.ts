export type RenderingType =
  | 'exterior_front'
  | 'exterior_rear'
  | 'courtyard'
  | 'interior_living'
  | 'interior_kitchen'
  | 'interior_airbnb'
  | 'aerial';

export type RenderingView = 'before' | 'after' | 'progress';

export interface Rendering {
  id: string;
  property_id: string;
  scenario_id: string;
  user_id: string;
  type: RenderingType;
  view: RenderingView;
  prompt_used: string;
  image_url: string;
  thumbnail_url?: string;
  model: 'gpt-image-2';
  width: number;
  height: number;
  source_photo_url?: string;
  is_inpainted: boolean;
  created_at: string;
}

export interface RenderingRequest {
  property_id: string;
  scenario_id: string;
  type: RenderingType;
  source_photo_url?: string;
  additional_instructions?: string;
}
