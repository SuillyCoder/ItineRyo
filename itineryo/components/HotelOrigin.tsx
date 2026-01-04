// ============================================
// FILE: components/HotelOrigin.tsx
// Hotel search and selection - Japanese Design
// ============================================
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, MapPin, Star, DollarSign, Phone, Globe, Loader2, Hotel } from 'lucide-react';

type PlaceResult = google.maps.places.PlaceResult;
type PlacePhoto = google.maps.places.PlacePhoto;
type PlaceDetails = google.maps.places.PlaceResult;

interface HotelOriginProps {
  prefectureName?: string;
  currentHotel?: {
    place_id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  } | null;
  onClose: () => void;
  onSelectHotel: (hotel: {
    place_id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  }) => void;
}

export default function HotelOrigin({ 
  prefectureName = 'Tokyo',
  currentHotel,
  onClose,
  onSelectHotel
}: HotelOriginProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [recommendations, setRecommendations] = useState<PlaceResult[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
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

  const loadRecommendations = (service: google.maps.places.PlacesService, location: { lat: number; lng: number }) => {
    setLoadingRecommendations(true);

    const request: google.maps.places.PlaceSearchRequest = {
      location,
      radius: 5000,
      type: 'lodging',
      keyword: 'hotel',
    };

    service.nearbySearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        setRecommendations(results.slice(0, 12) as PlaceResult[]);
      }
      setLoadingRecommendations(false);
    });
  };

  const handleSearch = () => {
    if (!placesService || !searchQuery.trim()) return;

    setLoading(true);

    const coordinates = PREFECTURE_COORDINATES[prefectureName] || PREFECTURE_COORDINATES['Tokyo'];

    const request: google.maps.places.TextSearchRequest = {
      query: `hotel ${searchQuery} in ${prefectureName}, Japan`,
      location: new google.maps.LatLng(coordinates.lat, coordinates.lng),
      radius: 10000,
      type: 'lodging',
    };

    placesService.textSearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        setSearchResults(results as PlaceResult[]);
      } else {
        setSearchResults([]);
      }
      setLoading(false);
    });
  };

  const handlePlaceClick = (place: PlaceResult) => {
    if (!placesService) return;

    const request: google.maps.places.PlaceDetailsRequest = {
      placeId: place.place_id || '',
      fields: [
        'name', 'formatted_address', 'geometry', 'rating', 'user_ratings_total',
        'price_level', 'photos', 'formatted_phone_number', 'website', 'reviews',
        'types', 'place_id'
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

  const getPhotoUrl = (photo: PlacePhoto) => {
    if (photo && typeof photo.getUrl === 'function') {
      return photo.getUrl({ maxWidth: 400, maxHeight: 300 });
    }
    return '';
  };

  const getPriceLevel = (level?: number) => {
    if (!level) return 'N/A';
    return '¥'.repeat(level);
  };

  const handleSelectHotel = () => {
    if (!selectedPlace || !selectedPlace.geometry?.location) return;

    const hotelData = {
      place_id: selectedPlace.place_id || '',
      name: selectedPlace.name || '',
      address: selectedPlace.formatted_address || '',
      latitude: selectedPlace.geometry.location.lat(),
      longitude: selectedPlace.geometry.location.lng(),
    };

    onSelectHotel(hotelData);
    onClose();
  };

  const displayedPlaces = searchResults.length > 0 ? searchResults : recommendations;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(44, 36, 22, 0.7)' }} onClick={onClose}>
      <div 
        className="rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden"
        style={{ backgroundColor: '#D6D0C0' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Kanagawa Wave Background */}
        <div className="relative overflow-hidden" style={{ backgroundColor: '#7DB9DE' }}>
          <div className="absolute inset-0 opacity-5">
            <div style={{
              backgroundImage: `url('/assets/Kanagawa.jpg')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              height: '100%',
              width: '100%',
            }} />
          </div>
          
          <div className="relative z-10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center relative" style={{ backgroundColor: '#5B9BD5' }}>
                  <Hotel className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Noto Serif JP', serif" }}>
                    Select Your Hotel
                  </h2>
                  <p className="text-sm mt-1 text-white opacity-90" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                    Choose your accommodation in {prefectureName}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 rounded-full transition-all hover:shadow-md" 
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {currentHotel && (
              <div className="rounded-lg p-3 mb-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                <div className="text-sm text-white opacity-80" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                  Current Hotel:
                </div>
                <div className="font-medium text-white" style={{ fontFamily: "'Noto Serif JP', serif" }}>
                  {currentHotel.name}
                </div>
              </div>
            )}

            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search for hotels by name or area..."
                  className="w-full px-4 py-3 pr-12 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
                  style={{ 
                    backgroundColor: '#D6D0C0',
                    color: '#2c2416',
                    fontFamily: "'Noto Sans JP', sans-serif"
                  }}
                />
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#7D7463' }} />
              </div>
              <button
                onClick={handleSearch}
                disabled={!searchQuery.trim() || loading}
                className="px-6 py-3 rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: '#5B9BD5',
                  color: 'white',
                  fontFamily: "'Noto Sans JP', sans-serif"
                }}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Hotels List */}
          <div className="w-1/2 flex flex-col" style={{ borderRight: '1px solid rgba(125, 116, 99, 0.3)' }}>
            <div className="p-4" style={{ backgroundColor: '#C8B8A5', borderBottom: '1px solid rgba(125, 116, 99, 0.3)' }}>
              <h3 className="font-bold" style={{ fontFamily: "'Noto Serif JP', serif", color: '#2c2416' }}>
                {searchResults.length > 0 ? `Search Results (${searchResults.length})` : `Recommended Hotels (${recommendations.length})`}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading || loadingRecommendations ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#5B9BD5' }} />
                </div>
              ) : displayedPlaces.length === 0 ? (
                <div className="text-center py-12">
                  <Hotel className="w-16 h-16 mx-auto mb-4" style={{ color: '#C8B8A5' }} />
                  <p className="text-lg font-medium" style={{ fontFamily: "'Noto Serif JP', serif", color: '#2c2416' }}>
                    No hotels found
                  </p>
                  <p className="text-sm mt-2" style={{ fontFamily: "'Noto Sans JP', sans-serif", color: '#7D7463' }}>
                    Try a different search term
                  </p>
                </div>
              ) : (
                displayedPlaces.map((place) => (
                  <button
                    key={place.place_id}
                    onClick={() => handlePlaceClick(place)}
                    className={`w-full text-left rounded-lg p-4 transition-all border-2 ${
                      selectedPlace?.place_id === place.place_id ? 'shadow-md' : ''
                    }`}
                    style={{
                      backgroundColor: selectedPlace?.place_id === place.place_id ? 'rgba(91, 155, 213, 0.1)' : '#D6D0C0',
                      borderColor: selectedPlace?.place_id === place.place_id ? '#5B9BD5' : 'rgba(125, 116, 99, 0.3)',
                    }}
                  >
                    <div className="flex gap-3">
                      {place.photos && place.photos[0] ? (
                        <img
                          src={getPhotoUrl(place.photos[0])}
                          alt={place.name}
                          className="w-20 h-20 object-cover rounded-lg shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#C8B8A5' }}>
                          <Hotel className="w-8 h-8" style={{ color: '#7D7463' }} />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold truncate" style={{ fontFamily: "'Noto Serif JP', serif", color: '#2c2416' }}>
                          {place.name}
                        </h3>
                        <p className="text-sm truncate mt-1" style={{ fontFamily: "'Noto Sans JP', sans-serif", color: '#7D7463' }}>
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
                            <div className="text-sm font-medium" style={{ color: '#5B9BD5' }}>
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
            <div ref={mapRef} className="h-64" style={{ backgroundColor: '#C8B8A5' }}></div>

            {/* Hotel Details */}
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
                    <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Noto Serif JP', serif", color: '#2c2416' }}>
                      {selectedPlace.name}
                    </h2>
                    <p className="flex items-start gap-2" style={{ fontFamily: "'Noto Sans JP', sans-serif", color: '#7D7463' }}>
                      <MapPin className="w-5 h-5 shrink-0 mt-0.5" />
                      {selectedPlace.formatted_address}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {selectedPlace.rating && (
                      <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(91, 155, 213, 0.1)' }}>
                        <div className="flex items-center gap-2" style={{ color: '#5B9BD5' }}>
                          <Star className="w-5 h-5" />
                          <span className="font-bold text-lg">{selectedPlace.rating}</span>
                        </div>
                        <p className="text-sm mt-1" style={{ fontFamily: "'Noto Sans JP', sans-serif", color: '#7D7463' }}>
                          {selectedPlace.user_ratings_total} reviews
                        </p>
                      </div>
                    )}

                    {selectedPlace.price_level && (
                      <div className="p-4 rounded-lg" style={{ backgroundColor: '#C8B8A5' }}>
                        <div className="flex items-center gap-2" style={{ color: '#2c2416' }}>
                          <DollarSign className="w-5 h-5" />
                          <span className="font-bold text-lg">{getPriceLevel(selectedPlace.price_level)}</span>
                        </div>
                        <p className="text-sm mt-1" style={{ fontFamily: "'Noto Sans JP', sans-serif", color: '#7D7463' }}>
                          Price range
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedPlace.formatted_phone_number && (
                    <div className="flex items-center gap-2 mb-3" style={{ fontFamily: "'Noto Sans JP', sans-serif", color: '#7D7463' }}>
                      <Phone className="w-5 h-5" />
                      <a href={`tel:${selectedPlace.formatted_phone_number}`} className="hover:opacity-80" style={{ color: '#5B9BD5' }}>
                        {selectedPlace.formatted_phone_number}
                      </a>
                    </div>
                  )}

                  {selectedPlace.website && (
                    <div className="flex items-center gap-2 mb-6" style={{ fontFamily: "'Noto Sans JP', sans-serif", color: '#7D7463' }}>
                      <Globe className="w-5 h-5" />
                      <a 
                        href={selectedPlace.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:opacity-80 truncate"
                        style={{ color: '#5B9BD5' }}
                      >
                        Visit Website
                      </a>
                    </div>
                  )}

                  <button
                    onClick={handleSelectHotel}
                    className="w-full py-3 rounded-lg transition-all hover:shadow-lg font-medium mb-6"
                    style={{ 
                      backgroundColor: '#5B9BD5',
                      color: 'white',
                      fontFamily: "'Noto Sans JP', sans-serif"
                    }}
                  >
                    Set as Hotel Origin
                  </button>

                  {selectedPlace.reviews && selectedPlace.reviews.length > 0 && (
                    <div>
                      <h3 className="font-bold mb-3" style={{ fontFamily: "'Noto Serif JP', serif", color: '#2c2416' }}>
                        Reviews
                      </h3>
                      <div className="space-y-4">
                        {selectedPlace.reviews.slice(0, 3).map((review, index) => (
                          <div key={index} className="p-4 rounded-lg" style={{ backgroundColor: '#C8B8A5' }}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium" style={{ fontFamily: "'Noto Sans JP', sans-serif", color: '#2c2416' }}>
                                {review.author_name}
                              </span>
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span className="text-sm" style={{ color: '#2c2416' }}>{review.rating}</span>
                              </div>
                            </div>
                            <p className="text-sm line-clamp-3" style={{ fontFamily: "'Noto Sans JP', sans-serif", color: '#7D7463' }}>
                              {review.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Hotel className="w-16 h-16 mx-auto mb-4" style={{ color: '#C8B8A5' }} />
                    <p className="text-lg font-medium mb-2" style={{ fontFamily: "'Noto Serif JP', serif", color: '#2c2416' }}>
                      Select a hotel to view details
                    </p>
                    <p className="text-sm" style={{ fontFamily: "'Noto Sans JP', sans-serif", color: '#7D7463' }}>
                      Click on any hotel from the list
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