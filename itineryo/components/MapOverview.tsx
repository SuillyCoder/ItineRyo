// ============================================
// FILE: components/MapOverview.tsx
// Interactive map showing trip activities and routes
// ============================================
'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { X, Navigation, Maximize2, Minimize2, MapPin, Clock } from 'lucide-react';
import { Activity } from '@/lib/supabase';

interface DayData {
  dayNumber: number;
  date: Date;
  activities: Activity[];
}

interface MapOverviewProps {
  days: DayData[];
  selectedDay: number;
  hotelOrigin: {
    place_id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  } | null;
  onClose: () => void;
}

export default function MapOverview({ days, selectedDay, hotelOrigin, onClose }: MapOverviewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');
  const [showDirections, setShowDirections] = useState(true);
  const [currentDay, setCurrentDay] = useState(selectedDay);
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
  } | null>(null);

  const currentDayData = days.find(d => d.dayNumber === currentDay);
  const activitiesWithLocation = useMemo(() => {
    return currentDayData?.activities.filter(
      a => a.latitude && a.longitude
  ) || [];
}, [currentDay, days]);

  useEffect(() => {
    if (!mapRef.current || typeof google === 'undefined') return;

    // Initialize map
    const map = new google.maps.Map(mapRef.current, {
      zoom: 12,
      mapTypeId: mapType,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: false,
      zoomControl: true,
    });

    googleMapRef.current = map;

    // Initialize directions renderer
    const directionsRenderer = new google.maps.DirectionsRenderer({
      map: map,
      suppressMarkers: true, // We'll add custom markers
      polylineOptions: {
        strokeColor: '#47a69b',
        strokeWeight: 4,
        strokeOpacity: 0.7,
      },
    });
    directionsRendererRef.current = directionsRenderer;

    return () => {
      // Cleanup
      markersRef.current.forEach(marker => marker.setMap(null));
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, []);

  useEffect(() => {
    if (!googleMapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    if (activitiesWithLocation.length === 0) {
      // If no activities, center on hotel or Tokyo
      const defaultCenter = hotelOrigin 
        ? { lat: hotelOrigin.latitude, lng: hotelOrigin.longitude }
        : { lat: 35.6762, lng: 139.6503 }; // Tokyo
      
      googleMapRef.current.setCenter(defaultCenter);
      googleMapRef.current.setZoom(12);

      // Add hotel marker if exists
      if (hotelOrigin) {
        const hotelMarker = new google.maps.Marker({
          position: { lat: hotelOrigin.latitude, lng: hotelOrigin.longitude },
          map: googleMapRef.current,
          title: hotelOrigin.name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#10B981',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
          label: {
            text: '🏨',
            fontSize: '18px',
          },
        });

        markersRef.current.push(hotelMarker);

        // Info window for hotel
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h3 style="font-weight: bold; margin-bottom: 4px;">${hotelOrigin.name}</h3>
              <p style="font-size: 12px; color: #666;">Hotel Origin</p>
            </div>
          `,
        });

        hotelMarker.addListener('click', () => {
          infoWindow.open(googleMapRef.current, hotelMarker);
        });
      }

      if (directionsRendererRef.current) {
        directionsRendererRef.current.setDirections({ routes: [] } as any);
      }
      setRouteInfo(null);
      return;
    }

    // Add markers for each activity
    const bounds = new google.maps.LatLngBounds();
    
    activitiesWithLocation.forEach((activity, index) => {
      const position = {
        lat: activity.latitude!,
        lng: activity.longitude!,
      };

      bounds.extend(position);

      // Create custom marker
      const marker = new google.maps.Marker({
        position,
        map: googleMapRef.current,
        title: activity.activity_name,
        label: {
          text: `${index + 1}`,
          color: 'white',
          fontSize: '14px',
          fontWeight: 'bold',
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 15,
          fillColor: '#47a69b',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
      });

      // Info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 200px;">
            <h3 style="font-weight: bold; margin-bottom: 4px;">${activity.activity_name}</h3>
            ${activity.scheduled_time ? `<p style="font-size: 12px; color: #666; margin-bottom: 4px;">⏰ ${activity.scheduled_time}</p>` : ''}
            ${activity.address ? `<p style="font-size: 12px; color: #666;">${activity.address}</p>` : ''}
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(googleMapRef.current, marker);
      });

      markersRef.current.push(marker);
    });

    // Add hotel marker if exists
    if (hotelOrigin) {
      bounds.extend({ lat: hotelOrigin.latitude, lng: hotelOrigin.longitude });
      
      const hotelMarker = new google.maps.Marker({
        position: { lat: hotelOrigin.latitude, lng: hotelOrigin.longitude },
        map: googleMapRef.current,
        title: hotelOrigin.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#10B981',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        label: {
          text: '🏨',
          fontSize: '16px',
        },
      });

      markersRef.current.push(hotelMarker);

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h3 style="font-weight: bold; margin-bottom: 4px;">${hotelOrigin.name}</h3>
            <p style="font-size: 12px; color: #666;">Hotel Origin</p>
          </div>
        `,
      });

      hotelMarker.addListener('click', () => {
        infoWindow.open(googleMapRef.current, hotelMarker);
      });
    }

    // Fit bounds to show all markers
    googleMapRef.current.fitBounds(bounds);

    // Calculate and display route if enabled
    if (showDirections && activitiesWithLocation.length >= 2) {
      calculateRoute();
    } else if (directionsRendererRef.current) {
      directionsRendererRef.current.setDirections({ routes: [] } as any);
      setRouteInfo(null);
    }
  }, [activitiesWithLocation, showDirections, currentDay, hotelOrigin]);

  useEffect(() => {
    if (googleMapRef.current) {
      googleMapRef.current.setMapTypeId(mapType);
    }
  }, [mapType]);

  const calculateRoute = async () => {
    if (!googleMapRef.current || activitiesWithLocation.length < 2) return;

    // Check if Directions API is available
    const useDirectionsAPI = true; // Set to false to use simple polylines

    if (useDirectionsAPI) {
      try {
        const directionsService = new google.maps.DirectionsService();

        // Build waypoints
        const origin = {
          lat: activitiesWithLocation[0].latitude!,
          lng: activitiesWithLocation[0].longitude!,
        };

        const destination = {
          lat: activitiesWithLocation[activitiesWithLocation.length - 1].latitude!,
          lng: activitiesWithLocation[activitiesWithLocation.length - 1].longitude!,
        };

        const waypoints = activitiesWithLocation
          .slice(1, -1)
          .map(activity => ({
            location: {
              lat: activity.latitude!,
              lng: activity.longitude!,
            },
            stopover: true,
          }));

        // TRANSIT mode only supports 2 waypoints, so use WALKING or DRIVING for multiple stops
      const travelMode = activitiesWithLocation.length > 2 
        ? google.maps.TravelMode.WALKING  // Use WALKING for multiple stops
        : google.maps.TravelMode.TRANSIT; // Use TRANSIT only for 2 locations

      const result = await directionsService.route({
        origin,
        destination,
        waypoints: travelMode === google.maps.TravelMode.WALKING ? waypoints : [], // No waypoints for TRANSIT
        travelMode,
        optimizeWaypoints: false,
      });

        if (directionsRendererRef.current) {
          directionsRendererRef.current.setDirections(result);
        }

        // Calculate total distance and duration
        const route = result.routes[0];
        let totalDistance = 0;
        let totalDuration = 0;

        route.legs.forEach(leg => {
          totalDistance += leg.distance?.value || 0;
          totalDuration += leg.duration?.value || 0;
        });

        setRouteInfo({
          distance: (totalDistance / 1000).toFixed(1) + ' km',
          duration: Math.round(totalDuration / 60) + ' mins',
        });
      } catch (error: any) {
        console.error('Directions API error:', error);
        
        // Fallback to simple polylines if Directions API fails
        drawSimpleRoute();
      }
    } else {
      // Use simple polylines (no Directions API needed)
      drawSimpleRoute();
    }
  };

  const polylineRef = useRef<google.maps.Polyline | null>(null);

  const drawSimpleRoute = () => {
    if (!googleMapRef.current) return;

    // Clear existing polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    // Clear directions renderer
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setDirections({ routes: [] } as any);
    }

    // Create path from activities
    const path = activitiesWithLocation.map(activity => ({
      lat: activity.latitude!,
      lng: activity.longitude!,
    }));

    // Draw polyline
    const polyline = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: '#3B82F6',
      strokeOpacity: 0.7,
      strokeWeight: 4,
      map: googleMapRef.current,
    });

    polylineRef.current = polyline;

    // Calculate approximate distance (straight line)
    let totalDistance = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const from = new google.maps.LatLng(path[i].lat, path[i].lng);
      const to = new google.maps.LatLng(path[i + 1].lat, path[i + 1].lng);
      totalDistance += google.maps.geometry.spherical.computeDistanceBetween(from, to);
    }

    setRouteInfo({
      distance: (totalDistance / 1000).toFixed(1) + ' km',
      duration: 'Estimated', // Can't calculate time without Directions API
    });
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center z-50 p-4 ${isFullscreen ? 'p-0' : ''}`}
      style={{ backgroundColor: 'rgba(44, 36, 22, 0.7)' }}
    >      
    <div 
      className={`rounded-2xl shadow-2xl overflow-hidden ${isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-6xl h-[90vh]'}`}
      style={{ backgroundColor: '#D5D0C0' }}
    >
        {/* Header */}
        <div className="relative overflow-hidden p-4 text-white" style={{ background: 'linear-gradient(to right, #47a69b, #5cb3a9)' }}>
  <div className="absolute inset-0 opacity-5">
            <div style={{
              backgroundImage: `url('/assets/Kanagawa.jpg')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              height: '100%',
              width: '100%',
            }} />
          </div>
  
  <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center relative" style={{ backgroundColor: '#63cfc2' }}>
                  <MapPin className="w-6 h-6 text-white" />
                </div>
              <div>
                <h2 className="text-xl font-bold">Map Overview</h2>
                <p className="text-sm text-white opacity-90">
                  {currentDayData?.date.toLocaleDateString('en-US', { 
                    weekday: 'long', month: 'long', day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          </div>
        </div>

        <div className="flex h-[calc(100%-80px)]">
          {/* Sidebar */}
          <div className="w-80 overflow-y-auto" style={{ backgroundColor: '#D5D0C0', borderRight: '1px solid rgba(125, 116, 99, 0.3)' }}>
            <div className="p-4 space-y-4">
              {/* Day selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Day</label>
                <select
                  value={currentDay}
                  onChange={(e) => setCurrentDay(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg focus:ring-2 focus:oFutline-none"
                  style={{ 
                    backgroundColor: 'white',
                    border: '1px solid rgba(125, 116, 99, 0.3)',
                    color: '#2c2416'
                  }}
                >
                  {days.map(day => (
                    <option key={day.dayNumber} value={day.dayNumber}>
                      Day {day.dayNumber} - {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </option>
                  ))}
                </select>
              </div>

              {/* Map controls */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Map Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setMapType('roadmap')}
                    className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      style={{
                      backgroundColor: mapType === 'roadmap' ? '#47a69b' : 'white',
                      color: mapType === 'roadmap' ? 'white' : '#2c2416',
                      border: mapType === 'roadmap' ? 'none' : '1px solid rgba(125, 116, 99, 0.3)'
                    }}
                  >
                    Road Map
                  </button>
                  <button
                    onClick={() => setMapType('satellite')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      mapType === 'satellite'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Satellite
                  </button>
                </div>
              </div>

              {/* Show directions toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'white', border: '1px solid rgba(125, 116, 99, 0.3)' }}>
                <span className="text-sm font-medium" style={{ color: '#2c2416' }}>Show Route</span>
                <button
                  onClick={() => setShowDirections(!showDirections)}
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                  style={{ backgroundColor: showDirections ? '#47a69b' : '#C8B8A5' }}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showDirections ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Route info */}
              {routeInfo && (
               <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(71, 166, 155, 0.1)', border: '1px solid rgba(71, 166, 155, 0.3)' }}>
  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: '#2c2416' }}>
                    <Navigation className="w-4 h-4" />
                    Route Information
                  </h3>
                   <div className="space-y-1 text-sm" style={{ color: '#7D7463' }}>
                    <p>📏 Total Distance: {routeInfo.distance}</p>
                    <p>⏱️ Est. Travel Time: {routeInfo.duration}</p>
                  </div>
                </div>
              )}

              {/* Activities list */}
              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: '#2c2416' }}>
                  Activities ({activitiesWithLocation.length})
                </h3>
                {activitiesWithLocation.length === 0 ? (
                  <div className="text-center py-8" style={{ color: '#7D7463' }}>
                    <MapPin className="w-12 h-12 mx-auto mb-2" style={{ color: '#C8B8A5' }} />
                    <p className="text-sm">No activities with locations</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activitiesWithLocation.map((activity, index) => (
                      <div
                        key={activity.id}
                        className="rounded-lg p-3 hover:shadow-md transition-shadow"
                        style={{ backgroundColor: 'white', border: '1px solid rgba(125, 116, 99, 0.3)' }}
                      >
                      <div className="flex items-start gap-3">
                      <div className="shrink-0 w-6 h-6 text-white rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#47a69b' }}>
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium truncate" style={{ color: '#2c2416' }}>
                              {activity.activity_name}
                            </h4>
                            {activity.scheduled_time && (
                              <p className="text-xs flex items-center gap-1 mt-1" style={{ color: '#7D7463' }}>
                                <Clock className="w-3 h-3" />
                                {activity.scheduled_time}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Map container */}
          <div className="flex-1 relative">
            <div ref={mapRef} className="w-full h-full" />
            
            {/* Loading overlay */}
            {typeof google === 'undefined' && (
              <div className="absolute inset-0 flex items-center justify-center bg-white">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#47a69b' }}></div>
                    <p style={{ color: '#7D7463' }}>Loading Google Maps...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}