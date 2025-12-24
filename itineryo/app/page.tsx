'use client';  // ⬅️ ADD THIS LINE!

import React, { useState } from 'react';
import { Plus, MapPin, Calendar, Users, Edit, Trash2, ChevronRight } from 'lucide-react';

// Types
interface Prefecture {
  id: string;
  name: string;
  nameJp: string;
  region: string;
}

interface Trip {
  id: string;
  tripName: string;
  startDate: string;
  endDate: string;
  primaryPrefectureId: string | null;
  prefectureName: string | null;
  numTravelers: number;
  createdAt: string;
}

// Mock Prefecture Data
const PREFECTURES: Prefecture[] = [
  { id: '1', name: 'Tokyo', nameJp: '東京都', region: 'Kanto' },
  { id: '2', name: 'Kyoto', nameJp: '京都府', region: 'Kansai' },
  { id: '3', name: 'Osaka', nameJp: '大阪府', region: 'Kansai' },
  { id: '4', name: 'Hokkaido', nameJp: '北海道', region: 'Hokkaido' },
  { id: '5', name: 'Okinawa', nameJp: '沖縄県', region: 'Kyushu' },
  { id: '6', name: 'Fukuoka', nameJp: '福岡県', region: 'Kyushu' },
];

export default function ItineraryApp() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  const handleCreateTrip = (newTrip: Omit<Trip, 'id' | 'createdAt'>) => {
    const trip: Trip = {
      ...newTrip,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setTrips([...trips, trip]);
    setShowCreateModal(false);
  };

  const handleUpdateTrip = (updatedTrip: Trip) => {
    setTrips(trips.map(t => t.id === updatedTrip.id ? updatedTrip : t));
    setEditingTrip(null);
  };

  const handleDeleteTrip = (tripId: string) => {
    if (confirm('Are you sure you want to delete this trip?')) {
      setTrips(trips.filter(t => t.id !== tripId));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Itineryo</h1>
                <p className="text-sm text-gray-500">Your Japan Travel Planner</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Create New Trip</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {trips.length === 0 ? (
          <EmptyState onCreateTrip={() => setShowCreateModal(true)} />
        ) : (
          <TripList
            trips={trips}
            onEdit={setEditingTrip}
            onDelete={handleDeleteTrip}
          />
        )}
      </main>

      {showCreateModal && (
        <TripModal
          mode="create"
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateTrip}
          prefectures={PREFECTURES}
        />
      )}

      {editingTrip && (
        <TripModal
          mode="edit"
          trip={editingTrip}
          onClose={() => setEditingTrip(null)}
          onSave={handleUpdateTrip}
          prefectures={PREFECTURES}
        />
      )}
    </div>
  );
}

function EmptyState({ onCreateTrip }: { onCreateTrip: () => void }) {
  return (
    <div className="text-center py-20">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
        <MapPin className="w-10 h-10 text-blue-600" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-3">
        Start Planning Your Journey
      </h2>
      <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
        Create your first trip to Japan and begin organizing your perfect itinerary
      </p>
      <button
        onClick={onCreateTrip}
        className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium shadow-lg"
      >
        <Plus className="w-6 h-6" />
        <span>Create Your First Trip</span>
      </button>
    </div>
  );
}

function TripList({
  trips,
  onEdit,
  onDelete,
}: {
  trips: Trip[];
  onEdit: (trip: Trip) => void;
  onDelete: (id: string) => void;
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
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4">
              <h3 className="text-xl font-bold text-white mb-1">{trip.tripName}</h3>
              {trip.prefectureName && (
                <p className="text-blue-100 text-sm flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {trip.prefectureName}
                </p>
              )}
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-center text-gray-700">
                <Calendar className="w-5 h-5 mr-3 text-gray-400" />
                <div className="text-sm">
                  <p className="font-medium">
                    {new Date(trip.startDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    →{' '}
                    {new Date(trip.endDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-gray-500">
                    {calculateDuration(trip.startDate, trip.endDate)} days
                  </p>
                </div>
              </div>

              <div className="flex items-center text-gray-700">
                <Users className="w-5 h-5 mr-3 text-gray-400" />
                <span className="text-sm">
                  {trip.numTravelers} {trip.numTravelers === 1 ? 'traveler' : 'travelers'}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-200 p-3 bg-gray-50 flex justify-between">
              <button
                onClick={() => onEdit(trip)}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => onDelete(trip.id)}
                className="flex items-center space-x-1 text-red-600 hover:text-red-700 text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
              <button className="flex items-center space-x-1 text-gray-600 hover:text-gray-700 text-sm font-medium">
                <span>Open</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
    tripName: trip?.tripName || '',
    startDate: trip?.startDate || '',
    endDate: trip?.endDate || '',
    primaryPrefectureId: trip?.primaryPrefectureId || '',
    numTravelers: trip?.numTravelers || 1,
  });

  const [step, setStep] = useState<'details' | 'prefecture'>(mode === 'edit' ? 'details' : 'details');

  const handleContinue = () => {
    if (!formData.tripName || !formData.startDate || !formData.endDate) {
      alert('Please fill in all required fields');
      return;
    }
    if (mode === 'create' && step === 'details') {
      setStep('prefecture');
    } else {
      handleSave();
    }
  };

  const handleSave = () => {
    const selectedPrefecture = prefectures.find(p => p.id === formData.primaryPrefectureId);
    
    const tripData = {
      ...formData,
      primaryPrefectureId: formData.primaryPrefectureId || null,
      prefectureName: selectedPrefecture?.name || null,
    };

    if (mode === 'edit' && trip) {
      onSave({ ...trip, ...tripData });
    } else {
      onSave(tripData);
    }
  };

  const handleSkipPrefecture = () => {
    const tripData = {
      ...formData,
      primaryPrefectureId: null,
      prefectureName: null,
    };
    onSave(tripData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
          <h2 className="text-2xl font-bold">
            {mode === 'create' ? 'Create New Trip' : 'Edit Trip'}
          </h2>
          <p className="text-blue-100 mt-1">
            {step === 'details' ? 'Step 1: Trip Details' : 'Step 2: Choose Prefecture'}
          </p>
        </div>

        <div className="p-6">
          {step === 'details' ? (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trip Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.tripName}
                  onChange={(e) => setFormData({ ...formData, tripName: e.target.value })}
                  placeholder="e.g., Tokyo Spring Adventure 2025"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Travelers
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.numTravelers}
                  onChange={(e) => setFormData({ ...formData, numTravelers: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {mode === 'edit' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Prefecture
                  </label>
                  <select
                    value={formData.primaryPrefectureId}
                    onChange={(e) => setFormData({ ...formData, primaryPrefectureId: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Not selected</option>
                    {prefectures.map((pref) => (
                      <option key={pref.id} value={pref.id}>
                        {pref.name} ({pref.nameJp})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600 mb-4">
                Select the main prefecture for your trip. You can skip this and set it later.
              </p>
              <div className="grid grid-cols-1 gap-3">
                {prefectures.map((pref) => (
                  <label
                    key={pref.id}
                    className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.primaryPrefectureId === pref.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="prefecture"
                        value={pref.id}
                        checked={formData.primaryPrefectureId === pref.id}
                        onChange={(e) => setFormData({ ...formData, primaryPrefectureId: e.target.value })}
                        className="w-5 h-5 text-blue-600"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{pref.name}</p>
                        <p className="text-sm text-gray-500">{pref.nameJp} • {pref.region}</p>
                      </div>
                    </div>
                    <MapPin className="w-5 h-5 text-gray-400" />
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between mt-6 pt-6 border-t border-gray-200">
            {step === 'prefecture' && mode === 'create' ? (
              <>
                <button
                  onClick={() => setStep('details')}
                  className="px-6 py-2 text-gray-700 hover:text-gray-900 font-medium"
                >
                  Back
                </button>
                <div className="space-x-3">
                  <button
                    onClick={handleSkipPrefecture}
                    className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
                  >
                    Skip for now
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Create Trip
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-6 py-2 text-gray-700 hover:text-gray-900 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleContinue}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  {mode === 'edit' ? 'Save Changes' : 'Continue'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}