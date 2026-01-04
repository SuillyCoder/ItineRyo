// ============================================
// FILE: components/RouteOptimizer.tsx
// Route optimization UI with TSP algorithm
// ============================================
'use client';

import React, { useState, useEffect } from 'react';
import { X, Route, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { optimizeDayRoute, optimizeEntireTrip } from '@/lib/tspOptimizer';

interface Activity {
  id: string;
  activity_name: string;
  latitude: number | null;
  longitude: number | null;
  order_index: number;
  day_number: number;
  [key: string]: any;
}

interface DayData {
  dayNumber: number;
  date: Date;
  activities: Activity[];
}

interface RouteOptimizerProps {
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
  // Allow either sync or async callbacks and accept any activity shape to avoid
  // strict type mismatches with the project's Activity type from lib/supabase.
  onOptimize: (optimizedActivities: Map<number, any[]>) => void | Promise<void>;
}

type OptimizationMode = 'single' | 'all';

export default function RouteOptimizer({
  days,
  selectedDay,
  hotelOrigin,
  onClose,
  onOptimize,
}: RouteOptimizerProps) {
  const [mode, setMode] = useState<OptimizationMode>('single');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOptimize = async () => {
    setIsOptimizing(true);
    setProgress(0);
    setError(null);

    try {
      // Simulate minimum 3 second loading
      const startTime = Date.now();

      if (mode === 'single') {
        // Optimize only selected day
        setProgress(33);
        
        const currentDay = days.find(d => d.dayNumber === selectedDay);
        if (!currentDay) throw new Error('Day not found');

        // Check if activities have coordinates
        const activitiesWithCoords = currentDay.activities.filter(
          a => a.latitude !== null && a.longitude !== null
        );

        if (activitiesWithCoords.length === 0) {
          throw new Error('No activities with location data to optimize');
        }

        setProgress(66);
        const optimized = await optimizeDayRoute(currentDay.activities, hotelOrigin);
        
        const result = new Map<number, Activity[]>();
        result.set(selectedDay, optimized);
        
        setProgress(100);
        
        // Ensure minimum 3 seconds
        const elapsed = Date.now() - startTime;
        if (elapsed < 3000) {
          await new Promise(resolve => setTimeout(resolve, 3000 - elapsed));
        }
        
        setCompleted(true);
        setTimeout(() => {
          onOptimize(result);
          onClose();
        }, 1000);
        
      } else {
        // Optimize all days
        const totalDays = days.length;
        let processedDays = 0;

        // Check if any day has activities with coordinates
        const daysWithValidActivities = days.filter(day =>
          day.activities.some(a => a.latitude !== null && a.longitude !== null)
        );

        if (daysWithValidActivities.length === 0) {
          throw new Error('No activities with location data to optimize');
        }

        const optimizedMap = new Map<number, Activity[]>();

        for (const day of days) {
          const activitiesWithCoords = day.activities.filter(
            a => a.latitude !== null && a.longitude !== null
          );

          if (activitiesWithCoords.length > 0) {
            const optimized = await optimizeDayRoute(day.activities, hotelOrigin);
            optimizedMap.set(day.dayNumber, optimized);
          } else {
            // Keep original order if no coordinates
            optimizedMap.set(day.dayNumber, day.activities);
          }

          processedDays++;
          setProgress(Math.floor((processedDays / totalDays) * 100));
        }

        // Ensure minimum 3 seconds
        const elapsed = Date.now() - startTime;
        if (elapsed < 3000) {
          await new Promise(resolve => setTimeout(resolve, 3000 - elapsed));
        }

        setCompleted(true);
        setTimeout(() => {
          onOptimize(optimizedMap);
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      console.error('Optimization error:', err);
      setError(err.message || 'Failed to optimize route');
      setIsOptimizing(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4 z-50" 
      style={{ backgroundColor: 'rgba(44, 36, 22, 0.7)' }}
      onClick={onClose}
    >
      <div 
        className="rounded-2xl shadow-2xl w-full max-w-md"
        style={{ backgroundColor: '#D5D0C0' }}
        onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="relative overflow-hidden rounded-t-2xl" style={{ background: 'linear-gradient(to right, #E6B422, #D68910)' }}>
        <div className="absolute inset-0 opacity-10">
            <div style={{
              backgroundImage: `url('/assets/Kanagawa.jpg')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              height: '100%',
              width: '100%',
            }} />
          </div>
  
        <div className="relative z-10 p-6 text-white" >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3" >
              <div className="w-12 h-12 rounded-full flex items-center justify-center relative" style={{ backgroundColor: '#ffbd08'}}>
                  <Route className="w-6 h-6 text-white" />
                </div>
              <h2 className="text-2xl font-bold" >Route Optimizer</h2>
            </div>
            {!isOptimizing && (
              <button onClick={onClose} className="text-white hover:text-gray-200">
                <X className="w-6 h-6" />
              </button>
            )}
          </div>
          <p className="text-white opacity-90 text-sm">
            Using TSP algorithm to find the optimal route
          </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!isOptimizing && !completed && !error && (
            <>
              {/* Mode Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3" style={{ color: '#2c2416' }}>
                  Optimization Scope
                </label>
                <div className="space-y-2">
                  <button
                    onClick={() => setMode('single')}
                    className="w-full text-left px-4 py-3 rounded-lg border-2 transition-colors"
                      style={{
                      borderColor: mode === 'single' ? '#E6B422' : 'rgba(125, 116, 99, 0.3)',
                      backgroundColor: mode === 'single' ? 'rgba(230, 180, 34, 0.1)' : 'transparent'
                    }}
                  >
                    <div className="font-medium" style={{ color: '#2c2416' }}>Current Day Only</div>
                    <div className="text-sm mt-1" style={{ color: '#7D7463' }}>
                      Optimize Day {selectedDay} activities
                    </div>
                  </button>

                  <button
                    onClick={() => setMode('all')}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                      mode === 'all'
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium" style={{ color: '#2c2416' }}>All Days</div>
                    <div className="text-sm mt-1" style={{ color: '#7D7463' }}>
                      Optimize all {days.length} days in your trip
                    </div>
                  </button>
                </div>
              </div>

              {/* Info Box */}
              <div className="rounded-lg p-4 mb-6" style={{ backgroundColor: 'rgba(230, 180, 34, 0.1)', border: '2px solid rgba(230, 180, 34, 0.3)' }}>
              <h4 className="font-medium mb-2" style={{ color: '#2c2416' }}>How it works:</h4>
              <ul className="text-sm space-y-1" style={{ color: '#7D7463' }}>
                  <li>• Calculates distances between all activities</li>
                  <li>• Finds the shortest route using TSP algorithm</li>
                  {hotelOrigin ? (
                    <li>• Starts and ends at your hotel: {hotelOrigin.name}</li>
                  ) : (
                    <li style={{ color: '#D68910' }}>⚠️ No hotel set - optimizing activities only</li>
                  )}
                  <li>• Updates activity order automatically</li>
                </ul>
              </div>

              {/* Optimize Button */}
              <button
                onClick={handleOptimize}
                className="w-full text-white py-3 rounded-lg transition-all hover:shadow-lg font-medium"
                style={{ background: 'linear-gradient(to right, #E6B422, #D68910)' }}
              >
                Optimize Route
              </button>
            </>
          )}

          {/* Loading State */}
          {isOptimizing && !completed && (
            <div className="text-center py-8">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <Loader2 className="w-24 h-24 animate-spin" style={{ color: '#E6B422' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold " style={{ color: '#2c2416' }}>{progress}%</span>
                </div>
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: '#2c2416' }}>
                Optimizing Your Route...
              </h3>
              <p className="text-sm" style={{ color: '#7D7463' }}>
                {mode === 'single' 
                  ? 'Calculating optimal path for Day ' + selectedDay
                  : `Processing ${days.length} days`
                }
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div
                className="h-2 rounded-full transition-all duration-300"
                style={{ 
                    width: `${progress}%`,
                    background: 'linear-gradient(to right, #E6B422, #D68910)'
                }}
                ></div>
              </div>
            </div>
          )}

          {/* Success State */}
          {completed && (
            <div className="text-center py-8">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}>
                <CheckCircle className="w-16 h-16 text-green-600" />
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: '#2c2416' }}>
                Optimization Complete!
              </h3>
              <p className="text-sm" style={{ color: '#7D7463' }}>
                Your activities have been reordered for the most efficient route
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-8">
              <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-16 h-16 text-red-600" />
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: '#2c2416' }}>
                Optimization Failed
              </h3>
              <p className="text-red-600 text-sm mb-4">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  setProgress(0);
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}