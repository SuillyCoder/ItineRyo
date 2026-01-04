// ============================================
// FILE: components/TripCard.tsx
// Individual trip card with Japanese design
// ============================================
import { MapPin, Calendar, Users, Edit, Trash2, ArrowRight } from 'lucide-react';
import { Trip } from '@/lib/supabase';

interface TripCardProps {
  trip: Trip;
  onEdit: (trip: Trip) => void;
  onDelete: (trip: Trip) => void;
  onOpen: (trip: Trip) => void;
}

export function TripCard({ trip, onEdit, onDelete, onOpen }: TripCardProps) {
  // Calculate trip duration
  const calculateDuration = () => {
    const start = new Date(trip.start_date);
    const end = new Date(trip.end_date);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return days;
  };

  // Format dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div 
      className="rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
      style={{ 
        backgroundColor: '#C8B8A5',
        border: '1px solid rgba(125, 116, 99, 0.2)'
      }}
    >
      {/* Header with gradient */}
      <div 
        className="p-4 sm:p-6 relative overflow-hidden"
        style={{ 
          background: 'linear-gradient(135deg, #D64820 0%, #BF2809 100%)'
        }}
      >
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ backgroundColor: '#D6D0C0', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-10" style={{ backgroundColor: '#D6D0C0', transform: 'translate(-30%, 30%)' }} />
        
        <div className="relative z-10">
          <h3 
            className="text-xl sm:text-2xl mb-2 line-clamp-2"
            style={{ 
              fontFamily: "'Noto Serif JP', serif",
              color: '#D6D0C0',
              letterSpacing: '0.02em'
            }}
          >
            {trip.trip_name}
          </h3>
          <div className="flex items-center gap-2">
            <MapPin size={16} style={{ color: '#D6D0C0' }} />
            <span 
              className="text-sm sm:text-base"
              style={{ 
                fontFamily: "'Noto Sans JP', sans-serif",
                color: '#D6D0C0',
                opacity: 0.9
              }}
            >
              {trip.prefectures?.name || 'Japan'}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-6 space-y-4">
        {/* Date Info */}
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <Calendar size={20} style={{ color: '#D64820' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div 
              className="flex items-center gap-2 mb-1 flex-wrap text-sm sm:text-base"
              style={{ 
                fontFamily: "'Noto Sans JP', sans-serif",
                color: '#2c2416'
              }}
            >
              <span className="truncate">{formatDate(trip.start_date)}</span>
              <ArrowRight size={16} style={{ color: '#7D7463' }} className="shrink-0" />
              <span className="truncate">{formatDate(trip.end_date)}</span>
            </div>
            <p 
              className="text-sm"
              style={{ 
                fontFamily: "'Noto Sans JP', sans-serif",
                color: '#7D7463'
              }}
            >
              {calculateDuration()} days
            </p>
          </div>
        </div>

        {/* Travelers Info */}
        <div className="flex items-center gap-3">
          <Users size={20} style={{ color: '#D64820' }} />
          <span 
            className="text-sm sm:text-base"
            style={{ 
              fontFamily: "'Noto Sans JP', sans-serif",
              color: '#2c2416'
            }}
          >
            {trip.num_travelers} {trip.num_travelers === 1 ? 'traveler' : 'travelers'}
          </span>
        </div>

        {/* Decorative Line */}
        <div className="flex items-center gap-3 py-2">
          <div className="h-px flex-1" style={{ backgroundColor: '#D64820', opacity: 0.3 }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#BF2809' }} />
          <div className="h-px flex-1" style={{ backgroundColor: '#D64820', opacity: 0.3 }} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => onEdit(trip)}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-md"
            style={{ 
              backgroundColor: '#D6D0C0',
              color: '#2c2416',
              fontFamily: "'Noto Sans JP', sans-serif",
              fontSize: '0.875rem'
            }}
          >
            <Edit size={16} />
            <span className="hidden sm:inline">Edit</span>
          </button>
          
          <button
            onClick={() => onDelete(trip)}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-md"
            style={{ 
              backgroundColor: '#D6D0C0',
              color: '#2c2416',
              fontFamily: "'Noto Sans JP', sans-serif",
              fontSize: '0.875rem'
            }}
          >
            <Trash2 size={16} />
            <span className="hidden sm:inline">Delete</span>
          </button>

          <button
            onClick={() => onOpen(trip)}
            className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-lg"
            style={{ 
              backgroundColor: '#BF2809',
              color: '#D6D0C0',
              fontFamily: "'Noto Sans JP', sans-serif",
              fontSize: '0.875rem'
            }}
          >
            <span>Open</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}