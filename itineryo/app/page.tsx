'use client';

import React, { useState, useEffect } from 'react';
import { Plus, MapPin, Calendar, Users, Edit, Trash2, ChevronRight, LogOut, Settings, Star } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { LoginPage } from '@/components/LoginPage';
import ViewWishlist from '@/components/ViewWishlist';
import { HomePage as HomeComponent } from '@/components/HomePage';
import { CreateTripForm } from '@/components/CreateTripForm';
import { LoadingPanel } from '@/components/LoadingPanel';
import { supabase, Trip } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Prefecture {
  id: string;
  name: string;
  name_jp: string;
  region: string;
}

export default function HomePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [prefectures, setPrefectures] = useState<Prefecture[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [showViewWishlist, setShowViewWishlist] = useState(false);
  const router = useRouter();

  // Load prefectures and trips when user is available
  useEffect(() => {
    if (user && !initialLoadComplete) {
      loadPrefectures();
      loadTrips();
    }
  }, [user, initialLoadComplete]);

  const loadPrefectures = async () => {
    const { data, error } = await supabase
      .from('prefectures')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error loading prefectures:', error);
    } else {
      setPrefectures(data || []);
    }
  };

  const loadTrips = async () => {
    if (!user?.id) return;
    
    setLoadingTrips(true);
    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        prefectures (name, name_jp)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading trips:', error);
    } else {
      setTrips(data || []);
    }
    setLoadingTrips(false);
    setInitialLoadComplete(true);
  };

  const handleCreateTrip = async (tripData: Omit<Trip, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      console.error('No user found');
      return;
    }
    
    const { data, error } = await supabase
      .from('trips')
      .insert([
        {
          ...tripData,
          user_id: user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating trip:', error);
      alert('Failed to create trip. Please try again.');
    } else {
      setTrips([data, ...trips]);
      setShowCreateModal(false);
    }
  };

  const handleUpdateTrip = async (updatedTrip: Trip) => {
    const { error } = await supabase
      .from('trips')
      .update({
        trip_name: updatedTrip.trip_name,
        start_date: updatedTrip.start_date,
        end_date: updatedTrip.end_date,
        primary_prefecture_id: updatedTrip.primary_prefecture_id,
        num_travelers: updatedTrip.num_travelers,
      })
      .eq('id', updatedTrip.id);

    if (error) {
      console.error('Error updating trip:', error);
      alert('Failed to update trip. Please try again.');
    } else {
      await loadTrips();
      setEditingTrip(null);
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm('Are you sure you want to delete this trip? This will also delete all activities and budget data.')) {
      return;
    }

    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', tripId);

    if (error) {
      console.error('Error deleting trip:', error);
      alert('Failed to delete trip. Please try again.');
    } else {
      setTrips(trips.filter((t) => t.id !== tripId));
    }
  };

  const handleOpenTrip = (tripId: string) => {
    router.push(`/trip/${tripId}`);
  };

  // Combined loading state: show spinner if EITHER auth is loading OR (we have user but haven't loaded trips yet)
  const isInitializing = authLoading || (user && !initialLoadComplete && loadingTrips);

  if (isInitializing) {
    return (
      <LoadingPanel />
    );
  }

  // Show login page if no user (and not loading)
  // Show login page if no user
  if (!user) {
    return <LoginPage />;
  }

  // Show main content
  return (
    <>
      <HomeComponent
        user={user}
        trips={trips}
        onCreateTrip={() => setShowCreateModal(true)}
        onEditTrip={(trip) => setEditingTrip(trip)}
        onDeleteTrip={(trip) => handleDeleteTrip(trip.id)}
        onOpenTrip={(trip) => handleOpenTrip(trip.id)}
        onSignOut={() => { void signOut(); }}
        onOpenWishlist={() => setShowViewWishlist(true)}
      />

      {/* Create Modal */}
      {showCreateModal && (
        <CreateTripForm
          mode="create"
          prefectures={prefectures}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateTrip}
        />
      )}

      {/* Edit Modal */}
      {editingTrip && (
        <CreateTripForm
          mode="edit"
          trip={editingTrip}
          prefectures={prefectures}
          onClose={() => setEditingTrip(null)}
          onSubmit={handleUpdateTrip}
        />
      )}

      {/* View Wishlist Modal */}
      {showViewWishlist && (
        <ViewWishlist onClose={() => setShowViewWishlist(false)} />
      )}
    </>
  );
}

// Empty State Component
function EmptyState({ onCreateTrip }: { onCreateTrip: () => void }) {
  return (
    <div className="text-center py-20">
      <div className="w-20 h-20 bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <MapPin className="w-10 h-10 text-white" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-3">
        Start Your Japanese Adventure
      </h2>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        Create your first trip to begin planning your perfect itinerary to Japan.
        Track activities, manage budgets, and explore amazing destinations.
      </p>
      <button
        onClick={onCreateTrip}
        className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
      >
        <Plus className="w-5 h-5" />
        <span className="font-medium">Create Your First Trip</span>
      </button>
    </div>
  );
}

// Trip List Component
function TripList({
  trips,
  onEdit,
  onDelete,
  onOpen,
}: {
  trips: Trip[];
  onEdit: (trip: Trip) => void;
  onDelete: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  const calculateDuration = (start: string, end: string) => {
    const days = Math.ceil(
      (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)
    );
    return days + 1;
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Trips</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trips.map((trip) => (
          <div
            key={trip.id}
            className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow border border-gray-200 overflow-hidden"
          >
            <div className="bg-linear-to-r from-blue-500 to-purple-600 p-4">
              <h3 className="text-xl font-bold text-white mb-1">{trip.trip_name}</h3>
              {trip.prefectures && (
                <p className="text-blue-100 text-sm flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {trip.prefectures.name}
                </p>
              )}
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-center text-gray-700">
                <Calendar className="w-5 h-5 mr-3 text-gray-400" />
                <div className="text-sm">
                  <p className="font-medium">
                    {new Date(trip.start_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    →{' '}
                    {new Date(trip.end_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-gray-500">
                    {calculateDuration(trip.start_date, trip.end_date)} days
                  </p>
                </div>
              </div>

              <div className="flex items-center text-gray-700">
                <Users className="w-5 h-5 mr-3 text-gray-400" />
                <span className="text-sm">
                  {trip.num_travelers} {trip.num_travelers === 1 ? 'traveler' : 'travelers'}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-200 p-3 bg-gray-50 flex justify-between">
              <button
                onClick={() => onEdit(trip)}
                className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 px-3 py-1 rounded transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span className="text-sm">Edit</span>
              </button>
              <button
                onClick={() => onDelete(trip.id)}
                className="flex items-center space-x-1 text-gray-600 hover:text-red-600 px-3 py-1 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm">Delete</span>
              </button>
              <button
                onClick={() => onOpen(trip.id)}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 px-3 py-1 rounded transition-colors font-medium"
              >
                <span className="text-sm">Open</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Trip Modal Component
function TripModal({
  mode,
  trip,
  onClose,
  onSave,
  prefectures,
}: {
  mode: 'create' | 'edit';
  trip?: Trip;
  onClose: () => void;
  onSave: (trip: any) => void;
  prefectures: Prefecture[];
}) {
  const [formData, setFormData] = useState({
    trip_name: trip?.trip_name || '',
    start_date: trip?.start_date || '',
    end_date: trip?.end_date || '',
    primary_prefecture_id: trip?.primary_prefecture_id || '',
    num_travelers: trip?.num_travelers || 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.trip_name || !formData.start_date || !formData.end_date) {
      alert('Please fill in all required fields');
      return;
    }

    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      alert('End date must be after start date');
      return;
    }

    if (mode === 'edit' && trip) {
      onSave({ ...trip, ...formData });
    } else {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'create' ? 'Create New Trip' : 'Edit Trip'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Trip Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trip Name *
            </label>
            <input
              type="text"
              value={formData.trip_name}
              onChange={(e) => setFormData({ ...formData, trip_name: e.target.value })}
              placeholder="e.g., Spring 2025 Tokyo Adventure"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Prefecture */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Prefecture
            </label>
            <select
              value={formData.primary_prefecture_id}
              onChange={(e) =>
                setFormData({ ...formData, primary_prefecture_id: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a prefecture (optional)</option>
              {prefectures.map((pref) => (
                <option key={pref.id} value={pref.id}>
                  {pref.name} ({pref.name_jp})
                </option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date *
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Number of Travelers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Travelers
            </label>
            <input
              type="number"
              min="1"
              value={formData.num_travelers}
              onChange={(e) =>
                setFormData({ ...formData, num_travelers: parseInt(e.target.value) })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {mode === 'create' ? 'Create Trip' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}