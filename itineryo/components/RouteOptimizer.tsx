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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-linear-to-r from-amber-400 to-orange-500 p-6 text-white rounded-t-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Route className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Route Optimizer</h2>
            </div>
            {!isOptimizing && (
              <button onClick={onClose} className="text-white hover:text-gray-200">
                <X className="w-6 h-6" />
              </button>
            )}
          </div>
          <p className="text-amber-100 text-sm">
            Using TSP algorithm to find the optimal route
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {!isOptimizing && !completed && !error && (
            <>
              {/* Mode Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Optimization Scope
                </label>
                <div className="space-y-2">
                  <button
                    onClick={() => setMode('single')}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                      mode === 'single'
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">Current Day Only</div>
                    <div className="text-sm text-gray-600 mt-1">
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
                    <div className="font-medium text-gray-900">All Days</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Optimize all {days.length} days in your trip
                    </div>
                  </button>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Calculates distances between all activities</li>
                  <li>• Finds the shortest route using TSP algorithm</li>
                  {hotelOrigin ? (
                    <li>• Starts and ends at your hotel: {hotelOrigin.name}</li>
                  ) : (
                    <li className="text-amber-600">⚠️ No hotel set - optimizing activities only</li>
                  )}
                  <li>• Updates activity order automatically</li>
                </ul>
              </div>

              {/* Optimize Button */}
              <button
                onClick={handleOptimize}
                className="w-full bg-linear-to-r from-amber-400 to-orange-500 text-white py-3 rounded-lg hover:from-amber-500 hover:to-orange-600 transition-all font-medium shadow-md"
              >
                Optimize Route
              </button>
            </>
          )}

          {/* Loading State */}
          {isOptimizing && !completed && (
            <div className="text-center py-8">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <Loader2 className="w-24 h-24 text-amber-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-700">{progress}%</span>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Optimizing Your Route...
              </h3>
              <p className="text-gray-600 text-sm">
                {mode === 'single' 
                  ? 'Calculating optimal path for Day ' + selectedDay
                  : `Processing ${days.length} days`
                }
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div
                  className="bg-linear-to-r from-amber-400 to-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Success State */}
          {completed && (
            <div className="text-center py-8">
              <div className="w-24 h-24 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-16 h-16 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Optimization Complete!
              </h3>
              <p className="text-gray-600 text-sm">
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
              <h3 className="text-lg font-bold text-gray-900 mb-2">
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