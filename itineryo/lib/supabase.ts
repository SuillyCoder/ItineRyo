import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types (will be auto-generated later)
export interface Trip {
  id: string;
  user_id: string;
  trip_name: string;
  start_date: string;
  end_date: string;
  primary_prefecture_id: string | null;
  num_travelers: number;
  created_at: string;
  updated_at: string;
  prefectures?: {
    name: string;
    name_jp: string;
  };
}

export interface Activity {
  id: string;
  trip_id: string;
  day_number: number;
  activity_name: string;
  scheduled_time: string | null;
  estimated_duration: number | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  category: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  notes: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}