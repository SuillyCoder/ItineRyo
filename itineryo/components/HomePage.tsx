// ============================================
// FILE: components/HomePage.tsx
// Main home page layout with Japanese design
// ============================================
'use client';

import { Plus, Settings, Heart, LogOut } from 'lucide-react';
import { Trip } from '@/lib/supabase';
import { TripCard } from './TripCard';

interface HomePageProps {
  user: any;
  trips: Trip[];
  onCreateTrip: () => void;
  onEditTrip: (trip: Trip) => void;
  onDeleteTrip: (trip: Trip) => void;
  onOpenTrip: (trip: Trip) => void;
  onSignOut: () => void;
  onOpenWishlist: () => void;
}

export function HomePage({
  user,
  trips,
  onCreateTrip,
  onEditTrip,
  onDeleteTrip,
  onOpenTrip,
  onSignOut,
  onOpenWishlist,
}: HomePageProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#D6D0C0' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-sm" style={{ backgroundColor: 'rgba(214, 208, 192, 0.9)', borderBottom: '1px solid rgba(125, 116, 99, 0.2)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center relative" style={{ backgroundColor: '#BF2809' }}>
                <div className="absolute inset-1.5 rounded-full border-2 border-[#D6D0C0] opacity-50" />
                <span className="text-2xl" style={{ color: '#D6D0C0' }}>旅</span>
              </div>
              <div>
                <h1 
                  className="text-2xl"
                  style={{ 
                    fontFamily: "'Noto Serif JP', serif",
                    color: '#2c2416',
                    letterSpacing: '0.05em'
                  }}
                >
                  Itine-Ryo
                </h1>
                <p 
                  className="text-sm"
                  style={{ 
                    fontFamily: "'Noto Sans JP', sans-serif",
                    color: '#7D7463'
                  }}
                >
                  {user?.user_metadata?.name || user?.email || 'Traveler'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              <button
                onClick={onOpenWishlist}
                className="p-2.5 rounded-lg transition-all duration-200 hover:shadow-md"
                style={{ backgroundColor: '#C8B8A5' }}
                title="Wishlist"
              >
                <Heart size={20} style={{ color: '#D64820' }} />
              </button>

              <button
                onClick={onCreateTrip}
                className="flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5"
                style={{ 
                  backgroundColor: '#BF2809',
                  color: '#D6D0C0',
                  fontFamily: "'Noto Sans JP', sans-serif"
                }}
              >
                <Plus size={20} />
                <span className="hidden sm:inline">Create New Trip</span>
                <span className="sm:hidden">New</span>
              </button>

              <button
                onClick={onSignOut}
                className="p-2.5 rounded-lg transition-all duration-200 hover:shadow-md"
                style={{ backgroundColor: '#C8B8A5' }}
                title="Sign Out"
              >
                <LogOut size={20} style={{ color: '#2c2416' }} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Wave Background */}
      <div className="relative overflow-hidden" style={{ backgroundColor: '#C8B8A5' }}>
        {/* Background Image */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url('/assets/Kanagawa.jpg')`,
              backgroundSize: 'cover',
              backgroundPosition: 'bottom',
              backgroundRepeat: 'no-repeat',
            }}
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(214, 208, 192, 0.8) 0%, rgba(200, 184, 165, 0.9) 100%)' }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-3xl">
            <h2 
              className="text-3xl sm:text-5xl mb-4"
              style={{ 
                fontFamily: "'Noto Serif JP', serif",
                color: '#2c2416',
                letterSpacing: '0.02em'
              }}
            >
              Your Journeys
            </h2>
            <p 
              className="text-lg sm:text-xl mb-6"
              style={{ 
                fontFamily: "'Noto Sans JP', sans-serif",
                color: '#7D7463'
              }}
            >
              Plan, organize, and experience the beauty of Japan
            </p>
            
            {/* Decorative Line */}
            <div className="flex items-center gap-4 max-w-md">
              <div className="h-0.5 flex-1" style={{ backgroundColor: '#D64820' }} />
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#BF2809' }} />
              <div className="h-0.5 w-20" style={{ backgroundColor: '#D64820' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Section Header */}
        <div className="mb-8">
          <h3 
            className="text-2xl sm:text-3xl mb-2"
            style={{ 
              fontFamily: "'Noto Serif JP', serif",
              color: '#2c2416',
              letterSpacing: '0.02em'
            }}
          >
            Your Trips
          </h3>
          <p 
            style={{ 
              fontFamily: "'Noto Sans JP', sans-serif",
              color: '#7D7463'
            }}
          >
            {trips.length} {trips.length === 1 ? 'trip' : 'trips'} planned
          </p>
        </div>

        {/* Trips Grid */}
        {trips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {trips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onEdit={onEditTrip}
                onDelete={onDeleteTrip}
                onOpen={onOpenTrip}
              />
            ))}
          </div>
        ) : (
          <div 
            className="text-center py-16 sm:py-20 rounded-2xl border-2 border-dashed"
            style={{ borderColor: 'rgba(125, 116, 99, 0.3)' }}
          >
            <div className="w-16 sm:w-20 h-16 sm:h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#C8B8A5' }}>
              <Plus size={32} style={{ color: '#D64820' }} />
            </div>
            <h4 
              className="text-xl sm:text-2xl mb-2"
              style={{ 
                fontFamily: "'Noto Serif JP', serif",
                color: '#2c2416'
              }}
            >
              No trips yet
            </h4>
            <p 
              className="mb-6 text-sm sm:text-base"
              style={{ 
                fontFamily: "'Noto Sans JP', sans-serif",
                color: '#7D7463'
              }}
            >
              Start planning your Japanese adventure
            </p>
            <button
              onClick={onCreateTrip}
              className="px-6 sm:px-8 py-3 rounded-lg transition-all duration-200 hover:shadow-lg"
              style={{ 
                backgroundColor: '#BF2809',
                color: '#D6D0C0',
                fontFamily: "'Noto Sans JP', sans-serif"
              }}
            >
              Create Your First Trip
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 sm:mt-20 py-8 border-t" style={{ borderColor: 'rgba(125, 116, 99, 0.2)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p 
            style={{ 
              fontFamily: "'Noto Serif JP', serif",
              color: '#7D7463',
              fontSize: '0.9rem',
              letterSpacing: '0.1em',
              opacity: 0.7
            }}
          >
            日本への旅を楽しんでください
          </p>
        </div>
      </footer>
    </div>
  );
}