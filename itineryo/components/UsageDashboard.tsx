'use client';

// components/UsageDashboard.tsx
import React, { useState, useEffect } from 'react';
import { getUsageSummary } from '@/lib/api-usage';

interface UsageSummary {
  totalCost: number;
  breakdown: {
    maps: number;
    places: number;
    distanceMatrix: number;
    geocoding: number;
  };
  percentage: number;
  isWarning: boolean;
  isDanger: boolean;
}

export function UsageDashboard() {
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Load initial summary
    setSummary(getUsageSummary());

    // Update every 30 seconds
    const interval = setInterval(() => {
      setSummary(getUsageSummary());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!summary) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <p className="text-gray-500">Loading usage data...</p>
      </div>
    );
  }

  const getBackgroundColor = () => {
    if (summary.isDanger) return 'bg-red-50 border-red-200';
    if (summary.isWarning) return 'bg-yellow-50 border-yellow-200';
    return 'bg-green-50 border-green-200';
  };

  const getProgressColor = () => {
    if (summary.isDanger) return 'bg-red-500';
    if (summary.isWarning) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getTextColor = () => {
    if (summary.isDanger) return 'text-red-700';
    if (summary.isWarning) return 'text-yellow-700';
    return 'text-green-700';
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${getBackgroundColor()}`}>
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-bold text-gray-800">API Usage This Month</h3>
        {summary.isWarning && (
          <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
            ⚠️ Warning
          </span>
        )}
        {summary.isDanger && (
          <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded">
            🚨 Critical
          </span>
        )}
      </div>

      <div className="mb-3">
        <p className={`text-3xl font-bold ${getTextColor()}`}>
          ${summary.totalCost.toFixed(2)} <span className="text-lg font-normal text-gray-600">/ $200</span>
        </p>
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-200 h-5 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full transition-all duration-500 ${getProgressColor()}`}
          style={{ width: `${Math.min(summary.percentage, 100)}%` }}
        />
      </div>

      <p className="text-sm text-gray-600 mb-3">
        {summary.percentage.toFixed(1)}% of free tier used
      </p>

      {/* Expandable Breakdown */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 focus:outline-none"
      >
        {isExpanded ? '▼' : '▶'} View Breakdown
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2 pl-4 border-l-2 border-gray-300">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Maps:</span>
            <span className="font-semibold">${summary.breakdown.maps.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Places:</span>
            <span className="font-semibold">${summary.breakdown.places.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Distance Matrix:</span>
            <span className="font-semibold">${summary.breakdown.distanceMatrix.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Geocoding:</span>
            <span className="font-semibold">${summary.breakdown.geocoding.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}