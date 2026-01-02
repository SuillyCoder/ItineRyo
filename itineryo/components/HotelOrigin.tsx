// ============================================
// FILE: components/HotelOrigin.tsx
// Hotel search and selection for trip origin/destination
// ============================================
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, MapPin, Star, DollarSign, Phone, Globe, Image as ImageIcon, Loader2, Hotel } from 'lucide-react';

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
      type: 'lodging', // This searches for hotels, hostels, etc.
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
            icon: {
              url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
            },
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
    <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-linear-to-r from-sky-400 to-sky-600 p-6 text-white rounded-t-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Hotel className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Select Your Hotel</h2>
                <p className="text-sky-100 text-sm mt-1">
                  Choose your accommodation in {prefectureName}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-white hover:text-gray-200">
              <X className="w-6 h-6" />
            </button>
          </div>

          {currentHotel && (
            <div className="bg-sky-500 bg-opacity-30 rounded-lg p-3 mb-4">
              <div className="text-sm text-sky-100">Current Hotel:</div>
              <div className="font-medium">{currentHotel.name}</div>
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
                className="w-full px-4 py-3 pr-12 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
              />
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
            <button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || loading}
              className="px-6 py-3 bg-white text-sky-600 rounded-lg hover:bg-sky-50 transition-colors font-medium disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Hotels List */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-bold text-gray-900">
                {searchResults.length > 0 ? `Search Results (${searchResults.length})` : `Recommended Hotels (${recommendations.length})`}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading || loadingRecommendations ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
                </div>
              ) : displayedPlaces.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Hotel className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No hotels found</p>
                  <p className="text-sm mt-2">Try a different search term</p>
                </div>
              ) : (
                displayedPlaces.map((place) => (
                  <button
                    key={place.place_id}
                    onClick={() => handlePlaceClick(place)}
                    className={`w-full text-left bg-white border-2 rounded-lg p-4 hover:border-sky-500 hover:shadow-md transition-all ${
                      selectedPlace?.place_id === place.place_id ? 'border-sky-500 bg-sky-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex gap-3">
                      {place.photos && place.photos[0] ? (
                        <img
                          src={getPhotoUrl(place.photos[0])}
                          alt={place.name}
                          className="w-20 h-20 object-cover rounded-lg shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center shrink-0">
                          <Hotel className="w-8 h-8 text-gray-400" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">{place.name}</h3>
                        <p className="text-sm text-gray-600 truncate mt-1">
                          <MapPin className="w-3 h-3 inline mr-1" />
                          {place.formatted_address}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          {place.rating && (
                            <div className="flex items-center gap-1 text-sm">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              <span className="font-medium">{place.rating}</span>
                              <span className="text-gray-500">({place.user_ratings_total})</span>
                            </div>
                          )}
                          {place.price_level && (
                            <div className="text-sm text-green-600 font-medium">
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedPlace.name}</h2>
                    <p className="text-gray-600 flex items-start gap-2">
                      <MapPin className="w-5 h-5 shrink-0 mt-0.5" />
                      {selectedPlace.formatted_address}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {selectedPlace.rating && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-900">
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
                  </div>

                  {selectedPlace.formatted_phone_number && (
                    <div className="flex items-center gap-2 text-gray-700 mb-3">
                      <Phone className="w-5 h-5" />
                      <a href={`tel:${selectedPlace.formatted_phone_number}`} className="hover:text-sky-600">
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
                        className="hover:text-sky-600 truncate"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}

                  <button
                    onClick={handleSelectHotel}
                    className="w-full bg-sky-600 text-white py-3 rounded-lg hover:bg-sky-700 transition-colors font-medium mb-6"
                  >
                    Set as Hotel Origin
                  </button>

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
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Hotel className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Select a hotel to view details</p>
                    <p className="text-sm mt-2">Click on any hotel from the list</p>
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