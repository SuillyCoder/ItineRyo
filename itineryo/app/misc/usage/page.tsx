'use client';

import React from 'react';
import { UsageDashboard } from '@/components/UsageDashboard';
import { resetUsageData, exportUsageData, trackMapLoad, trackPlaceSearch } from '@/lib/api-usage';
import { ArrowLeft, Download, RotateCcw, TestTube } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const handleReset = () => {
    if (confirm('Are you sure you want to reset all API usage data?')) {
      resetUsageData();
      window.location.reload();
    }
  };

  const handleExport = () => {
    const data = exportUsageData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-usage-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleTestTracking = () => {
    trackMapLoad();
    trackPlaceSearch(5);
    alert('Test data added! Refresh to see changes.');
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-4"
          >
            <ArrowLeft size={20} />
            Back to Trips
          </Link>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your API usage and app settings</p>
        </div>

        {/* API Usage Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Google Maps API Usage</h2>
            <UsageDashboard />
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Actions</h3>
            <div className="space-y-3">
              <button
                onClick={handleTestTracking}
                className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 border-2 border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <TestTube size={20} />
                <div className="text-left flex-1">
                  <div className="font-semibold">Test Tracking</div>
                  <div className="text-sm text-blue-600">Add sample API usage data</div>
                </div>
              </button>

              <button
                onClick={handleExport}
                className="w-full flex items-center gap-3 px-4 py-3 bg-green-50 border-2 border-green-200 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
              >
                <Download size={20} />
                <div className="text-left flex-1">
                  <div className="font-semibold">Export Data</div>
                  <div className="text-sm text-green-600">Download usage history as JSON</div>
                </div>
              </button>

              <button
                onClick={handleReset}
                className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
              >
                <RotateCcw size={20} />
                <div className="text-left flex-1">
                  <div className="font-semibold">Reset Usage Data</div>
                  <div className="text-sm text-red-600">Clear all tracked API usage</div>
                </div>
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-blue-900 mb-2">💡 About API Usage Tracking</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>• Google Maps provides <strong>$200/month</strong> in free credits</li>
              <li>• Usage is tracked automatically when you use Maps features</li>
              <li>• Data is stored locally in your browser (localStorage)</li>
              <li>• Alerts appear at 75% and 90% usage thresholds</li>
              <li>• Usage resets automatically at the start of each month</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}