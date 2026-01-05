// ============================================
// FILE: app/trip/[id]/page.tsx
// Trip Details Page - Japanese Design Integration
// ============================================
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { supabase, Trip, Activity } from '@/lib/supabase';
import { 
  ArrowLeft, Plus, MapPin, Calendar, Clock, DollarSign, 
  Edit, Trash2, GripVertical, X, Search, Hotel, ArrowRightFromLine, 
  Star, MapPinned, MapIcon, Route
} from 'lucide-react';
import PlaceSearch from '@/components/PlaceSearch';
import BudgetManager from '@/components/BudgetManager';
import HotelOrigin from '@/components/HotelOrigin';
import RouteOptimizer from '@/components/RouteOptimizer';
import ExportItinerary from '@/components/ExportItinerary';
import MapOverview from '@/components/MapOverview';
import ViewWishlist from '@/components/ViewWishlist';
import { LoadingPanel } from '@/components/LoadingPanel';
import Link from 'next/link';

// Activity Categories with Japanese color scheme
const ACTIVITY_CATEGORIES = [
  { value: 'dining', label: 'Dining', icon: '🍽️', color: 'bg-[#D64820] bg-opacity-20 text-[#D5D0C0] border-[#D64820]' },
  { value: 'shopping', label: 'Shopping', icon: '🛍️', color: 'bg-[#C8B8A5] text-[#7D7463] border-[#7D7463]' },
  { value: 'attractions', label: 'Attractions', icon: '🎭', color: 'bg-[#D64820] bg-opacity-20 text-[#D5D0C0] border-[#D64820]' },
  { value: 'transportation', label: 'Transportation', icon: '🚇', color: 'bg-[#C8B8A5] text-[#7D7463] border-[#7D7463]' },
  { value: 'accommodation', label: 'Accommodation', icon: '🏨', color: 'bg-[#D64820] bg-opacity-20 text-[#D5D0C0] border-[#D64820]' },
  { value: 'parks', label: 'Parks & Nature', icon: '🌳', color: 'bg-[#C8B8A5] text-[#7D7463] border-[#7D7463]' },
  { value: 'entertainment', label: 'Entertainment', icon: '🎪', color: 'bg-[#D64820] bg-opacity-20 text-[#D5D0C0] border-[#D64820]' },
  { value: 'other', label: 'Other', icon: '📌', color: 'bg-[#C8B8A5] text-[#7D7463] border-[#7D7463]' },
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
  const [prefilledActivityData, setPrefilledActivityData] = useState<Partial<Activity> | null>(null);
  const [advancedCostMode, setAdvancedCostMode] = useState(false);

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
        .insert([{
          trip_id: trip.id,
          day_number: selectedDay,
          activity_name: activityData.activity_name,
          place_id: activityData.place_id || null,
          scheduled_time: activityData.scheduled_time || null,
          scheduled_end: activityData.scheduled_end || null,
          estimated_cost: activityData.estimated_cost || null,
          cost_per_head: activityData.cost_per_head || null,
          extended_cost: activityData.extended_cost || null,
          prepaid_peso: activityData.prepaid_peso || null,
          category: activityData.category,
          latitude: activityData.latitude || null,
          longitude: activityData.longitude || null,
          address: activityData.address || null,
          notes: activityData.notes || null,
          order_index: maxOrder,
        }])
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
      const updateData: any = {
        activity_name: activityData.activity_name,
        category: activityData.category,
      };

      if (activityData.scheduled_time !== undefined) updateData.scheduled_time = activityData.scheduled_time || null;
      if (activityData.scheduled_end !== undefined) updateData.scheduled_end = activityData.scheduled_end || null;
      if (activityData.estimated_cost !== undefined) updateData.estimated_cost = activityData.estimated_cost || null;
      if (activityData.cost_per_head !== undefined) updateData.cost_per_head = activityData.cost_per_head || null;
      if (activityData.extended_cost !== undefined) updateData.extended_cost = activityData.extended_cost || null;
      if (activityData.prepaid_peso !== undefined) updateData.prepaid_peso = activityData.prepaid_peso || null;
      if (activityData.latitude !== undefined) updateData.latitude = activityData.latitude || null;
      if (activityData.longitude !== undefined) updateData.longitude = activityData.longitude || null;
      if (activityData.address !== undefined) updateData.address = activityData.address || null;
      if (activityData.place_id !== undefined) updateData.place_id = activityData.place_id || null;
      if (activityData.notes !== undefined) updateData.notes = activityData.notes || null;

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

    if (sourceDayNumber === targetDayNumber && sourceIndex === targetIndex) {
      setDraggedActivity(null);
      return;
    }

    try {
      const targetDay = days.find(d => d.dayNumber === targetDayNumber);
      if (!targetDay) return;

      let newOrder = [...targetDay.activities];
      if (sourceDayNumber === targetDayNumber) {
        newOrder = newOrder.filter(a => a.id !== draggedActivity.id);
      }
      newOrder.splice(targetIndex, 0, draggedActivity);

      const updates = newOrder.map((activity, idx) => 
        supabase
          .from('activities')
          .update({ order_index: idx, day_number: targetDayNumber })
          .eq('id', activity.id)
      );

      await Promise.all(updates);

      if (sourceDayNumber !== targetDayNumber) {
        const sourceDay = days.find(d => d.dayNumber === sourceDayNumber);
        if (sourceDay) {
          const remainingActivities = sourceDay.activities.filter(a => a.id !== draggedActivity.id);
          const sourceUpdates = remainingActivities.map((activity, idx) =>
            supabase.from('activities').update({ order_index: idx }).eq('id', activity.id)
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
    const lat = place.geometry?.location?.lat();
    const lng = place.geometry?.location?.lng();
    const activityData: Partial<Activity> = {
      activity_name: place.name || '',
      address: place.formatted_address || '',
      latitude: lat || null,
      longitude: lng || null,
      place_id: place.place_id || null,
      category: 'attractions',
    };
    setEditingActivity(null);
    setPrefilledActivityData(activityData);
    setShowActivityModal(true);
  };

  const handleOptimizeRoute = async (optimizedActivities: Map<number, Activity[]>) => {
    try {
      for (const [dayNumber, activities] of optimizedActivities.entries()) {
        const updates = activities.map((activity, idx) =>
          supabase.from('activities').update({ order_index: idx }).eq('id', activity.id)
        );
        await Promise.all(updates);
      }
      await loadTripData();
      alert('Route optimized successfully!');
    } catch (error) {
      console.error('Error saving optimized route:', error);
      alert('Failed to save optimized route');
    }
  };

  const handleSelectHotel = async (hotel: {
    place_id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  }) => {
    setHotelOrigin(hotel);
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

  if (authLoading || loading) {
    return <LoadingPanel />;
  }

  if (!user) return null;

  if (error || !trip) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#D6D0C0' }}>
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#2c2416' }}>{error || 'Trip not found'}</h2>
          <Link href="/" className="inline-flex items-center gap-2 hover:opacity-80" style={{ color: '#BF2809' }}>
            <ArrowLeft size={20} />
            Back to Trips
          </Link>
        </div>
      </div>
    );
  }

  const currentDay = days.find(d => d.dayNumber === selectedDay);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#D5D0C0' }}>
      {/* Header with Japanese Wave Background */}
      <header className="relative overflow-hidden" style={{ backgroundColor: '#C8B8A5', borderBottom: '2px solid #7D7463' }}>
        <div className="absolute inset-0 opacity-10">
          <div style={{
            backgroundImage: `url('/assets/Kanagawa.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            height: '100%',
            width: '100%',
          }} />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 rounded-full transition-all hover:shadow-md" style={{ backgroundColor: '#D6D0C0' }}>
              <ArrowLeft className="w-5 h-5" style={{ color: '#2c2416' }} />
            </Link>
            
            <div className="w-12 h-12 rounded-full flex items-center justify-center relative" style={{ backgroundColor: '#BF2809' }}>
              <div className="absolute inset-2 rounded-full border-2 border-[#D6D0C0] opacity-50" />
              <span className="text-2xl relative z-10" style={{ color: '#D6D0C0' }}>旅</span>
            </div>
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Noto Serif JP', serif", color: '#2c2416', letterSpacing: '0.02em' }}>
                {trip.trip_name}
              </h1>
              {hotelOrigin && (
                <div className="flex items-center gap-2 text-sm" style={{ fontFamily: "'Noto Sans JP', sans-serif", color: '#7D7463' }}>
                  <Hotel className="w-4 h-4" />
                  <span>Staying at: {hotelOrigin.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Action Buttons with Japanese Color Scheme */}
      <div style={{ backgroundColor: '#D6D0C0', borderBottom: '1px solid rgba(125, 116, 99, 0.3)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex gap-2 overflow-x-auto">
            <ActionButton icon={<Hotel className="w-4 h-4" />} label="Hotel" onClick={() => setShowHotelOrigin(true)} />
            <ActionButton icon={<MapPinned className="w-4 h-4" />} label="Search" onClick={() => setShowPlaceSearch(true)} />
            <ActionButton icon={<DollarSign className="w-4 h-4" />} label="Budget" onClick={() => setShowBudgetManager(true)} />
            <ActionButton icon={<Route className="w-4 h-4" />} label="Optimize" onClick={() => setShowRouteOptimizer(true)} />
            <ActionButton icon={<MapIcon className="w-4 h-4" />} label="Map" onClick={() => setShowMapView(true)} />
            <ActionButton icon={<ArrowRightFromLine className="w-4 h-4" />} label="Export" onClick={() => setShowExportTrip(true)} />
            <ActionButton icon={<Star className="w-4 h-4" />} label="Wishlist" onClick={() => setShowViewWishlist(true)} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Desktop Sidebar - Trip Days */}
            <div className="hidden lg:block w-64 shrink-0">
              <div className="rounded-xl p-4 sticky top-6 shadow-lg" style={{ backgroundColor: '#C8B8A5', border: '1px solid rgba(125, 116, 99, 0.3)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5" style={{ color: '#BF2809' }} />
                    <h3 className="font-bold" style={{ fontFamily: "'Noto Serif JP', serif", color: '#2c2416' }}>Trip Days</h3>
                  </div>
                  <div className="space-y-2">
                    {days.map((day) => (
                      <button
                        key={day.dayNumber}
                        onClick={() => setSelectedDay(day.dayNumber)}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                          selectedDay === day.dayNumber ? 'shadow-md' : ''
                        }`}
                        style={{
                          backgroundColor: selectedDay === day.dayNumber ? '#BF2809' : '#D6D0C0',
                          color: selectedDay === day.dayNumber ? '#D6D0C0' : '#2c2416',
                          fontFamily: "'Noto Sans JP', sans-serif"
                          }}
                      >
                        <div className="font-medium">Day {day.dayNumber}</div>
                        <div className="text-sm opacity-80">
                          {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-xs mt-1 opacity-70">
                          {day.activities.length} activities
                        </div>
                      </button>
                    ))}
                  </div>
                  </div>
              </div>
              {/* Mobile Day Selector - Dropdown */}
              <div className="lg:hidden mb-4">
                <div className="rounded-xl p-4 shadow-lg" style={{ backgroundColor: '#C8B8A5', border: '1px solid rgba(125, 116, 99, 0.3)' }}>
                  <label className="block text-sm font-medium mb-2" style={{ fontFamily: "'Noto Sans JP', sans-serif", color: '#2c2416' }}>
                    Select Day
                  </label>
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                    className="w-full px-4 py-3 rounded-lg border-2 transition-all"
                    style={{
                      backgroundColor: '#D6D0C0',
                      borderColor: 'rgba(125, 116, 99, 0.3)',
                      color: '#2c2416',
                      fontFamily: "'Noto Sans JP', sans-serif"
                    }}
                  >
                    {days.map((day) => (
                      <option key={day.dayNumber} value={day.dayNumber}>
                        Day {day.dayNumber} - {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ({day.activities.length} activities)
                      </option>
                    ))}
                  </select>
                 </div>
              </div>

          {/* Main Activity Area */}
          <div className="flex-1">
            <div className="rounded-xl shadow-lg overflow-hidden" style={{ backgroundColor: '#C8B8A5', border: '1px solid rgba(125, 116, 99, 0.3)' }}>
              <div className="p-6" style={{ backgroundColor: '#D5D0C0', borderBottom: '2px solid #7D7463' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Noto Serif JP', serif", color: '#2c2416' }}>
                      Day {selectedDay} Activities
                    </h2>
                    <p className="text-sm" style={{ fontFamily: "'Noto Sans JP', sans-serif", color: '#7D7463' }}>
                      {currentDay?.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingActivity(null);
                      setShowActivityModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:shadow-lg"
                    style={{ backgroundColor: '#BF2809', color: '#D6D0C0', fontFamily: "'Noto Sans JP', sans-serif" }}
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add Activity</span>
                  </button>
                </div>
              </div>

              <div className="p-6">
                {currentDay && currentDay.activities.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-lg font-medium mb-2" style={{ fontFamily: "'Noto Serif JP', serif", color: '#2c2416' }}>
                      No activities yet
                    </h3>
                    <p className="mb-6" style={{ fontFamily: "'Noto Sans JP', sans-serif", color: '#7D7463' }}>
                      Start planning your day
                    </p>
                    <button
                      onClick={() => setShowActivityModal(true)}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-lg transition-all hover:shadow-lg"
                      style={{ backgroundColor: '#BF2809', color: '#D6D0C0', fontFamily: "'Noto Sans JP', sans-serif" }}
                    >
                      <Plus className="w-5 h-5" />
                      Add First Activity
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentDay?.activities.map((activity, index) => (
                      <ActivityCard
                        key={activity.id}
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
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {showActivityModal && (
        <ActivityModal
          activity={editingActivity || prefilledActivityData}
          dayNumber={selectedDay}
          onClose={() => {
            setShowActivityModal(false);
            setEditingActivity(null);
            setPrefilledActivityData(null);
          }}
          onSave={editingActivity ? handleUpdateActivity : handleCreateActivity}
        />
      )}

      {showPlaceSearch && <PlaceSearch prefectureName={trip.prefectures?.name || 'Tokyo'} onClose={() => setShowPlaceSearch(false)} onSelectPlace={handleSelectPlace} />}
      {showBudgetManager && trip && <BudgetManager tripId={trip.id} activities={days.flatMap(d => d.activities)} tripDuration={days.length} onClose={() => setShowBudgetManager(false)} />}
      {showHotelOrigin && <HotelOrigin prefectureName={trip.prefectures?.name || 'Tokyo'} currentHotel={hotelOrigin} onClose={() => setShowHotelOrigin(false)} onSelectHotel={handleSelectHotel} />}
      {showExportTrip && <ExportItinerary trip={trip} days={days} onClose={() => setShowExportTrip(false)} />}
      {showMapView && <MapOverview days={days} selectedDay={selectedDay} hotelOrigin={hotelOrigin} onClose={() => setShowMapView(false)} />}
      {showViewWishlist && (
        <ViewWishlist
          onClose={() => setShowViewWishlist(false)}
          onAddToItinerary={(wishlistItem) => {
            const activityData: Partial<Activity> = {
              activity_name: wishlistItem.place_name,
              address: wishlistItem.address || '',
              latitude: wishlistItem.latitude,
              longitude: wishlistItem.longitude,
              place_id: wishlistItem.place_id,
              category: 'attractions',
            };
            setEditingActivity(activityData as any);
            setShowActivityModal(true);
          }}
        />
      )}
      {showRouteOptimizer && <RouteOptimizer days={days} selectedDay={selectedDay} hotelOrigin={hotelOrigin} onClose={() => setShowRouteOptimizer(false)} onOptimize={handleOptimizeRoute} />}
    </div>
  );
}

// Action Button Component
function ActionButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:shadow-md whitespace-nowrap"
      style={{ backgroundColor: '#C8B8A5', color: '#2c2416', fontFamily: "'Noto Sans JP', sans-serif", fontSize: '0.875rem' }}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

// Activity Card Component
function ActivityCard({ activity, onEdit, onDelete, onDragStart, onDragOver, onDragLeave, onDrop, isDragging, isDragOver }: {
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
      className={`rounded-lg p-4 transition-all cursor-move border-2 ${isDragging ? 'opacity-50' : ''} ${isDragOver ? 'shadow-lg scale-105' : ''}`}
      style={{
        backgroundColor: '#D6D0C0',
        borderColor: isDragOver ? '#BF2809' : 'rgba(125, 116, 99, 0.3)',
      }}
    >
      <div className="flex items-start gap-3">
        <div className="cursor-grab active:cursor-grabbing pt-1" style={{ color: '#7D7463' }}>
          <GripVertical className="w-5 h-5" />
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="font-bold text-lg mb-1" style={{ fontFamily: "'Noto Serif JP', serif", color: '#2c2416' }}>
                {activity.activity_name}
              </h4>
              {activity.address && (
                <p className="text-sm flex items-center gap-1" style={{ fontFamily: "'Noto Sans JP', sans-serif", color: '#7D7463' }}>
                  <MapPin className="w-4 h-4" />
                  {activity.address}
                </p>
              )}
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${category.color}`} style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
              {category.icon} {category.label}
            </span>
          </div>

          <div className="flex flex-wrap gap-4 text-sm" style={{ fontFamily: "'Noto Sans JP', sans-serif", color: '#7D7463' }}>
            {activity.scheduled_time && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {activity.scheduled_time}
              </div>
            )}
            {activity.scheduled_end && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {activity.scheduled_end}
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
            <p className="text-sm mt-2 p-2 rounded" style={{ fontFamily: "'Noto Sans JP', sans-serif", color: '#7D7463', backgroundColor: '#C8B8A5' }}>
              {activity.notes}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={onEdit} className="p-2 rounded-lg transition-colors" style={{ color: '#BF2809', backgroundColor: 'rgba(191, 40, 9, 0.1)' }}>
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-2 rounded-lg transition-colors" style={{ color: '#BF2809', backgroundColor: 'rgba(191, 40, 9, 0.1)' }}>
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Activity Modal Component
// Activity Modal Component
function ActivityModal({ activity, dayNumber, onClose, onSave }: {
  activity: Partial<Activity> | null;
  dayNumber: number;
  onClose: () => void;
  onSave: (data: Partial<Activity>) => void;
}) {
  const [formData, setFormData] = useState<Partial<Activity>>({
    activity_name: activity?.activity_name || '',
    category: activity?.category || 'other',
    address: activity?.address || '',
    scheduled_time: activity?.scheduled_time || '',
    scheduled_end: activity?.scheduled_end || '',
    estimated_cost: activity?.estimated_cost || null,
    cost_per_head: activity?.cost_per_head || null,
    extended_cost: activity?.extended_cost || null,
    prepaid_peso: activity?.prepaid_peso || null,
    notes: activity?.notes || '',
    latitude: activity?.latitude || null,
    longitude: activity?.longitude || null,
    place_id: activity?.place_id || null,
  });

  const [advancedMode, setAdvancedMode] = useState(false);
  const [travellers, setTravellers] = useState<number>(1);

  useEffect(() => {
    if (activity) {
      setFormData({
        activity_name: activity.activity_name || '',
        category: activity.category || 'other',
        address: activity.address || '',
        scheduled_time: activity.scheduled_time || '',
        scheduled_end: activity.scheduled_end || '',
        estimated_cost: activity.estimated_cost || null,
        cost_per_head: activity.cost_per_head || null,
        extended_cost: activity.extended_cost || null,
        prepaid_peso: activity.prepaid_peso || null,
        notes: activity.notes || '',
        latitude: activity.latitude || null,
        longitude: activity.longitude || null,
        place_id: activity.place_id || null,
      });
      
      // Enable advanced mode if any advanced fields have values
      if (activity.cost_per_head || activity.extended_cost || activity.prepaid_peso) {
        setAdvancedMode(true);
      }
    }
  }, [activity]);

  // Calculate extended cost when cost_per_head or travellers change
  useEffect(() => {
    if (advancedMode && formData.cost_per_head && travellers > 0) {
      const extended = formData.cost_per_head * travellers;
      setFormData(prev => ({ ...prev, extended_cost: extended }));
    }
  }, [formData.cost_per_head, travellers, advancedMode]);

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!inputRef.current || typeof window === 'undefined' || typeof google === 'undefined') return;

    try {
      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        fields: ['place_id', 'formatted_address', 'geometry', 'name'],
        componentRestrictions: { country: 'jp' },
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
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(44, 36, 22, 0.7)' }} onClick={onClose}>
      <div className="rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#D6D0C0' }} onClick={(e) => e.stopPropagation()}>
        <div className="h-2 rounded-t-2xl" style={{ background: 'linear-gradient(90deg, #D64820 0%, #BF2809 100%)' }} />
        
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full transition-all hover:shadow-md"
          style={{ backgroundColor: '#C8B8A5' }}
        >
          <X size={20} style={{ color: '#2c2416' }} />
        </button>

        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl mb-2" style={{ fontFamily: "'Noto Serif JP', serif", color: '#2c2416' }}>
              {activity && 'id' in activity ? 'Edit Activity' : 'Add Activity'} - Day {dayNumber}
            </h2>
            <div className="flex items-center gap-4 mt-4">
              <div className="h-0.5 flex-1" style={{ backgroundColor: '#D64820' }} />
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#BF2809' }} />
              <div className="h-0.5 flex-1" style={{ backgroundColor: '#D64820' }} />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ fontFamily: "'Noto Sans JP', sans-serif", color: '#2c2416' }}>
                Activity Name <span style={{ color: '#D64820' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={formData.activity_name}
                onChange={(e) => setFormData({ ...formData, activity_name: e.target.value })}
                placeholder="e.g., Visit Senso-ji Temple"
                className="w-full px-4 py-3 rounded-lg border-2 transition-all focus:outline-none"
                style={{ backgroundColor: '#C8B8A5', borderColor: 'rgba(125, 116, 99, 0.3)', color: '#2c2416', fontFamily: "'Noto Sans JP', sans-serif" }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ fontFamily: "'Noto Sans JP', sans-serif", color: '#2c2416' }}>
                Category <span style={{ color: '#D64820' }}>*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ACTIVITY_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat.value })}
                    className={`px-4 py-3 rounded-lg border-2 text-left transition-colors ${formData.category === cat.value ? 'border-[#BF2809]' : ''}`}
                    style={{ 
                      backgroundColor: formData.category === cat.value ? 'rgba(191, 40, 9, 0.1)' : '#C8B8A5',
                      borderColor: formData.category === cat.value ? '#BF2809' : 'rgba(125, 116, 99, 0.3)',
                      fontFamily: "'Noto Sans JP', sans-serif"
                    }}
                  >
                    <span className="text-lg mr-2">{cat.icon}</span>
                    <span className="text-sm font-medium">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ fontFamily: "'Noto Sans JP', sans-serif", color: '#2c2416' }}>
                Search Location
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search for a place in Japan..."
                  className="w-full px-4 py-3 pr-12 rounded-lg border-2 transition-all focus:outline-none"
                  style={{ backgroundColor: '#C8B8A5', borderColor: 'rgba(125, 116, 99, 0.3)', color: '#2c2416', fontFamily: "'Noto Sans JP', sans-serif" }}
                />
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#7D7463' }} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ fontFamily: "'Noto Sans JP', sans-serif", color: '#2c2416' }}>
                Address
              </label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Or enter address manually"
                className="w-full px-4 py-3 rounded-lg border-2 transition-all focus:outline-none"
                style={{ backgroundColor: '#C8B8A5', borderColor: 'rgba(125, 116, 99, 0.3)', color: '#2c2416', fontFamily: "'Noto Sans JP', sans-serif" }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ fontFamily: "'Noto Sans JP', sans-serif", color: '#2c2416' }}>
                  Start Time
                </label>
                <input
                  type="time"
                  value={formData.scheduled_time || ''}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 transition-all focus:outline-none"
                  style={{ backgroundColor: '#C8B8A5', borderColor: 'rgba(125, 116, 99, 0.3)', color: '#2c2416', fontFamily: "'Noto Sans JP', sans-serif" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ fontFamily: "'Noto Sans JP', sans-serif", color: '#2c2416' }}>
                  End Time
                </label>
                <input
                  type="time"
                  value={formData.scheduled_end || ''}
                  onChange={(e) => setFormData({ ...formData, scheduled_end: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 transition-all focus:outline-none"
                  style={{ backgroundColor: '#C8B8A5', borderColor: 'rgba(125, 116, 99, 0.3)', color: '#2c2416', fontFamily: "'Noto Sans JP', sans-serif" }}
                />
              </div>
            </div>

            {/* Cost Section with Advanced Mode Toggle */}
            <div className="rounded-lg p-4 border-2" style={{ backgroundColor: '#C8B8A5', borderColor: 'rgba(125, 116, 99, 0.3)' }}>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium" style={{ fontFamily: "'Noto Sans JP', sans-serif", color: '#2c2416' }}>
                  Cost Management
                </label>
                <button
                  type="button"
                  onClick={() => setAdvancedMode(!advancedMode)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{ 
                    backgroundColor: advancedMode ? '#BF2809' : '#D6D0C0',
                    color: advancedMode ? '#D6D0C0' : '#2c2416',
                    fontFamily: "'Noto Sans JP', sans-serif"
                  }}
                >
                  {advancedMode ? '✓ Advanced Mode' : 'Simple Mode'}
                </button>
              </div>

              {!advancedMode ? (
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ fontFamily: "'Noto Sans JP', sans-serif", color: '#2c2416' }}>
                    Total Cost (¥)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={formData.estimated_cost || ''}
                    onChange={(e) => setFormData({ ...formData, estimated_cost: parseFloat(e.target.value) || null })}
                    className="w-full px-4 py-3 rounded-lg border-2 transition-all focus:outline-none"
                    style={{ backgroundColor: '#D6D0C0', borderColor: 'rgba(125, 116, 99, 0.3)', color: '#2c2416', fontFamily: "'Noto Sans JP', sans-serif" }}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-2" style={{ fontFamily: "'Noto Sans JP', sans-serif", color: '#2c2416' }}>
                        Cost Per Head (¥)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={formData.cost_per_head || ''}
                        onChange={(e) => setFormData({ ...formData, cost_per_head: parseFloat(e.target.value) || null })}
                        className="w-full px-4 py-2.5 rounded-lg border-2 transition-all focus:outline-none"
                        style={{ backgroundColor: '#D6D0C0', borderColor: 'rgba(125, 116, 99, 0.3)', color: '#2c2416', fontFamily: "'Noto Sans JP', sans-serif" }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-2" style={{ fontFamily: "'Noto Sans JP', sans-serif", color: '#2c2416' }}>
                        Number of Travellers
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={travellers}
                        onChange={(e) => setTravellers(parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-2.5 rounded-lg border-2 transition-all focus:outline-none"
                        style={{ backgroundColor: '#D6D0C0', borderColor: 'rgba(125, 116, 99, 0.3)', color: '#2c2416', fontFamily: "'Noto Sans JP', sans-serif" }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ fontFamily: "'Noto Sans JP', sans-serif", color: '#2c2416' }}>
                      Extended Cost (¥) <span className="text-xs opacity-70">(Auto-calculated)</span>
                    </label>
                    <input
                      type="number"
                      disabled
                      value={formData.extended_cost || ''}
                      className="w-full px-4 py-2.5 rounded-lg border-2 opacity-75 cursor-not-allowed"
                      style={{ backgroundColor: '#D6D0C0', borderColor: 'rgba(125, 116, 99, 0.3)', color: '#2c2416', fontFamily: "'Noto Sans JP', sans-serif" }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ fontFamily: "'Noto Sans JP', sans-serif", color: '#2c2416' }}>
                      Pre-Paid Peso (₱)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={formData.prepaid_peso || ''}
                      onChange={(e) => setFormData({ ...formData, prepaid_peso: parseFloat(e.target.value) || null })}
                      className="w-full px-4 py-2.5 rounded-lg border-2 transition-all focus:outline-none"
                      style={{ backgroundColor: '#D6D0C0', borderColor: 'rgba(125, 116, 99, 0.3)', color: '#2c2416', fontFamily: "'Noto Sans JP', sans-serif" }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ fontFamily: "'Noto Sans JP', sans-serif", color: '#2c2416' }}>
                Notes
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 rounded-lg border-2 transition-all focus:outline-none"
                style={{ backgroundColor: '#C8B8A5', borderColor: 'rgba(125, 116, 99, 0.3)', color: '#2c2416', fontFamily: "'Noto Sans JP', sans-serif" }}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-lg transition-all border-2"
              style={{ backgroundColor: 'transparent', borderColor: '#7D7463', color: '#2c2416', fontFamily: "'Noto Sans JP', sans-serif" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-3 rounded-lg transition-all hover:shadow-lg"
              style={{ backgroundColor: '#BF2809', color: '#D6D0C0', fontFamily: "'Noto Sans JP', sans-serif" }}
            >
              {activity && 'id' in activity ? 'Save Changes' : 'Add Activity'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}