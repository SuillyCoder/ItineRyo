// ============================================
// FILE: components/CreateTripForm.tsx
// Trip creation/edit modal with Japanese design
// ============================================
import { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Users } from 'lucide-react';
import { Trip } from '@/lib/supabase';

interface Prefecture {
  id: string;
  name: string;
  name_jp: string;
}

interface CreateTripFormProps {
  mode: 'create' | 'edit';
  trip?: Trip | null;
  prefectures: Prefecture[];
  onClose: () => void;
  onSubmit: (tripData: any) => void;
}

export function CreateTripForm({ mode, trip, prefectures, onClose, onSubmit }: CreateTripFormProps) {
  const [formData, setFormData] = useState({
    trip_name: trip?.trip_name || '',
    start_date: trip?.start_date || '',
    end_date: trip?.end_date || '',
    primary_prefecture_id: trip?.primary_prefecture_id || '',
    num_travelers: trip?.num_travelers || 1,
  });

  useEffect(() => {
    if (trip) {
      setFormData({
        trip_name: trip.trip_name,
        start_date: trip.start_date,
        end_date: trip.end_date,
        primary_prefecture_id: trip.primary_prefecture_id || '',
        num_travelers: trip.num_travelers,
      });
    }
  }, [trip]);

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
      onSubmit({ ...trip, ...formData });
    } else {
      onSubmit(formData);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4" 
      style={{ backgroundColor: 'rgba(44, 36, 22, 0.7)' }}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl rounded-2xl shadow-2xl relative animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: '#D6D0C0' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Header */}
        <div 
          className="h-2 rounded-t-2xl"
          style={{ background: 'linear-gradient(90deg, #D64820 0%, #BF2809 100%)' }}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full transition-all duration-200 hover:shadow-md z-10"
          style={{ backgroundColor: '#C8B8A5' }}
        >
          <X size={20} style={{ color: '#2c2416' }} />
        </button>

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h2 
              className="text-2xl sm:text-3xl mb-2"
              style={{ 
                fontFamily: "'Noto Serif JP', serif",
                color: '#2c2416',
                letterSpacing: '0.02em'
              }}
            >
              {mode === 'create' ? 'Create New Trip' : 'Edit Trip'}
            </h2>
            <p 
              className="text-sm sm:text-base"
              style={{ 
                fontFamily: "'Noto Sans JP', sans-serif",
                color: '#7D7463'
              }}
            >
              {mode === 'create' ? 'Plan your next Japanese adventure' : 'Update your trip details'}
            </p>
          </div>

          {/* Decorative Line */}
          <div className="mb-6 sm:mb-8 flex items-center gap-4">
            <div className="h-0.5 flex-1" style={{ backgroundColor: '#D64820' }} />
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#BF2809' }} />
            <div className="h-0.5 flex-1" style={{ backgroundColor: '#D64820' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Trip Name */}
            <div>
              <label 
                htmlFor="tripName"
                className="block mb-2 text-sm sm:text-base"
                style={{ 
                  fontFamily: "'Noto Sans JP', sans-serif",
                  color: '#2c2416'
                }}
              >
                Trip Name <span style={{ color: '#D64820' }}>*</span>
              </label>
              <input
                id="tripName"
                type="text"
                required
                value={formData.trip_name}
                onChange={(e) => setFormData({ ...formData, trip_name: e.target.value })}
                placeholder="e.g., Spring 2025 Tokyo Adventure"
                className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[#BF2809]"
                style={{ 
                  backgroundColor: '#C8B8A5',
                  borderColor: 'rgba(125, 116, 99, 0.3)',
                  color: '#2c2416',
                  fontFamily: "'Noto Sans JP', sans-serif"
                }}
              />
            </div>

            {/* Primary Prefecture */}
            <div>
              <label 
                htmlFor="prefecture"
                className="block mb-2 text-sm sm:text-base"
                style={{ 
                  fontFamily: "'Noto Sans JP', sans-serif",
                  color: '#2c2416'
                }}
              >
                Primary Prefecture
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <MapPin size={20} style={{ color: '#D64820' }} />
                </div>
                <select
                  id="prefecture"
                  value={formData.primary_prefecture_id}
                  onChange={(e) => setFormData({ ...formData, primary_prefecture_id: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[#BF2809] appearance-none cursor-pointer"
                  style={{ 
                    backgroundColor: '#C8B8A5',
                    borderColor: 'rgba(125, 116, 99, 0.3)',
                    color: formData.primary_prefecture_id ? '#2c2416' : '#7D7463',
                    fontFamily: "'Noto Sans JP', sans-serif"
                  }}
                >
                  <option value="">Select a prefecture (optional)</option>
                  {prefectures.map((pref) => (
                    <option key={pref.id} value={pref.id}>
                      {pref.name} ({pref.name_jp})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Start Date */}
              <div>
                <label 
                  htmlFor="startDate"
                  className="block mb-2 text-sm sm:text-base"
                  style={{ 
                    fontFamily: "'Noto Sans JP', sans-serif",
                    color: '#2c2416'
                  }}
                >
                  Start Date <span style={{ color: '#D64820' }}>*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Calendar size={20} style={{ color: '#D64820' }} />
                  </div>
                  <input
                    id="startDate"
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[#BF2809]"
                    style={{ 
                      backgroundColor: '#C8B8A5',
                      borderColor: 'rgba(125, 116, 99, 0.3)',
                      color: '#2c2416',
                      fontFamily: "'Noto Sans JP', sans-serif"
                    }}
                  />
                </div>
              </div>

              {/* End Date */}
              <div>
                <label 
                  htmlFor="endDate"
                  className="block mb-2 text-sm sm:text-base"
                  style={{ 
                    fontFamily: "'Noto Sans JP', sans-serif",
                    color: '#2c2416'
                  }}
                >
                  End Date <span style={{ color: '#D64820' }}>*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Calendar size={20} style={{ color: '#D64820' }} />
                  </div>
                  <input
                    id="endDate"
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[#BF2809]"
                    style={{ 
                      backgroundColor: '#C8B8A5',
                      borderColor: 'rgba(125, 116, 99, 0.3)',
                      color: '#2c2416',
                      fontFamily: "'Noto Sans JP', sans-serif"
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Number of Travelers */}
            <div>
              <label 
                htmlFor="travelers"
                className="block mb-2 text-sm sm:text-base"
                style={{ 
                  fontFamily: "'Noto Sans JP', sans-serif",
                  color: '#2c2416'
                }}
              >
                Number of Travelers
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Users size={20} style={{ color: '#D64820' }} />
                </div>
                <input
                  id="travelers"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.num_travelers}
                  onChange={(e) => setFormData({ ...formData, num_travelers: parseInt(e.target.value) || 1 })}
                  className="w-full pl-12 pr-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[#BF2809]"
                  style={{ 
                    backgroundColor: '#C8B8A5',
                    borderColor: 'rgba(125, 116, 99, 0.3)',
                    color: '#2c2416',
                    fontFamily: "'Noto Sans JP', sans-serif"
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 sm:gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-lg transition-all duration-200 hover:shadow-md border-2"
                style={{ 
                  backgroundColor: 'transparent',
                  borderColor: '#7D7463',
                  color: '#2c2416',
                  fontFamily: "'Noto Sans JP', sans-serif"
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-lg transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5"
                style={{ 
                  backgroundColor: '#BF2809',
                  color: '#D6D0C0',
                  fontFamily: "'Noto Sans JP', sans-serif"
                }}
              >
                {mode === 'create' ? 'Create Trip' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Decorative Bottom Text */}
        <div className="px-6 sm:px-8 pb-6 text-center">
          <p 
            style={{ 
              fontFamily: "'Noto Serif JP', serif",
              color: '#7D7463',
              fontSize: '0.85rem',
              letterSpacing: '0.1em',
              opacity: 0.6
            }}
          >
            新しい旅を始めましょう
          </p>
        </div>
      </div>
    </div>
  );
}