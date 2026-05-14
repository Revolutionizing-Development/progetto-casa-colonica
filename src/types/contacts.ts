export type ContactRole =
  | 'geometra'
  | 'notaio'
  | 'commercialista'
  | 'architect'
  | 'contractor'
  | 'agent'
  | 'lawyer'
  | 'interpreter'
  | 'key_holder'
  | 'seller'
  | 'other';

export interface Contact {
  id: string;
  user_id: string;
  role: ContactRole;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  commune?: string;
  province?: string;
  language: 'it' | 'en' | 'both';
  notes?: string;
  rating?: 1 | 2 | 3 | 4 | 5;
  recommended_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PropertyContact {
  id: string;
  property_id: string;
  contact_id: string;
  role_override?: string;
  engagement_status: 'potential' | 'engaged' | 'contracted' | 'completed' | 'rejected';
  quote_amount?: number;
  notes?: string;
  created_at: string;
}
