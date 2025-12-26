'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { supabase, Trip } from '@/lib/supabase';
import { ArrowLeft, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  // ✅ ALL HOOKS AT TOP
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ USEEFFECT BEFORE RETURNS
  useEffect(() => {
    if (!authLoading && user && params.id) {
      loadTrip();
    } else if (!authLoading && !user) {
      router.push('/');
    }
  }, [authLoading, user, params.id]); // ✅ Proper dependencies

  // ✅ FUNCTIONS AFTER HOOKS
  const loadTrip = async () => {
    if (!params.id || typeof params.id !== 'string') {
      setError('Invalid trip ID');
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('trips')
        .select(`
          *,
          prefectures (name, name_jp)
        `)
        .eq('id', params.id)
        .single();

      if (fetchError) {
        console.error('Error loading trip:', fetchError);
        setError('Failed to load trip');
      } else if (!data) {
        setError('Trip not found');
      } else {
        setTrip(data);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // ✅ CONDITIONAL RENDERS AFTER HOOKS/FUNCTIONS
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading trip details...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{error}</h2>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mt-4"
          >
            <ArrowLeft size={20} />
            Back to Trips
          </Link>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Trip not found</h2>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mt-4"
          >
            <ArrowLeft size={20} />
            Back to Trips
          </Link>
        </div>
      </div>
    );
  }

  // ✅ MAIN RENDER
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 p-2"
              >
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{trip.trip_name}</h1>
                {trip.prefectures && (
                  <p className="text-sm text-gray-500">{trip.prefectures.name}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Trip Details</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Dates</p>
              <p className="text-lg font-medium text-gray-900">
                {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Travelers</p>
              <p className="text-lg font-medium text-gray-900">{trip.num_travelers}</p>
            </div>

            {/* Placeholder for future features */}
            <div className="mt-8 p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
              <p className="text-blue-800 text-center">
                🚧 Itinerary details coming soon! 🚧
              </p>
              <p className="text-blue-600 text-center text-sm mt-2">
                Activities, budget tracking, and maps will be added here.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}