// ============================================
// FILE: app/trip/[id]/page.tsx
// COMPLETE VERSION: All bugs fixed
// ============================================
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { supabase, Trip, Activity } from '@/lib/supabase';
import { 
  ArrowLeft, Plus, MapPin, Calendar, Clock, DollarSign, 
  Edit, Trash2, GripVertical, X, Search, Wallet, MapIcon, Route, Hotel, ArrowRightFromLine, Star, MapPinned
} from 'lucide-react';
import PlaceSearch from '@/components/PlaceSearch';
import BudgetManager from '@/components/BudgetManager';
import HotelOrigin from '@/components/HotelOrigin';
import RouteOptimizer from '@/components/RouteOptimizer';
import ExportItinerary from '@/components/ExportItinerary';

import Link from 'next/link';

// Activity Categories
const ACTIVITY_CATEGORIES = [
  { value: 'dining', label: 'Dining', icon: '🍽️', color: 'bg-orange-100 text-orange-700' },
  { value: 'shopping', label: 'Shopping', icon: '🛍️', color: 'bg-pink-100 text-pink-700' },
  { value: 'attractions', label: 'Attractions', icon: '🎭', color: 'bg-purple-100 text-purple-700' },
  { value: 'transportation', label: 'Transportation', icon: '🚇', color: 'bg-blue-100 text-blue-700' },
  { value: 'accommodation', label: 'Accommodation', icon: '🏨', color: 'bg-green-100 text-green-700' },
  { value: 'parks', label: 'Parks & Nature', icon: '🌳', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'entertainment', label: 'Entertainment', icon: '🎪', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'other', label: 'Other', icon: '📌', color: 'bg-gray-100 text-gray-700' },
];


interface DayData {
  dayNumber: number;
  date: Date;
  activities: Activity[];
}

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [trip, setTrip] = useState<Trip | null>(null);
  const [days, setDays] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [draggedActivity, setDraggedActivity] = useState<Activity | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showPlaceSearch, setShowPlaceSearch] = useState(false);
  const [showBudgetManager, setShowBudgetManager] = useState(false);
  const [showRouteOptimizer, setShowRouteOptimizer] = useState(false);
  const [showHotelOrigin, setShowHotelOrigin] = useState(false);
  const [showExportTrip, setShowExportTrip] = useState(false);
  const [showMapView, setShowMapView] = useState(false);
  const [showViewWishlist, setShowViewWishlist] = useState(false);

  //Hotel Origin Setters
const [hotelOrigin, setHotelOrigin] = useState<{
  place_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
} | null>(null);

  useEffect(() => {
    if (!authLoading && user && params.id) {
      loadTripData();
    } else if (!authLoading && !user) {
      router.push('/');
    }
  }, [authLoading, user, params.id]);

  const loadTripData = async () => {
    if (!params.id || typeof params.id !== 'string') {
      setError('Invalid trip ID');
      setLoading(false);
      return;
    }

    try {
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select(`*, prefectures (name, name_jp)`)
        .eq('id', params.id)
        .single();

      if (tripError) throw tripError;
      if (!tripData) throw new Error('Trip not found');
      setTrip(tripData);
          if (tripData.hotel_origin) {
          setHotelOrigin(tripData.hotel_origin);
      }

      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .eq('trip_id', params.id)
        .order('day_number')
        .order('order_index');

      if (activitiesError) throw activitiesError;

      const startDate = new Date(tripData.start_date);
      const endDate = new Date(tripData.end_date);
      const dayCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const daysArray: DayData[] = Array.from({ length: dayCount }, (_, i) => {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        return {
          dayNumber: i + 1,
          date,
          activities: (activitiesData || []).filter(a => a.day_number === i + 1),
        };
      });

      setDays(daysArray);
    } catch (err) {
      console.error('Error loading trip:', err);
      setError('Failed to load trip data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateActivity = async (activityData: Partial<Activity>) => {
    if (!user || !trip) return;

    const maxOrder = days.find(d => d.dayNumber === selectedDay)?.activities.length || 0;

    try {
      const { data, error } = await supabase
        .from('activities')
        .insert([
          {
            trip_id: trip.id,
            day_number: selectedDay,
            activity_name: activityData.activity_name,
            place_id: activityData.place_id || null,
            scheduled_time: activityData.scheduled_time || null,
            estimated_duration: activityData.estimated_duration || null,
            estimated_cost: activityData.estimated_cost || null,
            category: activityData.category,
            latitude: activityData.latitude || null,
            longitude: activityData.longitude || null,
            address: activityData.address || null,
            notes: activityData.notes || null,
            order_index: maxOrder,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      
      await loadTripData();
      setShowActivityModal(false);
    } catch (err: any) {
      console.error('Error creating activity:', err);
      alert(`Failed to create activity: ${err.message}`);
    }
  };

  const handleUpdateActivity = async (activityData: Partial<Activity>) => {
    if (!editingActivity) return;

    try {
      // Create update object with only non-null values
      const updateData: any = {
        activity_name: activityData.activity_name,
        category: activityData.category,
      };

      // Only include these fields if they have values
      if (activityData.scheduled_time !== undefined) {
        updateData.scheduled_time = activityData.scheduled_time || null;
      }
      if (activityData.estimated_duration !== undefined) {
        updateData.estimated_duration = activityData.estimated_duration || null;
      }
      if (activityData.estimated_cost !== undefined) {
        updateData.estimated_cost = activityData.estimated_cost || null;
      }
      if (activityData.latitude !== undefined) {
        updateData.latitude = activityData.latitude || null;
      }
      if (activityData.longitude !== undefined) {
        updateData.longitude = activityData.longitude || null;
      }
      if (activityData.address !== undefined) {
        updateData.address = activityData.address || null;
      }
      if (activityData.place_id !== undefined) {
        updateData.place_id = activityData.place_id || null;
      }
      if (activityData.notes !== undefined) {
        updateData.notes = activityData.notes || null;
      }

      const { error } = await supabase
        .from('activities')
        .update(updateData)
        .eq('id', editingActivity.id);

      if (error) throw error;
      
      await loadTripData();
      setEditingActivity(null);
      setShowActivityModal(false);
    } catch (err: any) {
      console.error('Error updating activity:', err);
      alert(`Failed to update activity: ${err.message}`);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm('Are you sure you want to delete this activity?')) return;

    const { error } = await supabase.from('activities').delete().eq('id', activityId);

    if (error) {
      console.error('Error deleting activity:', error);
      alert('Failed to delete activity');
    } else {
      await loadTripData();
    }
  };

  const handleDragStart = (e: React.DragEvent, activity: Activity) => {
    setDraggedActivity(activity);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, targetDayNumber: number, targetIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    
    if (!draggedActivity) return;

    const sourceDayNumber = draggedActivity.day_number;
    const sourceIndex = draggedActivity.order_index;

    // Don't do anything if dropped in same position
    if (sourceDayNumber === targetDayNumber && sourceIndex === targetIndex) {
      setDraggedActivity(null);
      return;
    }

    try {
      const targetDay = days.find(d => d.dayNumber === targetDayNumber);
      if (!targetDay) return;

      // Build new order for target day
      let newOrder = [...targetDay.activities];
      
      // Remove from source if in same day
      if (sourceDayNumber === targetDayNumber) {
        newOrder = newOrder.filter(a => a.id !== draggedActivity.id);
      }
      
      // Insert at target position
      newOrder.splice(targetIndex, 0, draggedActivity);

      // Update all activities in target day with new order
      const updates = newOrder.map((activity, idx) => 
        supabase
          .from('activities')
          .update({ 
            order_index: idx,
            day_number: targetDayNumber 
          })
          .eq('id', activity.id)
      );

      await Promise.all(updates);

      // If moved to different day, reorder source day
      if (sourceDayNumber !== targetDayNumber) {
        const sourceDay = days.find(d => d.dayNumber === sourceDayNumber);
        if (sourceDay) {
          const remainingActivities = sourceDay.activities
            .filter(a => a.id !== draggedActivity.id);
          
          const sourceUpdates = remainingActivities.map((activity, idx) =>
            supabase
              .from('activities')
              .update({ order_index: idx })
              .eq('id', activity.id)
          );
          
          await Promise.all(sourceUpdates);
        }
      }

      await loadTripData();
    } catch (error) {
      console.error('Error reordering:', error);
      alert('Failed to reorder activities');
    }

    setDraggedActivity(null);
  };

const handleSelectPlace = (place: any) => {
  // Extract coordinates properly
  const lat = place.geometry?.location?.lat();
  const lng = place.geometry?.location?.lng();
  
  // Auto-fill activity form with place data
  const activityData: Partial<Activity> = {
    activity_name: place.name || '',
    address: place.formatted_address || '',
    latitude: lat || null,
    longitude: lng || null,
    place_id: place.place_id || null,
    category: 'attractions', // Default category
  };
  
  // Open activity modal with pre-filled data
  setEditingActivity(activityData as any);
  setShowActivityModal(true);
};

const handleOptimizeRoute = async (optimizedActivities: Map<number, Activity[]>) => {
  try {
    // Update each day's activities with optimized order
    for (const [dayNumber, activities] of optimizedActivities.entries()) {
      // Update order_index for each activity
      const updates = activities.map((activity, idx) =>
        supabase
          .from('activities')
          .update({ order_index: idx })
          .eq('id', activity.id)
      );

      await Promise.all(updates);
    }

    // Reload trip data to reflect changes
    await loadTripData();
    alert('Route optimized successfully!');
  } catch (error) {
    console.error('Error saving optimized route:', error);
    alert('Failed to save optimized route');
  }
};

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading trip details...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (error || !trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{error || 'Trip not found'}</h2>
          <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mt-4">
            <ArrowLeft size={20} />
            Back to Trips
          </Link>
        </div>
      </div>
    );
  }

  const currentDay = days.find(d => d.dayNumber === selectedDay);

 const handleSelectHotel = async (hotel: {
  place_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}) => {
  setHotelOrigin(hotel);
  
  // Save to database
  if (trip) {
    const { error } = await supabase
      .from('trips')
      .update({ hotel_origin: hotel })
      .eq('id', trip.id);
    
    if (error) {
      console.error('Error saving hotel:', error);
      alert('Failed to save hotel');
    }
  }
};

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/" className="text-gray-600 hover:text-gray-900 p-2">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{trip.trip_name}</h1>
                {hotelOrigin && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                      <Hotel className="w-4 h-4" />
                      <span>Staying at: {hotelOrigin.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>


{/* Action Buttons Bar */}
<div className="bg-white border-b border-gray-200 shadow-sm">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
    <div className="flex gap-3">
      <button
          onClick={() => setShowHotelOrigin(true)}
          className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-sky-300 to-sky-600 text-white rounded-lg hover:from-sky-400 hover:to-sky-700 transition-all shadow-md"
        >

        <Hotel className="w-5 h-5" />
        <span className="font-medium">Add Hotel Origin</span>
        </button>

      <button
        onClick={() => setShowPlaceSearch(true)}
        className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-md"
      >
        <MapPinned className="w-5 h-5" />
        <span className="font-medium">Search Places</span>
        </button>
      
        <button
          onClick={() => setShowBudgetManager(true)}
          className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-md"
        >

        <Wallet className="w-5 h-5" />
        <span className="font-medium">Budget Management</span>
        </button>

        <button
          onClick={() => setShowRouteOptimizer(true)}
          className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-amber-300 to-orange-500 text-white rounded-lg hover:from-amber-400 hover:to-orange-600 transition-all shadow-md"
        >

        <Route className="w-5 h-5" />
        <span className="font-medium">Route Optimizer</span>
        </button>

        <button
          onClick={() => setShowMapView(true)}
          className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-emerald-300 to-teal-500 text-white rounded-lg hover:from-emerald-400 hover:to-teal-600 transition-all shadow-md"
        >

        <MapIcon className="w-5 h-5" />
        <span className="font-medium">Map View</span>
        </button>


        <button
          onClick={() => setShowExportTrip(true)}
          className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-red-400 to-red-700 text-white rounded-lg hover:from-red-500 hover:to-red-800 transition-all shadow-md"
        >

        <ArrowRightFromLine className="w-5 h-5" />
        <span className="font-medium">Export Itinerary</span>
        </button>

        <button
          onClick={() => setShowViewWishlist(true)}
          className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-fuchsia-400 to-fuchsia-600 text-white rounded-lg hover:from-fuchsia-500 hover:to-fuchsia-700 transition-all shadow-md"
        >

        <Star className="w-5 h-5" />
        <span className="font-medium">View Wishlist</span>
        </button>


    </div>
  </div>
</div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          <div className="w-64 shrink-0">
            <div className="bg-white rounded-xl shadow-md p-4 sticky top-24">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Trip Days
              </h3>
              <div className="space-y-2">
                {days.map((day) => (
                  <button
                    key={day.dayNumber}
                    onClick={() => setSelectedDay(day.dayNumber)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      selectedDay === day.dayNumber
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium">Day {day.dayNumber}</div>
                    <div className={`text-sm ${selectedDay === day.dayNumber ? 'text-blue-100' : 'text-gray-500'}`}>
                      {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className={`text-xs mt-1 ${selectedDay === day.dayNumber ? 'text-blue-200' : 'text-gray-400'}`}>
                      {day.activities.length} activities
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-md">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Day {selectedDay} Activities</h2>
                    <p className="text-gray-600 mt-1">
                      {currentDay?.date.toLocaleDateString('en-US', { 
                        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingActivity(null);
                      setShowActivityModal(true);
                    }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Add Activity
                  </button>
                </div>
              </div>

              <div className="p-6">
                {currentDay && currentDay.activities.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">📋</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No activities yet</h3>
                    <p className="text-gray-600 mb-6">Start planning your day by adding activities</p>
                    <button
                      onClick={() => setShowActivityModal(true)}
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      Add First Activity
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentDay?.activities.map((activity, index) => (
                      <div
                        key={activity.id}
                        className={`transition-all ${dragOverIndex === index ? 'mb-8' : ''}`}
                      >
                        <ActivityCard
                          activity={activity}
                          onEdit={() => {
                            setEditingActivity(activity);
                            setShowActivityModal(true);
                          }}
                          onDelete={() => handleDeleteActivity(activity.id)}
                          onDragStart={(e) => handleDragStart(e, activity)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, selectedDay, index)}
                          isDragging={draggedActivity?.id === activity.id}
                          isDragOver={dragOverIndex === index}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {showActivityModal && (
        <ActivityModal
          activity={editingActivity}
          dayNumber={selectedDay}
          onClose={() => {
            setShowActivityModal(false);
            setEditingActivity(null);
          }}
          onSave={editingActivity ? handleUpdateActivity : handleCreateActivity}
        />
      )}

      {showPlaceSearch && (
        <PlaceSearch
          prefectureName={trip.prefectures?.name || 'Tokyo'}
          onClose={() => setShowPlaceSearch(false)}
          onSelectPlace={handleSelectPlace}
        />
      )}

    {showBudgetManager && trip && (
        <BudgetManager
        tripId={trip.id}
        activities={days.flatMap(d => d.activities)}
        tripDuration={days.length}
        onClose={() => setShowBudgetManager(false)}
      />
    )}

    {showHotelOrigin && (
      <HotelOrigin
        prefectureName={trip.prefectures?.name || 'Tokyo'}
        currentHotel={hotelOrigin}
        onClose={() => setShowHotelOrigin(false)}
        onSelectHotel={handleSelectHotel}
      />
    )}
    
{showExportTrip && (
  <ExportItinerary
    trip={trip}
    days={days}
    onClose={() => setShowExportTrip(false)}
  />
)}

    {showMapView && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 w-96 relative">
          <button
            onClick={() => setShowMapView(false)}
            className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold mb-4">Geospatial Map View</h2>
          <p className="text-gray-600">Feature under development.</p>
        </div>
      </div>
    )}


   {showViewWishlist && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 w-96 relative">
          <button
            onClick={() => setShowViewWishlist(false)}
            className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold mb-4">Viewing Place Wishlist</h2>
          <p className="text-gray-600">Feature under development.</p>
        </div>
      </div>
    )}


  {showRouteOptimizer && (
      <RouteOptimizer
        days={days}
        selectedDay={selectedDay}
        hotelOrigin={hotelOrigin}
        onClose={() => setShowRouteOptimizer(false)}
        onOptimize={handleOptimizeRoute}
      />
    )}
    

    </div>
  );
}

function ActivityCard({ 
  activity, 
  onEdit, 
  onDelete, 
  onDragStart, 
  onDragOver,
  onDragLeave,
  onDrop,
  isDragging,
  isDragOver
}: {
  activity: Activity;
  onEdit: () => void;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  isDragging: boolean;
  isDragOver: boolean;
}) {
  const category = ACTIVITY_CATEGORIES.find(c => c.value === activity.category) || ACTIVITY_CATEGORIES[7];

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`bg-white border-2 rounded-lg p-4 transition-all cursor-move ${
        isDragging ? 'opacity-50 border-blue-400' : 
        isDragOver ? 'border-blue-500 bg-blue-50 shadow-lg' :
        'border-gray-200 hover:shadow-md hover:border-blue-300'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 pt-1">
          <GripVertical className="w-5 h-5" />
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-bold text-gray-900 text-lg">{activity.activity_name}</h4>
              {activity.address && (
                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4" />
                  {activity.address}
                </p>
              )}
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${category.color}`}>
              {category.icon} {category.label}
            </span>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            {activity.scheduled_time && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {activity.scheduled_time}
              </div>
            )}
            {activity.estimated_duration && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {activity.estimated_duration} mins
              </div>
            )}
            {activity.estimated_cost && (
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                ¥{activity.estimated_cost.toLocaleString()}
              </div>
            )}
          </div>

          {activity.notes && (
            <p className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded">{activity.notes}</p>
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={onEdit} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ActivityModal({ activity, dayNumber, onClose, onSave }: {
  activity: Activity | null;
  dayNumber: number;
  onClose: () => void;
  onSave: (data: Partial<Activity>) => void;
}) {
  const [formData, setFormData] = useState<Partial<Activity>>({
    activity_name: activity?.activity_name || '',
    category: activity?.category || 'other',
    address: activity?.address || '',
    scheduled_time: activity?.scheduled_time || '',
    estimated_duration: activity?.estimated_duration || null,
    estimated_cost: activity?.estimated_cost || null,
    notes: activity?.notes || '',
    latitude: activity?.latitude || null,
    longitude: activity?.longitude || null,
    place_id: activity?.place_id || null,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    // Check if Google Maps is loaded
    if (!inputRef.current || typeof window === 'undefined' || typeof google === 'undefined') {
      console.log('Google Maps not loaded yet');
      return;
    }

    try {
      // Initialize autocomplete
      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        fields: ['place_id', 'formatted_address', 'geometry', 'name'],
        componentRestrictions: { country: 'jp' }, // Restrict to Japan
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (place.geometry && place.geometry.location) {
          setFormData({
            ...formData,
            place_id: place.place_id || null,
            address: place.formatted_address || '',
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
            activity_name: formData.activity_name || place.name || '',
          });
          setSearchQuery('');
        }
      });

      autocompleteRef.current = autocomplete;
    } catch (error) {
      console.error('Error initializing autocomplete:', error);
    }

    return () => {
      if (autocompleteRef.current && typeof google !== 'undefined') {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  const handleSubmit = () => {
    if (!formData.activity_name || !formData.category) {
      alert('Please fill in activity name and category');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="bg-linear-to-r from-blue-500 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {activity ? 'Edit Activity' : 'Add Activity'} - Day {dayNumber}
            </h2>
            <button onClick={onClose} className="text-white hover:text-gray-200">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Activity Name *</label>
            <input
              type="text"
              required
              value={formData.activity_name}
              onChange={(e) => setFormData({ ...formData, activity_name: e.target.value })}
              placeholder="e.g., Visit Senso-ji Temple"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
            <div className="grid grid-cols-2 gap-2">
              {ACTIVITY_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.value })}
                  className={`px-4 py-3 rounded-lg border-2 text-left transition-colors ${
                    formData.category === cat.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-lg mr-2">{cat.icon}</span>
                  <span className="text-sm font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Location on Google Maps
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                placeholder="Search for a place in Japan..."
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
            {typeof google === 'undefined' && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                ⚠️ Google Maps is loading... If this persists, check your API key.
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Start typing to search places in Japan.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address (Manual Entry)
            </label>
            <input
              type="text"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Or enter address manually"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scheduled Time
              </label>
              <input
                type="time"
                value={formData.scheduled_time || ''}
                onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                min="0"
                value={formData.estimated_duration || ''}
                onChange={(e) => setFormData({ ...formData, estimated_duration: parseInt(e.target.value) || null })}
                placeholder="60"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Cost (¥)
            </label>
            <input
              type="number"
              min="0"
              step="100"
              value={formData.estimated_cost || ''}
              onChange={(e) => setFormData({ ...formData, estimated_cost: parseFloat(e.target.value) || null })}
              placeholder="1000"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes or reminders..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 hover:text-gray-900 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            {activity ? 'Save Changes' : 'Add Activity'}
          </button>
        </div>
      </div>
    </div>
  );
}