// ============================================
// FILE: lib/tspOptimizer.ts
// TSP Algorithm for route optimization
// ============================================

interface Location {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
}

interface Activity {
  id: string;
  activity_name: string;
  latitude: number | null;
  longitude: number | null;
  order_index: number;
  day_number: number;
  [key: string]: any;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Create distance matrix for all locations
 */
function createDistanceMatrix(locations: Location[]): number[][] {
  const n = locations.length;
  const matrix: number[][] = Array(n)
    .fill(0)
    .map(() => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        matrix[i][j] = calculateDistance(
          locations[i].latitude,
          locations[i].longitude,
          locations[j].latitude,
          locations[j].longitude
        );
      }
    }
  }

  return matrix;
}

/**
 * Calculate total distance of a route
 */
function calculateRouteDistance(
  route: number[],
  distanceMatrix: number[][]
): number {
  let totalDistance = 0;
  
  for (let i = 0; i < route.length - 1; i++) {
    totalDistance += distanceMatrix[route[i]][route[i + 1]];
  }
  
  return totalDistance;
}

/**
 * Nearest Neighbor algorithm (fast, good approximation)
 * Time complexity: O(n²)
 */
function nearestNeighbor(
  distanceMatrix: number[][],
  startIndex: number = 0
): number[] {
  const n = distanceMatrix.length;
  const visited = new Array(n).fill(false);
  const route: number[] = [startIndex];
  visited[startIndex] = true;
  
  let current = startIndex;
  
  // Visit all cities
  for (let i = 1; i < n; i++) {
    let nearestCity = -1;
    let minDistance = Infinity;
    
    // Find nearest unvisited city
    for (let j = 0; j < n; j++) {
      if (!visited[j] && distanceMatrix[current][j] < minDistance) {
        minDistance = distanceMatrix[current][j];
        nearestCity = j;
      }
    }
    
    if (nearestCity !== -1) {
      route.push(nearestCity);
      visited[nearestCity] = true;
      current = nearestCity;
    }
  }
  
  // Return to start
  route.push(startIndex);
  
  return route;
}

/**
 * 2-opt optimization to improve route
 * This swaps edges to reduce crossings
 */
function twoOptImprovement(
  route: number[],
  distanceMatrix: number[][]
): number[] {
  let improved = true;
  let bestRoute = [...route];
  let bestDistance = calculateRouteDistance(bestRoute, distanceMatrix);
  
  // Iterate until no more improvements
  while (improved) {
    improved = false;
    
    // Try all possible 2-opt swaps (except first and last which are hotel)
    for (let i = 1; i < bestRoute.length - 2; i++) {
      for (let j = i + 1; j < bestRoute.length - 1; j++) {
        // Create new route by reversing segment between i and j
        const newRoute = [
          ...bestRoute.slice(0, i),
          ...bestRoute.slice(i, j + 1).reverse(),
          ...bestRoute.slice(j + 1)
        ];
        
        const newDistance = calculateRouteDistance(newRoute, distanceMatrix);
        
        if (newDistance < bestDistance) {
          bestRoute = newRoute;
          bestDistance = newDistance;
          improved = true;
        }
      }
    }
  }
  
  return bestRoute;
}

/**
 * Main TSP solver combining nearest neighbor + 2-opt
 */
export function solveTSP(locations: Location[]): {
  route: number[];
  distance: number;
  locations: Location[];
} {
  if (locations.length < 2) {
    return {
      route: [0],
      distance: 0,
      locations,
    };
  }

  // Create distance matrix
  const distanceMatrix = createDistanceMatrix(locations);
  
  // Get initial route using nearest neighbor
  let route = nearestNeighbor(distanceMatrix, 0);
  
  // Improve route using 2-opt
  route = twoOptImprovement(route, distanceMatrix);
  
  // Calculate final distance
  const distance = calculateRouteDistance(route, distanceMatrix);
  
  return {
    route,
    distance,
    locations,
  };
}

/**
 * Optimize activities for a single day
 * Hotel is the start and end point
 */
export async function optimizeDayRoute(
  activities: Activity[],
  hotelOrigin: {
    latitude: number;
    longitude: number;
    name: string;
  } | null
): Promise<Activity[]> {
  // Filter activities with coordinates
  const activitiesWithCoords = activities.filter(
    (a) => a.latitude !== null && a.longitude !== null
  );

  if (activitiesWithCoords.length === 0) {
    return activities; // No optimization needed
  }

  // If no hotel, just optimize activities
  if (!hotelOrigin) {
    const locations: Location[] = activitiesWithCoords.map((a) => ({
      id: a.id,
      latitude: a.latitude!,
      longitude: a.longitude!,
      name: a.activity_name,
    }));

    const { route } = solveTSP(locations);
    
    // Reorder activities based on optimized route
    const optimized = route.slice(0, -1).map((idx) => activitiesWithCoords[idx]);
    
    return optimized;
  }

  // With hotel: hotel at start and end
  const locations: Location[] = [
    {
      id: 'hotel',
      latitude: hotelOrigin.latitude,
      longitude: hotelOrigin.longitude,
      name: hotelOrigin.name,
    },
    ...activitiesWithCoords.map((a) => ({
      id: a.id,
      latitude: a.latitude!,
      longitude: a.longitude!,
      name: a.activity_name,
    })),
  ];

  const { route, distance } = solveTSP(locations);
  
  // Remove hotel from route (first and last), keep only activities
  const activityRoute = route.slice(1, -1);
  
  // Reorder activities based on optimized route
  const optimized = activityRoute.map((idx) => activitiesWithCoords[idx - 1]);
  
  console.log(`Optimized route - Total distance: ${distance.toFixed(2)} km`);
  
  return optimized;
}

/**
 * Optimize all days in a trip
 */
export async function optimizeEntireTrip(
  days: Array<{ dayNumber: number; activities: Activity[] }>,
  hotelOrigin: {
    latitude: number;
    longitude: number;
    name: string;
  } | null
): Promise<Map<number, Activity[]>> {
  const optimizedDays = new Map<number, Activity[]>();

  for (const day of days) {
    const optimized = await optimizeDayRoute(day.activities, hotelOrigin);
    optimizedDays.set(day.dayNumber, optimized);
  }

  return optimizedDays;
}