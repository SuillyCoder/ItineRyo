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
  tripDuration: number;
  onClose: () => void;
}

interface CategoryBreakdown {
  category: string;
  amount: number;
  count: number;
}

// Category colors matching Japanese aesthetic
const CATEGORY_COLORS: Record<string, string> = {
  dining: '#D64820',
  shopping: '#BF2809',
  attractions: '#A855F7',
  transportation: '#7D7463',
  accommodation: '#059669',
  parks: '#10B981',
  entertainment: '#6366F1',
  other: '#C8B8A5',
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
    const filteredActivities = selectedDay === 'all' 
      ? activities 
      : activities.filter(a => a.day_number === selectedDay);

    const total = filteredActivities.reduce((sum, activity) => {
      return sum + (activity.estimated_cost || 0);
    }, 0);
    setTotalCost(total);

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
    <div 
      className="fixed inset-0 flex items-center justify-center p-4 z-50 transition-all duration-300" 
      style={{ backgroundColor: 'rgba(44, 36, 22, 0.7)' }}
      onClick={onClose}
    >
      <div 
        className="bg-linear-to-br from-[#D5D0C0] to-[#C8B8A5] rounded-3xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Japanese-inspired design */}
        <div className="bg-linear-to-r from-[#6B8E6F] via-[#8BA888] to-[#6B8E6F] p-6 text-white relative overflow-hidden">
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center relative" style={{ backgroundColor: '#466149' }}>
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold tracking-wide">Budget Management</h2>
                  <p className="text-green-50 text-sm mt-1">Track your expenses and spending</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-all duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Day Selector Pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedDay('all')}
                className={`px-5 py-2.5 rounded-full font-medium whitespace-nowrap transition-all duration-200 ${
                  selectedDay === 'all'
                    ? 'bg-white text-[#059669] shadow-lg scale-105'
                    : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30 backdrop-blur-sm'
                }`}
              >
                Entire Trip
              </button>
              {Array.from({ length: tripDuration }, (_, i) => i + 1).map(day => (
                <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`px-5 py-2.5 rounded-full font-medium whitespace-nowrap transition-all duration-200 ${
                      selectedDay === day
                        ? 'bg-white text-[#059669] shadow-lg scale-105'
                        : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30 backdrop-blur-sm'
                    }`}
                  >
                    Day {day}
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* Content with beige/cream background */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#D5D0C0]">
          {/* Summary Cards with softer colors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white bg-opacity-90 backdrop-blur-sm p-6 rounded-2xl border-2 border-[#10B981] border-opacity-30 shadow-lg hover:shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#059669] font-semibold text-sm uppercase tracking-wide">Total Budget</span>
                <div className="bg-[#10B981] bg-opacity-10 p-2 rounded-lg">
                  <DollarSign className="w-5 h-5 text-[#059669]" />
                </div>
              </div>
              <div className="text-4xl font-bold text-[#059669] mb-1">
                {formatCurrency(totalCost)}
              </div>
              <p className="text-sm text-[#7D7463]">
                {selectedDay === 'all' ? 'For entire trip' : `For Day ${selectedDay}`}
              </p>
            </div>

            <div className="bg-white bg-opacity-90 backdrop-blur-sm p-6 rounded-2xl border-2 border-[#10B981] border-opacity-30 shadow-lg hover:shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#059669] font-semibold text-sm uppercase tracking-wide">Avg per Day</span>
                <div className="bg-[#10B981] bg-opacity-10 p-2 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-[#059669]" />
                </div>
              </div>
              <div className="text-4xl font-bold text-[#059669] mb-1">
                {formatCurrency(selectedDay === 'all' ? averageDailySpend : totalCost)}
              </div>
              <p className="text-sm text-[#7D7463]">
                {selectedDay === 'all' ? 'Across all days' : 'This day only'}
              </p>
            </div>

            <div className="bg-white bg-opacity-90 backdrop-blur-sm p-6 rounded-2xl border-2 border-[#10B981] border-opacity-30 shadow-lg hover:shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#059669] font-semibold text-sm uppercase tracking-wide">Activities</span>
                <div className="bg-[#10B981] bg-opacity-10 p-2 rounded-lg">
                  <Calendar className="w-5 h-5 text-[#059669]" />
                </div>
              </div>
              <div className="text-4xl font-bold text-[#059669] mb-1">
                {selectedDay === 'all' 
                  ? activities.filter(a => (a.estimated_cost || 0) > 0).length 
                  : activities.filter(a => a.day_number === selectedDay && (a.estimated_cost || 0) > 0).length
                }
              </div>
              <p className="text-sm text-[#7D7463]">
                With expenses
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#C8B8A5] border-opacity-30">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-[#10B981] bg-opacity-10 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-[#059669]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-[#7D7463]">Spending by Category</h3>
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
                          fill={CATEGORY_COLORS[entry.category] || '#C8B8A5'} 
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
                <div className="h-[300px] flex items-center justify-center text-[#7D7463]">
                  <div className="text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 text-[#C8B8A5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#C8B8A5] border-opacity-30">
              <h3 className="text-lg font-bold text-[#7D7463] mb-4">Category Details</h3>
              
              {categoryBreakdown.length > 0 ? (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {categoryBreakdown.map((item) => (
                    <div 
                      key={item.category}
                      className="flex items-center justify-between p-4 bg-[#D5D0C0] bg-opacity-50 rounded-xl hover:bg-opacity-70 transition-all duration-200 border border-[#C8B8A5] border-opacity-20"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full shadow-sm"
                          style={{ backgroundColor: CATEGORY_COLORS[item.category] }}
                        ></div>
                        <div>
                          <div className="font-semibold text-[#7D7463]">
                            {CATEGORY_LABELS[item.category] || item.category}
                          </div>
                          <div className="text-sm text-[#7D7463] opacity-70">
                            {item.count} {item.count === 1 ? 'activity' : 'activities'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-[#059669]">
                          {formatCurrency(item.amount)}
                        </div>
                        <div className="text-sm text-[#7D7463] opacity-70">
                          {getPercentage(item.amount)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-[#7D7463]">
                  <Wallet className="w-16 h-16 mx-auto mb-4 text-[#C8B8A5]" />
                  <p className="font-medium">No expenses tracked</p>
                  <p className="text-sm mt-1">Activities with costs will appear here</p>
                </div>
              )}
            </div>
          </div>

          {/* Daily Breakdown */}
          {selectedDay === 'all' && (
            <div className="mt-6 bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#C8B8A5] border-opacity-30">
              <h3 className="text-lg font-bold text-[#7D7463] mb-4">Daily Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: tripDuration }, (_, i) => i + 1).map(day => {
                  const dayTotal = dailyTotals[day] || 0;
                  const isHighest = dayTotal === Math.max(...Object.values(dailyTotals));
                  
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                        isHighest && dayTotal > 0
                          ? 'border-[#10B981] bg-[#10B981] bg-opacity-10 shadow-lg'
                          : 'border-[#C8B8A5] border-opacity-30 bg-[#D5D0C0] bg-opacity-30 hover:border-[#10B981] hover:border-opacity-50'
                      }`}
                    >
                      <div className="text-sm font-medium text-[#7D7463] mb-1">Day {day}</div>
                      <div className={`text-xl font-bold ${
                        isHighest && dayTotal > 0 ? 'text-[#059669]' : 'text-[#7D7463]'
                      }`}>
                        {formatCurrency(dayTotal)}
                      </div>
                      {isHighest && dayTotal > 0 && (
                        <div className="text-xs text-[#059669] mt-1 font-medium">Highest</div>
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