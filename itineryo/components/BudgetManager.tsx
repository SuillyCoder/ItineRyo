// ============================================
// FILE: components/BudgetManager.tsx
// Budget tracking with pie charts and daily/trip totals
// ============================================
'use client';

import React, { useState, useEffect } from 'react';
import { X, Wallet, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface Activity {
  id: string;
  activity_name: string;
  category: string;
  estimated_cost: number | null;
  day_number: number;
}

interface BudgetManagerProps {
  tripId: string;
  activities: Activity[];
  tripDuration: number; // Number of days
  onClose: () => void;
}

interface CategoryBreakdown {
  category: string;
  amount: number;
  count: number;
}

// Category colors matching your activity categories
const CATEGORY_COLORS: Record<string, string> = {
  dining: '#F97316',
  shopping: '#EC4899',
  attractions: '#A855F7',
  transportation: '#3B82F6',
  accommodation: '#10B981',
  parks: '#059669',
  entertainment: '#6366F1',
  other: '#6B7280',
};

const CATEGORY_LABELS: Record<string, string> = {
  dining: '🍽️ Dining',
  shopping: '🛍️ Shopping',
  attractions: '🎭 Attractions',
  transportation: '🚇 Transportation',
  accommodation: '🏨 Accommodation',
  parks: '🌳 Parks & Nature',
  entertainment: '🎪 Entertainment',
  other: '📌 Other',
};

export default function BudgetManager({ 
  tripId, 
  activities, 
  tripDuration,
  onClose 
}: BudgetManagerProps) {
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    calculateBudget();
  }, [activities, selectedDay]);

  const calculateBudget = () => {
    // Filter activities based on selected day
    const filteredActivities = selectedDay === 'all' 
      ? activities 
      : activities.filter(a => a.day_number === selectedDay);

    // Calculate total
    const total = filteredActivities.reduce((sum, activity) => {
      return sum + (activity.estimated_cost || 0);
    }, 0);
    setTotalCost(total);

    // Group by category
    const categoryMap: Record<string, CategoryBreakdown> = {};
    
    filteredActivities.forEach(activity => {
      const cost = activity.estimated_cost || 0;
      if (cost > 0) {
        if (!categoryMap[activity.category]) {
          categoryMap[activity.category] = {
            category: activity.category,
            amount: 0,
            count: 0,
          };
        }
        categoryMap[activity.category].amount += cost;
        categoryMap[activity.category].count += 1;
      }
    });

    // Convert to array and sort by amount
    const breakdown = Object.values(categoryMap).sort((a, b) => b.amount - a.amount);
    setCategoryBreakdown(breakdown);
  };

  const getDailyTotals = () => {
    const dailyTotals: Record<number, number> = {};
    
    activities.forEach(activity => {
      if (!dailyTotals[activity.day_number]) {
        dailyTotals[activity.day_number] = 0;
      }
      dailyTotals[activity.day_number] += activity.estimated_cost || 0;
    });

    return dailyTotals;
  };

  const dailyTotals = getDailyTotals();
  const averageDailySpend = totalCost / tripDuration;

  // Prepare data for pie chart
  const pieChartData = categoryBreakdown.map(item => ({
    name: CATEGORY_LABELS[item.category] || item.category,
    value: item.amount,
    category: item.category
  }));

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString()}`;
  };

  const getPercentage = (amount: number) => {
    if (totalCost === 0) return 0;
    return ((amount / totalCost) * 100).toFixed(1);
  };

  return (
    <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-linear-to-r from-green-500 to-emerald-600 p-6 text-white rounded-t-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Wallet className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Budget Management</h2>
                <p className="text-green-100 text-sm mt-1">Track your expenses and spending</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white hover:text-gray-200">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Day Selector Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedDay('all')}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedDay === 'all'
                  ? 'bg-white text-green-600'
                  : 'bg-green-600 bg-opacity-30 text-white hover:bg-opacity-50'
              }`}
            >
              Entire Trip
            </button>
            {Array.from({ length: tripDuration }, (_, i) => i + 1).map(day => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedDay === day
                    ? 'bg-white text-green-600'
                    : 'bg-green-600 bg-opacity-30 text-white hover:bg-opacity-50'
                }`}
              >
                Day {day}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-linear-to-br from-blue-50 to-blue-100 p-6 rounded-xl border-2 border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-700 font-medium">Total Budget</span>
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-blue-900">
                {formatCurrency(totalCost)}
              </div>
              <p className="text-sm text-blue-600 mt-1">
                {selectedDay === 'all' ? 'For entire trip' : `For Day ${selectedDay}`}
              </p>
            </div>

            <div className="bg-linear-to-br from-purple-50 to-purple-100 p-6 rounded-xl border-2 border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-purple-700 font-medium">Avg per Day</span>
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-purple-900">
                {formatCurrency(selectedDay === 'all' ? averageDailySpend : totalCost)}
              </div>
              <p className="text-sm text-purple-600 mt-1">
                {selectedDay === 'all' ? 'Across all days' : 'This day only'}
              </p>
            </div>

            <div className="bg-linear-to-br from-green-50 to-green-100 p-6 rounded-xl border-2 border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-700 font-medium">Activities</span>
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-green-900">
                {selectedDay === 'all' 
                  ? activities.filter(a => (a.estimated_cost || 0) > 0).length 
                  : activities.filter(a => a.day_number === selectedDay && (a.estimated_cost || 0) > 0).length
                }
              </div>
              <p className="text-sm text-green-600 mt-1">
                With expenses
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
                <h3 className="text-lg font-bold text-gray-900">Spending by Category</h3>
              </div>
              
              {categoryBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${typeof percent === 'number' ? Math.round(percent * 100) + '%' : ''}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={CATEGORY_COLORS[entry.category] || '#6B7280'} 
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value?: number) => (value == null ? '' : formatCurrency(value))}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-75 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                    </svg>
                    <p className="font-medium">No expense data</p>
                    <p className="text-sm mt-1">Add costs to activities to see breakdown</p>
                  </div>
                </div>
              )}
            </div>

            {/* Category Breakdown List */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Category Details</h3>
              
              {categoryBreakdown.length > 0 ? (
                <div className="space-y-3 max-h-75 overflow-y-auto">
                  {categoryBreakdown.map((item) => (
                    <div 
                      key={item.category}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: CATEGORY_COLORS[item.category] }}
                        ></div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {CATEGORY_LABELS[item.category] || item.category}
                          </div>
                          <div className="text-sm text-gray-600">
                            {item.count} {item.count === 1 ? 'activity' : 'activities'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">
                          {formatCurrency(item.amount)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {getPercentage(item.amount)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Wallet className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium">No expenses tracked</p>
                  <p className="text-sm mt-1">Activities with costs will appear here</p>
                </div>
              )}
            </div>
          </div>

          {/* Daily Breakdown (only shown for "all" view) */}
          {selectedDay === 'all' && (
            <div className="mt-6 bg-white border-2 border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Daily Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: tripDuration }, (_, i) => i + 1).map(day => {
                  const dayTotal = dailyTotals[day] || 0;
                  const isHighest = dayTotal === Math.max(...Object.values(dailyTotals));
                  
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                        isHighest && dayTotal > 0
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-sm font-medium text-gray-600 mb-1">Day {day}</div>
                      <div className={`text-xl font-bold ${
                        isHighest && dayTotal > 0 ? 'text-green-700' : 'text-gray-900'
                      }`}>
                        {formatCurrency(dayTotal)}
                      </div>
                      {isHighest && dayTotal > 0 && (
                        <div className="text-xs text-green-600 mt-1">Highest</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}