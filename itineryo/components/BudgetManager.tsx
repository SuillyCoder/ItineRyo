// ============================================
// FILE: components/BudgetManager.tsx
// Budget tracking with pie charts and daily/trip totals
// ============================================
'use client';

import React, { useState, useEffect } from 'react';
import { X, Wallet, TrendingUp, DollarSign, Calendar, Download } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid} from 'recharts';

interface Activity {
  id: string;
  activity_name: string;
  category: string;
  estimated_cost: number | null;
  cost_per_head: number | null;
  prepaid_peso: number | null;
  extended_cost: number | null;
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
  dining: '#44624a',
  shopping: '#8ba888',
  attractions: '#c0cfb2',
  transportation: '#bdbf65',
  accommodation: '#6d8e32',
  parks: '#74A662',
  entertainment: '#9EB06A',
  other: '#74A12E',
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
  const [shoppingCashAllowance, setShoppingCashAllowance] = useState<number>(0);
  const [yenToPesoRate, setYenToPesoRate] = useState<number>(2.5); // Default rate, user can modify
  const [showRateModal, setShowRateModal] = useState(false);

  useEffect(() => {
    calculateBudget();
  }, [activities, selectedDay]);

const calculateBudget = () => {
  const filteredActivities = selectedDay === 'all' 
    ? activities 
    : activities.filter(a => a.day_number === selectedDay);

  // Calculate total from both simple mode (estimated_cost) and advanced mode (extended_cost)
  const total = filteredActivities.reduce((sum, activity) => {
    const simpleCost = activity.estimated_cost || 0;
    const extendedCost = activity.extended_cost || 0;
    // Use extended_cost if available, otherwise use estimated_cost
    const activityCost = extendedCost > 0 ? extendedCost : simpleCost;
    return sum + activityCost;
  }, 0);
  
  // Add shopping cash allowance to total
  const totalWithShopping = total + shoppingCashAllowance;
  setTotalCost(totalWithShopping);

  const categoryMap: Record<string, CategoryBreakdown> = {};
  
  filteredActivities.forEach(activity => {
    const simpleCost = activity.estimated_cost || 0;
    const extendedCost = activity.extended_cost || 0;
    const cost = extendedCost > 0 ? extendedCost : simpleCost;
    
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

  // Add shopping allowance as a category if it exists
  if (shoppingCashAllowance > 0) {
    if (!categoryMap['shopping']) {
      categoryMap['shopping'] = {
        category: 'shopping',
        amount: 0,
        count: 0,
      };
    }
    categoryMap['shopping'].amount += shoppingCashAllowance;
  }

  const breakdown = Object.values(categoryMap).sort((a, b) => b.amount - a.amount);
  setCategoryBreakdown(breakdown);
};

  const getDailyTotals = () => {
  const dailyTotals: Record<number, number> = {};
  
  activities.forEach(activity => {
    if (!dailyTotals[activity.day_number]) {
      dailyTotals[activity.day_number] = 0;
    }
    const simpleCost = activity.estimated_cost || 0;
    const extendedCost = activity.extended_cost || 0;
    const activityCost = extendedCost > 0 ? extendedCost : simpleCost;
    dailyTotals[activity.day_number] += activityCost;
  });

  return dailyTotals;
};

const getTotalPrepaidPeso = () => {
  return activities.reduce((sum, activity) => {
    return sum + (activity.prepaid_peso || 0);
  }, 0);
};

const getDailyChartData = () => {
  const dailyTotals = getDailyTotals();
  return Array.from({ length: tripDuration }, (_, i) => i + 1).map(day => ({
    day: `Day ${day}`,
    spending: dailyTotals[day] || 0
  }));
};

const handleExportPDF = async () => {
  const element = document.getElementById('budget-content');
  if (!element) return;

  try {
    // Using html2canvas and jsPDF
    const html2canvas = (await import('html2canvas')).default;
    const jsPDF = (await import('jspdf')).default;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`budget-report-${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    alert('Failed to export PDF. Please try again.');
  }
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
                        : 'bg-white bg-opacity-20 text-[#059669] hover:bg-opacity-30 backdrop-blur-sm'
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
      <span className="text-[#059669] font-semibold text-sm uppercase tracking-wide">Prepaid (Peso)</span>
      <button 
        onClick={() => setShowRateModal(true)}
        className="bg-[#10B981] bg-opacity-10 p-2 rounded-lg hover:bg-opacity-20 transition-all"
      >
        <TrendingUp className="w-5 h-5 text-[#059669]" />
      </button>
    </div>
    <div className="text-4xl font-bold text-[#059669] mb-1">
      ₱{getTotalPrepaidPeso().toLocaleString()}
    </div>
    <p className="text-sm text-[#7D7463]">
      ≈ {formatCurrency(getTotalPrepaidPeso() / yenToPesoRate)} at ¥1 = ₱{yenToPesoRate}
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
        ? activities.filter(a => (a.estimated_cost || 0) > 0 || (a.extended_cost || 0) > 0).length 
        : activities.filter(a => a.day_number === selectedDay && ((a.estimated_cost || 0) > 0 || (a.extended_cost || 0) > 0)).length
      }
    </div>
    <p className="text-sm text-[#7D7463]">
      With expenses
    </p>
  </div>
</div>

{/* Shopping Cash Allowance Input */}
<div className="mb-6 bg-white bg-opacity-90 backdrop-blur-sm p-6 rounded-2xl border-2 border-[#10B981] border-opacity-30 shadow-lg">
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-3">
      <div className="bg-[#10B981] bg-opacity-10 p-2 rounded-lg">
        <Wallet className="w-5 h-5 text-white" />
      </div>
      <h3 className="text-lg font-bold text-[#7D7463]">Shopping Cash Allowance</h3>
    </div>
    <button
      onClick={handleExportPDF}
      className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:shadow-md bg-[#059669] text-white"
    >
      <Download className="w-4 h-4" />
      <span className="hidden sm:inline">Export PDF</span>
    </button>
  </div>
  <div className="flex gap-4 items-end">
    <div className="flex-1">
      <label className="block text-sm font-medium text-[#7D7463] mb-2">
        Set aside budget for shopping
      </label>
      <input
        type="number"
        min="0"
        step="1000"
        value={shoppingCashAllowance || ''}
        onChange={(e) => setShoppingCashAllowance(parseFloat(e.target.value) || 0)}
        placeholder="Enter amount in ¥"
        className="w-full px-4 py-3 rounded-lg border-2 border-[#C8B8A5] border-opacity-30 focus:border-[#BF2809] focus:outline-none transition-all"
        style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
      />
    </div>
    <div className="text-right">
      <div className="text-sm text-[#7D7463] mb-1">Current Total</div>
      <div className="text-2xl font-bold text-[#059669]">
        {formatCurrency(shoppingCashAllowance)}
      </div>
    </div>
  </div>
</div>

          <div className="grid grid-cols-1 gap-6" id="budget-content">
  {/* Daily Spending Timeline - Only show for "all" view */}
  {selectedDay === 'all' && (
    <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#C8B8A5] border-opacity-30">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-[#10B981] bg-opacity-10 p-2 rounded-lg">
          <TrendingUp className="w-5 h-5 text-[#059669]" />
        </div>
        <h3 className="text-lg font-bold text-[#7D7463]">Daily Spending Timeline</h3>
      </div>
      
      {activities.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={getDailyChartData()}>
            <CartesianGrid strokeDasharray="3 3" stroke="#C8B8A5" opacity={0.3} />
            <XAxis 
              dataKey="day" 
              stroke="#7D7463"
              style={{ fontSize: '12px', fontFamily: "'Noto Sans JP', sans-serif" }}
            />
            <YAxis 
              stroke="#7D7463"
              style={{ fontSize: '12px', fontFamily: "'Noto Sans JP', sans-serif" }}
              tickFormatter={(value) => `¥${value.toLocaleString()}`}
            />
            <Tooltip
              formatter={(value: any) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: '#D5D0C0',
                border: '1px solid #C8B8A5',
                borderRadius: '8px',
                fontFamily: "'Noto Sans JP', sans-serif"
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="spending" 
              stroke="#059669" 
              strokeWidth={3}
              dot={{ fill: '#059669', strokeWidth: 2, r: 5 }}
              activeDot={{ r: 7 }}
              name="Daily Spending"
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[300px] flex items-center justify-center text-[#7D7463]">
          <div className="text-center">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 text-[#C8B8A5]" />
            <p className="font-medium">No spending data</p>
            <p className="text-sm mt-1">Add costs to activities to see timeline</p>
          </div>
        </div>
      )}
    </div>
  )}

  {/* Pie Chart - Keep for both views */}
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {/* Category List */}
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
      </div>
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
                      <div className={`text-sm font-medium text-[#7D7463] mb-1 ${
                        isHighest && dayTotal > 0 ? 'text-white' : 'text-[#7D7463]'
                      }`}>
                        Day {day}
                        </div>
                      <div className={`text-xl font-bold ${
                        isHighest && dayTotal > 0 ? 'text-white' : 'text-[#7D7463]'
                      }`}>
                        {formatCurrency(dayTotal)}
                      </div>
                      {isHighest && dayTotal > 0 && (
                        <div className="text-xs text-white mt-1 font-medium">Highest</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {/* Exchange Rate Modal */}
{showRateModal && (
  <div 
    className="fixed inset-0 flex items-center justify-center p-4 z-[60]" 
    style={{ backgroundColor: 'rgba(44, 36, 22, 0.7)' }}
    onClick={() => setShowRateModal(false)}
  >
    <div 
      className="bg-[#D5D0C0] rounded-2xl shadow-2xl max-w-md w-full p-6"
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className="text-xl font-bold text-[#7D7463] mb-4">Set Exchange Rate</h3>
      <div className="mb-4">
        <label className="block text-sm font-medium text-[#7D7463] mb-2">
          Yen to Peso Rate (¥1 = ₱?)
        </label>
        <input
          type="number"
          min="0"
          step="0.1"
          value={yenToPesoRate}
          onChange={(e) => setYenToPesoRate(parseFloat(e.target.value) || 0)}
          className="w-full px-4 py-3 rounded-lg border-2 border-[#C8B8A5] border-opacity-30 focus:border-[#059669] focus:outline-none"
          style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
        />
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => setShowRateModal(false)}
          className="flex-1 py-3 rounded-lg border-2 border-[#7D7463] text-[#7D7463] hover:bg-[#7D7463] hover:text-white transition-all"
        >
          Cancel
        </button>
        <button
          onClick={() => setShowRateModal(false)}
          className="flex-1 py-3 rounded-lg bg-[#059669] text-white hover:shadow-lg transition-all"
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}
        </div>
      </div>
    </div>
  );
}