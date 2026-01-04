import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// For convenience, export a singleton instance for client components
export const supabase = createClient();

// Types
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
  place_id?: string | null;  // ADD THIS LINE
  scheduled_time: string | null;
  scheduled_end: string | null;
  estimated_duration: number | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  category: string | ' ';
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  notes: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  place_id: string;
  place_name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  price_level: number | null;
  photo_url: string | null;
  types: string[] | null;
  created_at: string;
}
