// ============================================
// API USAGE TRACKING & ALERT SYSTEM
// ============================================
// This tracks your Google Maps API usage and alerts you before exceeding limits

// lib/api-usage-tracker.ts

interface APIUsage {
  apiType: 'maps' | 'places' | 'distance_matrix' | 'geocoding';
  requests: number;
  estimatedCost: number;
  timestamp: string;
}

interface UsageSummary {
  totalCost: number;
  breakdown: {
    maps: number;
    places: number;
    distanceMatrix: number;
    geocoding: number;
  };
  percentage: number; // Percentage of $200 free tier
  isWarning: boolean; // Above 75%
  isDanger: boolean; // Above 90%
}

// API Pricing (per 1,000 requests/elements)
const API_COSTS = {
  maps: 7, // $7 per 1,000 map loads
  places: 17, // $17 per 1,000 place searches
  distance_matrix: 5, // $5 per 1,000 elements
  geocoding: 5, // $5 per 1,000 requests
};

const FREE_TIER_LIMIT = 200; // $200/month free credit

// ============================================
// 1. TRACK API USAGE
// ============================================

/**
 * Log an API call and calculate cost
 */
export function trackAPIUsage(
  apiType: APIUsage['apiType'],
  count: number = 1
): void {
  const cost = calculateCost(apiType, count);
  
  const usage: APIUsage = {
    apiType,
    requests: count,
    estimatedCost: cost,
    timestamp: new Date().toISOString(),
  };

  // Store in localStorage (for development)
  // In production, send to your backend/database
  const existingUsage = getStoredUsage();
  existingUsage.push(usage);
  localStorage.setItem('api_usage', JSON.stringify(existingUsage));

  // Check if alert needed
  checkAndAlert();
}

/**
 * Calculate cost for API usage
 */
function calculateCost(apiType: APIUsage['apiType'], count: number): number {
  const costPer1000 = API_COSTS[apiType];
  return (count / 1000) * costPer1000;
}

// ============================================
// 2. GET USAGE SUMMARY
// ============================================

/**
 * Get current month's usage summary
 */
export function getUsageSummary(): UsageSummary {
  const usage = getStoredUsage();
  const currentMonth = getCurrentMonthUsage(usage);

  const breakdown = {
    maps: calculateTypeCost(currentMonth, 'maps'),
    places: calculateTypeCost(currentMonth, 'places'),
    distanceMatrix: calculateTypeCost(currentMonth, 'distance_matrix'),
    geocoding: calculateTypeCost(currentMonth, 'geocoding'),
  };

  const totalCost = Object.values(breakdown).reduce((sum, cost) => sum + cost, 0);
  const percentage = (totalCost / FREE_TIER_LIMIT) * 100;

  return {
    totalCost,
    breakdown,
    percentage,
    isWarning: percentage >= 75,
    isDanger: percentage >= 90,
  };
}

/**
 * Get usage for current month only
 */
function getCurrentMonthUsage(usage: APIUsage[]): APIUsage[] {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return usage.filter((u) => {
    const date = new Date(u.timestamp);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
}

/**
 * Calculate total cost for specific API type
 */
function calculateTypeCost(usage: APIUsage[], type: APIUsage['apiType']): number {
  return usage
    .filter((u) => u.apiType === type)
    .reduce((sum, u) => sum + u.estimatedCost, 0);
}

// ============================================
// 3. ALERT SYSTEM
// ============================================

/**
 * Check usage and show alerts if needed
 */
function checkAndAlert(): void {
  const summary = getUsageSummary();

  if (summary.isDanger) {
    showAlert('danger', summary);
  } else if (summary.isWarning) {
    showAlert('warning', summary);
  }
}

/**
 * Show alert to user
 */
function showAlert(level: 'warning' | 'danger', summary: UsageSummary): void {
  const message =
    level === 'danger'
      ? `⚠️ CRITICAL: You've used ${summary.percentage.toFixed(1)}% of your free Google Maps API tier ($${summary.totalCost.toFixed(2)}/$${FREE_TIER_LIMIT}). You're approaching the limit!`
      : `⚡ Warning: You've used ${summary.percentage.toFixed(1)}% of your free Google Maps API tier ($${summary.totalCost.toFixed(2)}/$${FREE_TIER_LIMIT}).`;

  console.warn(message);

  // Show browser notification (if permitted)
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Itineryo API Usage Alert', {
      body: message,
      icon: '/favicon.ico',
    });
  }

  // You can also trigger a UI toast/modal here
}

// ============================================
// 4. UTILITY FUNCTIONS
// ============================================

function getStoredUsage(): APIUsage[] {
  const stored = localStorage.getItem('api_usage');
  return stored ? JSON.parse(stored) : [];
}

/**
 * Reset usage data (for testing or new month)
 */
export function resetUsageData(): void {
  localStorage.removeItem('api_usage');
  console.log('✅ API usage data reset');
}

/**
 * Export usage data as JSON (for records)
 */
export function exportUsageData(): string {
  const usage = getStoredUsage();
  return JSON.stringify(usage, null, 2);
}

// ============================================
// 5. USAGE IN YOUR APP
// ============================================

/**
 * Example: Track map load
 */
export function trackMapLoad(): void {
  trackAPIUsage('maps', 1);
}

/**
 * Example: Track place search
 */
export function trackPlaceSearch(resultCount: number = 1): void {
  trackAPIUsage('places', resultCount);
}

/**
 * Example: Track distance matrix calculation
 */
export function trackDistanceMatrix(elementCount: number): void {
  // Element count = origins × destinations
  // E.g., 5 origins × 5 destinations = 25 elements
  trackAPIUsage('distance_matrix', elementCount);
}

/**
 * Example: Track geocoding request
 */
export function trackGeocoding(): void {
  trackAPIUsage('geocoding', 1);
}

// ============================================
// 6. REACT COMPONENT FOR DASHBOARD
// ============================================

/**
 * Usage Dashboard Component (add to your app)
 */
export function UsageDashboard() {
  const summary = getUsageSummary();

  return `
    <div style="padding: 16px; background: ${summary.isDanger ? '#fee' : summary.isWarning ? '#ffeaa7' : '#f0f0f0'}; border-radius: 8px; margin: 16px;">
      <h3>API Usage This Month</h3>
      <p style="font-size: 24px; font-weight: bold; color: ${summary.isDanger ? '#d63031' : summary.isWarning ? '#fdcb6e' : '#2d3436'};">
        $${summary.totalCost.toFixed(2)} / $${FREE_TIER_LIMIT}
      </p>
      <div style="background: #ddd; height: 20px; border-radius: 10px; overflow: hidden; margin: 8px 0;">
        <div style="background: ${summary.isDanger ? '#d63031' : summary.isWarning ? '#fdcb6e' : '#00b894'}; height: 100%; width: ${summary.percentage}%; transition: width 0.3s;"></div>
      </div>
      <p>${summary.percentage.toFixed(1)}% of free tier used</p>
      
      <details style="margin-top: 12px;">
        <summary style="cursor: pointer; font-weight: bold;">View Breakdown</summary>
        <ul style="margin-top: 8px;">
          <li>Maps: $${summary.breakdown.maps.toFixed(2)}</li>
          <li>Places: $${summary.breakdown.places.toFixed(2)}</li>
          <li>Distance Matrix: $${summary.breakdown.distanceMatrix.toFixed(2)}</li>
          <li>Geocoding: $${summary.breakdown.geocoding.toFixed(2)}</li>
        </ul>
      </details>
    </div>
  `;
}

// ============================================
// 7. MIDDLEWARE FOR NEXT.JS API ROUTES
// ============================================

/**
 * Middleware to track API usage automatically
 * Add this to your Next.js API routes
 */
export function withAPITracking(
  handler: any,
  apiType: APIUsage['apiType'],
  getCount?: (req: any) => number
) {
  return async (req: any, res: any) => {
    // Execute the API call
    const result = await handler(req, res);

    // Track usage
    const count = getCount ? getCount(req) : 1;
    trackAPIUsage(apiType, count);

    return result;
  };
}

// ============================================
// 8. SETUP INSTRUCTIONS
// ============================================

/*
SETUP INSTRUCTIONS:

1. ADD THIS FILE to your project:
   /lib/api-usage-tracker.ts

2. IMPORT in your API wrapper:
   import { trackMapLoad, trackPlaceSearch, trackDistanceMatrix } from '@/lib/api-usage-tracker';

3. TRACK USAGE after each API call:
   
   // Example: Google Maps component
   useEffect(() => {
     trackMapLoad();
   }, []);

   // Example: Place search
   const searchPlaces = async (query: string) => {
     const results = await googlePlacesAPI.search(query);
     trackPlaceSearch(results.length);
     return results;
   };

   // Example: Route optimization
   const optimizeRoute = async (activities: Activity[]) => {
     const elementCount = activities.length * activities.length;
     trackDistanceMatrix(elementCount);
     // ... rest of optimization
   };

4. ADD DASHBOARD to your app:
   import { UsageDashboard, getUsageSummary } from '@/lib/api-usage-tracker';
   
   // In your settings/dashboard page
   <UsageDashboard />

5. REQUEST NOTIFICATION PERMISSION:
   // Add to your app initialization
   if ('Notification' in window && Notification.permission === 'default') {
     Notification.requestPermission();
   }

6. MONITOR REGULARLY:
   - Check usage dashboard weekly
   - Export data monthly: exportUsageData()
   - Set reminders at 75%, 90%, 100%

7. PRODUCTION SETUP:
   Instead of localStorage, send usage to your database:
   
   // In Supabase:
   CREATE TABLE api_usage (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     api_type VARCHAR(50) NOT NULL,
     requests INTEGER NOT NULL,
     estimated_cost DECIMAL(10,2) NOT NULL,
     timestamp TIMESTAMP DEFAULT NOW()
   );

   // Then modify trackAPIUsage() to save to Supabase instead
*/