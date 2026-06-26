import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Tenant {
  id: string;
  name: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface TenantSettings {
  tenant_id: string;
  target_city: string | null;
  updated_at: string;
}

export interface TenantUser {
  id: string;
  tenant_id: string;
  user_id: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface Category {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Guide {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  estimated_time: number | null;
  difficulty: 'easy' | 'medium' | 'hard';
  is_active: boolean;
  views_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
  steps?: Step[];
}

export interface Step {
  id: string;
  guide_id: string;
  step_number: number;
  title: string;
  description: string | null;
  tip: string | null;
  duration_seconds: number | null;
  created_at: string;
  updated_at: string;
  media?: StepMedia[];
}

export interface StepMedia {
  id: string;
  step_id: string;
  type: 'image' | 'video';
  url: string;
  alt_text: string | null;
  sort_order: number;
  created_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  guide_id: string;
  step_id: string;
  completed_at: string;
}

export interface Event {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  event_date: string;
  estimated_impact: string | null;
  source_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Schedule {
  id: string;
  tenant_id: string;
  title: string;
  start_time: string;
  end_time: string;
  event_id: string | null;
  created_at: string;
  updated_at: string;
  event?: Event;
}

export interface ScheduleAssignment {
  id: string;
  schedule_id: string;
  user_id: string;
  status: 'pending' | 'confirmed' | 'declined';
  created_at: string;
  updated_at: string;
  schedule?: Schedule;
}
