// ============================================
// FILE: components/PlaceSearch.tsx
// FIXED: Image rendering, isOpen deprecated, type conversions
// ============================================
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, MapPin, Star, DollarSign, Clock, Phone, Globe, Image as ImageIcon, Loader2, Heart } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider'; // Add this import
import {supabase} from '@/lib/supabase';

// ✅ FIXED: Use Google Maps native types directly
type PlaceResult = google.maps.places.PlaceResult;
type PlacePhoto = google.maps.places.PlacePhoto;
type PlaceDetails = google.maps.places.PlaceResult;

interface PlaceSearchProps {
  prefectureName?: string;
  prefectureId?: string;
  onClose: () => void;
  onSelectPlace?: (place: PlaceResult) => void;
}

export default function PlaceSearch({ 
  prefectureName = 'Tokyo',
  prefectureId,
  onClose,
  onSelectPlace
}: PlaceSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [recommendations, setRecommendations] = useState<PlaceResult[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  const [activeTab, setActiveTab] = useState<'search' | 'recommendations'>('recommendations');
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);

  const PREFECTURE_COORDINATES: Record<string, { lat: number; lng: number }> = {
    'Tokyo': { lat: 35.6762, lng: 139.6503 },
    'Kyoto': { lat: 35.0116, lng: 135.7681 },
    'Osaka': { lat: 34.6937, lng: 135.5023 },
    'Hokkaido': { lat: 43.0642, lng: 141.3469 },
    'Okinawa': { lat: 26.2124, lng: 127.6809 },
    'Fukuoka': { lat: 33.5904, lng: 130.4017 },
    'Hiroshima': { lat: 34.3853, lng: 132.4553 },
    'Nagoya': { lat: 35.1815, lng: 136.9066 },
    'Yokohama': { lat: 35.4437, lng: 139.6380 },
    'Nara': { lat: 34.6851, lng: 135.8048 },
  };

  const { user } = useAuth();
  const [wishlistedPlaces, setWishlistedPlaces] = useState<Set<string>>(new Set());

  const loadRecommendations = (service: google.maps.places.PlacesService, location: { lat: number; lng: number }) => {
    setLoadingRecommendations(true);

    const request: google.maps.places.PlaceSearchRequest = {
      location,
      radius: 5000,
      type: 'tourist_attraction',
    };

    service.nearbySearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        // ✅ FIXED: Properly handle results type
        setRecommendations(results.slice(0, 12) as PlaceResult[]);
      }
      setLoadingRecommendations(false);
    });
  };

  const loadWishlistedPlaces = async () => {
  if (!user) return;
  
  try {
    const { data, error } = await supabase
      .from('wishlist')
      .select('place_id')
      .eq('user_id', user.id);
    
    if (error) throw error;
    setWishlistedPlaces(new Set(data?.map(item => item.place_id) || []));
  } catch (error) {
    console.error('Error loading wishlisted places:', error);
  }
};

  const handleSearch = () => {
    if (!placesService || !searchQuery.trim()) return;

    setLoading(true);
    setActiveTab('search');

    const coordinates = PREFECTURE_COORDINATES[prefectureName] || PREFECTURE_COORDINATES['Tokyo'];

    const request: google.maps.places.TextSearchRequest = {
      query: `${searchQuery} in ${prefectureName}, Japan`,
      location: new google.maps.LatLng(coordinates.lat, coordinates.lng),
      radius: 10000,
    };

    placesService.textSearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        // ✅ FIXED: Properly handle results type
        setSearchResults(results as PlaceResult[]);
      } else {
        setSearchResults([]);
      }
      setLoading(false);
    });
  };

  const handlePlaceClick = (place: PlaceResult) => {
    if (!placesService) return;

    // Ensure we have a valid place_id (PlaceResult.place_id can be undefined)
    const pid = place.place_id;
    if (!pid) {
      console.warn('handlePlaceClick: selected place has no place_id, aborting');
      return;
    }

    const request: google.maps.places.PlaceDetailsRequest = {
      placeId: pid,
      fields: [
        'name', 'formatted_address', 'geometry', 'rating', 'user_ratings_total',
        'price_level', 'photos', 'formatted_phone_number', 'website', 'reviews',
        'opening_hours', 'types', 'place_id'
      ],
    };

    placesService.getDetails(request, (result, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && result) {
        setSelectedPlace(result as PlaceDetails);
        
        if (map && result.geometry?.location) {
          map.panTo(result.geometry.location);
          map.setZoom(16);

          new google.maps.Marker({
            position: result.geometry.location,
            map: map,
            title: result.name,
          });
        }
      }
    });
  };

  const handleToggleWishlist = async (place: PlaceResult, e: React.MouseEvent) => {
  e.stopPropagation();
  
  if (!user || !place.place_id) return;
  
  const isWishlisted = wishlistedPlaces.has(place.place_id);
  
  try {
    if (isWishlisted) {
      // Remove from wishlist
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', user.id)
        .eq('place_id', place.place_id);
      
      if (error) throw error;
      
      const newWishlisted = new Set(wishlistedPlaces);
      newWishlisted.delete(place.place_id);
      setWishlistedPlaces(newWishlisted);
    } else {
      // Add to wishlist
      const { error } = await supabase
        .from('wishlist')
        .insert([{
          user_id: user.id,
          place_id: place.place_id,
          place_name: place.name || '',
          address: place.formatted_address || null,
          latitude: place.geometry?.location?.lat() || null,
          longitude: place.geometry?.location?.lng() || null,
          rating: place.rating || null,
          price_level: place.price_level || null,
          photo_url: place.photos?.[0] ? getPhotoUrl(place.photos[0]) : null,
          types: place.types || null,
        }]);
      
      if (error) throw error;
      
      const newWishlisted = new Set(wishlistedPlaces);
      newWishlisted.add(place.place_id);
      setWishlistedPlaces(newWishlisted);
    }
  } catch (error) {
    console.error('Error toggling wishlist:', error);
    alert('Failed to update wishlist');
  }
};

  // ✅ FIXED: Proper photo URL generation
  const getPhotoUrl = (photo: PlacePhoto) => {
    // Check if photo has getUrl method
    if (photo && typeof photo.getUrl === 'function') {
      return photo.getUrl({ maxWidth: 400, maxHeight: 300 });
    }
    // Fallback to empty placeholder
    return '';
  };

  const getPriceLevel = (level?: number) => {
    if (!level) return 'N/A';
    return '¥'.repeat(level);
  };

  // ✅ FIXED: Proper isOpen check
  const getOpenStatus = (place: PlaceResult | PlaceDetails) => {
    if (!place.opening_hours) return null;
    
    try {
      // Use the isOpen() method if available
      if (typeof place.opening_hours.isOpen === 'function') {
        return place.opening_hours.isOpen();
      }
    } catch (error) {
      console.log('Could not determine open status');
    }
    
    return null;
  };

  const displayedPlaces = searchResults.length > 0 ? searchResults : recommendations;

  useEffect(() => {
    if (!mapRef.current || typeof google === 'undefined') return;

    const coordinates = PREFECTURE_COORDINATES[prefectureName] || PREFECTURE_COORDINATES['Tokyo'];

    const mapInstance = new google.maps.Map(mapRef.current, {
      center: coordinates,
      zoom: 13,
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
    });

    const service = new google.maps.places.PlacesService(mapInstance);
    
    setMap(mapInstance);
    setPlacesService(service);

    loadRecommendations(service, coordinates);
  }, [prefectureName]);

  useEffect(() => {
  if (user) {
    loadWishlistedPlaces();
  }
}, [user]);

  return (
    <div 
        className="fixed inset-0 flex items-center justify-center p-4 z-50" 
        style={{ backgroundColor: 'rgba(44, 36, 22, 0.7)' }}
        onClick={onClose}
      >
      <div 
        className="rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col"
        style={{ backgroundColor: '#D5D0C0' }}
        onClick={(e) => e.stopPropagation()}
      >
      {/* Header */}
<div className="relative overflow-hidden rounded-t-2xl" style={{ background: 'linear-gradient(to right, #5B7C99, #8B7BA8)' }}>
  <div className="absolute inset-0 opacity-5">
            <div style={{
              backgroundImage: `url('/assets/Kanagawa.jpg')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              height: '100%',
              width: '100%',
            }} />
          </div>
  
  <div className="relative z-10 p-6 text-white">
    <div className="flex items-center justify-between mb-4">
      <div className = "flex items-center gap-3">
    <div className="w-12 h-12 rounded-full flex items-center justify-center relative" style={{ backgroundColor: '#154c8f' }}>
         <MapPin className="w-6 h-6 text-white" />
      </div>
      <div>
        <h2 className="text-2xl font-bold" style={{ fontFamily: "'Noto Serif JP', serif" }} >Explore {prefectureName}</h2>
        <p className="text-sm mt-1 opacity-90">Discover amazing places to visit</p>
      </div>
      <button onClick={onClose} className="text-white hover:text-gray-200">
        <X className="w-6 h-6" />
      </button>
      </div>
    </div>

    {/* Search Bar */}
    <div className="flex gap-2">
      <div className="flex-1 relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search for restaurants, attractions, hotels..."
         className="w-full px-4 py-3 pr-12 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
          style={{ 
            backgroundColor: '#D6D0C0',
              color: '#2c2416'
            }}
        />
        <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#7D7463' }} />
      </div>
      <button
        onClick={handleSearch}
        disabled={!searchQuery.trim() || loading}
        className="px-6 py-3 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: '#8B7BA8', color: 'white' }}
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
      </button>
    </div>
  </div> {/* Close relative z-10 */}
</div> {/* Close header */}

        {/* Content */}
<div className="flex-1 flex overflow-hidden">
  {/* Left Panel - Places List */}
  <div className="w-1/2 flex flex-col" style={{ borderRight: '1px solid rgba(125, 116, 99, 0.3)' }}>
    <div className="p-4" style={{ backgroundColor: '#C8B8A5', borderBottom: '1px solid rgba(125, 116, 99, 0.3)' }}>
      <h3 className="font-bold" style={{ color: '#2c2416', fontFamily: "'Noto Serif JP', serif" }}>
        {searchResults.length > 0 ? `Search Results (${searchResults.length})` : `Recommendations (${recommendations.length})`}
      </h3>
    </div>

            {/* Places List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading || loadingRecommendations ? (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#5B7C99' }} />
  </div>
) : displayedPlaces.length === 0 ? (
  <div className="text-center py-12">
    <Search className="w-16 h-16 mx-auto mb-4" style={{ color: '#C8B8A5' }} />
    <p className="text-lg font-medium" style={{ color: '#2c2416', fontFamily: "'Noto Serif JP', serif" }}>
      No places found
    </p>
    <p className="text-sm mt-2" style={{ color: '#7D7463', fontFamily: "'Noto Serif JP', serif" }}>
      Try a different search term
    </p>
  </div>
              ) : (
                displayedPlaces.map((place) => (
  <button
    key={place.place_id}
    onClick={() => handlePlaceClick(place)}
    className="w-full text-left rounded-lg p-4 transition-all border-2 relative"
    style={{
      backgroundColor: selectedPlace?.place_id === place.place_id ? 'rgba(91, 124, 153, 0.1)' : '#D5D0C0',
      borderColor: selectedPlace?.place_id === place.place_id ? '#5B7C99' : 'rgba(125, 116, 99, 0.3)',
    }}
  >
    {/* Wishlist button - keep as is, positioned absolute top-right */}
    <button
      onClick={(e) => handleToggleWishlist(place, e)}
      className="absolute top-3 right-3 p-2 rounded-full transition-all"
      style={{
        backgroundColor: wishlistedPlaces.has(place.place_id || '') ? '#E89CAE' : 'white',
        color: wishlistedPlaces.has(place.place_id || '') ? 'white' : '#C8B8A5',
        border: wishlistedPlaces.has(place.place_id || '') ? 'none' : '1px solid rgba(125, 116, 99, 0.3)'
      }}
      aria-pressed={wishlistedPlaces.has(place.place_id || '')}
      aria-label={wishlistedPlaces.has(place.place_id || '') ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart 
        className={`w-5 h-5 ${wishlistedPlaces.has(place.place_id || '') ? 'fill-current' : ''}`}
      />
    </button>

    <div className="flex gap-3">
      {place.photos && place.photos[0] ? (
        <img
          src={getPhotoUrl(place.photos[0])}
          alt={place.name}
          className="w-20 h-20 object-cover rounded-lg shrink-0"
        />
      ) : (
        <div className="w-20 h-20 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#C8B8A5' }}>
          <ImageIcon className="w-8 h-8" style={{ color: '#7D7463' }} />
        </div>
      )}

      <div className="flex-1 min-w-0 pr-10">
        <h3 className="font-bold truncate" style={{ color: '#2c2416', fontFamily: "'Noto Serif JP', serif" }}>
          {place.name}
        </h3>
        <p className="text-sm truncate mt-1" style={{ color: '#7D7463', fontFamily: "'Noto Serif JP', serif" }}>
          <MapPin className="w-3 h-3 inline mr-1" />
          {place.formatted_address}
        </p>
        <div className="flex items-center gap-3 mt-2">
          {place.rating && (
            <div className="flex items-center gap-1 text-sm">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="font-medium" style={{ color: '#2c2416' }}>{place.rating}</span>
              <span style={{ color: '#7D7463' }}>({place.user_ratings_total})</span>
            </div>
          )}
          {place.price_level && (
            <div className="text-sm font-medium" style={{ color: '#5B7C99' }}>
              {getPriceLevel(place.price_level)}
            </div>
          )}
        </div>
      </div>
    </div>
  </button>
))
              )}
            </div>
          </div>

          {/* Right Panel - Details & Map */}
          <div className="w-1/2 flex flex-col">
            {/* Map */}
            <div ref={mapRef} className="h-64 bg-gray-200"></div>

            {/* Place Details */}
            <div className="flex-1 overflow-y-auto p-6">
              {selectedPlace ? (
                <div>
                  <div className="mb-4">
                    {selectedPlace.photos && selectedPlace.photos.length > 0 && (
                      <img
                        src={getPhotoUrl(selectedPlace.photos[0])}
                        alt={selectedPlace.name}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                    )}
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedPlace.name}</h2>
                    <p className="text-gray-600 flex items-start gap-2">
                      <MapPin className="w-5 h-5 shrink-0 mt-0.5" />
                      {selectedPlace.formatted_address}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {selectedPlace.rating && (
                     <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(91, 124, 153, 0.1)' }}>
                          <div className="flex items-center gap-2" style={{ color: '#5B7C99' }}>
                          <Star className="w-5 h-5" />
                          <span className="font-bold text-lg">{selectedPlace.rating}</span>
                        </div>
                        <p className="text-sm text-blue-700 mt-1">
                          {selectedPlace.user_ratings_total} reviews
                        </p>
                      </div>
                    )}

                    {selectedPlace.price_level && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 text-green-900">
                          <DollarSign className="w-5 h-5" />
                          <span className="font-bold text-lg">{getPriceLevel(selectedPlace.price_level)}</span>
                        </div>
                        <p className="text-sm text-green-700 mt-1">Price range</p>
                      </div>
                    )}

                    {/* ✅ FIXED: Open status check */}
                    {(() => {
                      const isOpen = getOpenStatus(selectedPlace);
                      if (isOpen !== null) {
                        return (
                          <div className={`p-4 rounded-lg ${isOpen ? 'bg-green-50' : 'bg-red-50'}`}>
                            <div className={`flex items-center gap-2 ${isOpen ? 'text-green-900' : 'text-red-900'}`}>
                              <Clock className="w-5 h-5" />
                              <span className="font-bold">{isOpen ? 'Open Now' : 'Closed'}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {selectedPlace.formatted_phone_number && (
                    <div className="flex items-center gap-2 text-gray-700 mb-3">
                      <Phone className="w-5 h-5" />
                      <a href={`tel:${selectedPlace.formatted_phone_number}`} className="hover:text-blue-600">
                        {selectedPlace.formatted_phone_number}
                      </a>
                    </div>
                  )}

                  {selectedPlace.website && (
                    <div className="flex items-center gap-2 text-gray-700 mb-6">
                      <Globe className="w-5 h-5" />
                      <a 
                        href={selectedPlace.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-blue-600 truncate"
                      >
                        {selectedPlace.website}
                      </a>
                    </div>
                  )}

                  {onSelectPlace && selectedPlace.geometry?.location && (
                    <button
                      onClick={() => {
                        // ✅ FIXED: Pass the place directly (it's already PlaceResult type)
                        onSelectPlace(selectedPlace);
                        onClose();
                      }}
                      className="w-full text-white py-3 rounded-lg transition-all hover:shadow-lg font-medium mb-6"
                      style={{ backgroundColor: '#5B7C99' }}
                    >
                      Add to Itinerary
                    </button>
                    
                  )}

                  {selectedPlace.reviews && selectedPlace.reviews.length > 0 && (
                    <div>
                      <h3 className="font-bold text-gray-900 mb-3">Reviews</h3>
                      <div className="space-y-4">
                        {selectedPlace.reviews.slice(0, 3).map((review, index) => (
                          <div key={index} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900">{review.author_name}</span>
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span className="text-sm">{review.rating}</span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-3">{review.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MapPin className="w-16 h-16 mx-auto mb-4" style={{ color: '#C8B8A5' }} />
                    <p className="text-lg font-medium mb-2" style={{ color: '#2c2416', fontFamily: "'Noto Serif JP', serif"}}>
                      Select a place to view details
                    </p>
                      <p className="text-sm" style={{ color: '#7D7463' }}>
                      Click on any place from the list
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}