import { POI } from '@/components/POICard'

// Mock POI data pool - in a real implementation, this would come from backend
const mockPOIPool: POI[] = [
  {
    id: '1',
    name: 'Koshary El Tahrir',
    type: 'Egyptian Restaurant',
    icon: '🍲',
    coordinates: [31.2001, 29.9187],
    address: '15 Tahrir Square, Cairo',
    rating: 4.5,
    priceLevel: '$',
    hours: 'Open 24/7',
    description: 'Traditional Egyptian koshary with authentic flavors',
  },
  {
    id: '2',
    name: 'Pizza Italia',
    type: 'Pizza Restaurant',
    icon: '🍕',
    coordinates: [31.2021, 29.9197],
    address: '23 Mohamed Mahmoud St, Cairo',
    rating: 4.3,
    priceLevel: '$$',
    hours: '11:00 AM - 11:00 PM',
    description: 'Authentic Italian pizza with fresh ingredients',
  },
  {
    id: '3',
    name: 'Sushi Master',
    type: 'Japanese Restaurant',
    icon: '🍣',
    coordinates: [31.1991, 29.9177],
    address: '45 Talaat Harb St, Cairo',
    rating: 4.7,
    priceLevel: '$$$',
    hours: '12:00 PM - 10:00 PM',
    description: 'Premium sushi and Japanese cuisine',
  },
  {
    id: '4',
    name: 'Burger House',
    type: 'Burger Restaurant',
    icon: '🍔',
    coordinates: [31.2011, 29.9207],
    address: '8 Qasr El Nil St, Cairo',
    rating: 4.2,
    priceLevel: '$$',
    hours: '10:00 AM - 12:00 AM',
    description: 'Gourmet burgers and comfort food',
  },
  {
    id: '5',
    name: 'Cafe Supreme',
    type: 'Cafe',
    icon: '☕',
    coordinates: [31.1981, 29.9167],
    address: '12 Champollion St, Cairo',
    rating: 4.6,
    priceLevel: '$',
    hours: '7:00 AM - 11:00 PM',
    description: 'Specialty coffee and pastries',
  },
  {
    id: '6',
    name: 'Shawarma Paradise',
    type: 'Middle Eastern Restaurant',
    icon: '🌯',
    coordinates: [31.2031, 29.9217],
    address: '34 Sherif St, Cairo',
    rating: 4.4,
    priceLevel: '$',
    hours: '11:00 AM - 2:00 AM',
    description: 'Best shawarma in town',
  },
  {
    id: '7',
    name: 'Gelato Dreams',
    type: 'Ice Cream Shop',
    icon: '🍦',
    coordinates: [31.1971, 29.9157],
    address: '56 Adly St, Cairo',
    rating: 4.8,
    priceLevel: '$',
    hours: '12:00 PM - 12:00 AM',
    description: 'Artisanal gelato with unique flavors',
  },
  {
    id: '8',
    name: 'Taco Fiesta',
    type: 'Mexican Restaurant',
    icon: '🌮',
    coordinates: [31.2041, 29.9227],
    address: '19 Emad El Din St, Cairo',
    rating: 4.1,
    priceLevel: '$$',
    hours: '12:00 PM - 11:00 PM',
    description: 'Authentic Mexican tacos and more',
  },
  {
    id: '9',
    name: 'Pizza Corner',
    type: 'Pizza Restaurant',
    icon: '🍕',
    coordinates: [31.2051, 29.9237],
    address: '67 Ramses St, Cairo',
    rating: 4.0,
    priceLevel: '$',
    hours: '11:00 AM - 1:00 AM',
    description: 'Quick and delicious pizza slices',
  },
  {
    id: '10',
    name: 'Noodle Bar',
    type: 'Asian Restaurant',
    icon: '🍜',
    coordinates: [31.1961, 29.9147],
    address: '89 Bab El Louk St, Cairo',
    rating: 4.5,
    priceLevel: '$$',
    hours: '11:00 AM - 10:00 PM',
    description: 'Fresh noodles and Asian specialties',
  },
  {
    id: '11',
    name: 'Pizza Express',
    type: 'Pizza Restaurant',
    icon: '🍕',
    coordinates: [31.2061, 29.9247],
    address: '101 26th July St, Cairo',
    rating: 3.9,
    priceLevel: '$$',
    hours: '10:00 AM - 12:00 AM',
    description: 'Fast pizza delivery and dining',
  },
  {
    id: '12',
    name: 'Bakery Bliss',
    type: 'Bakery',
    icon: '🥖',
    coordinates: [31.1951, 29.9137],
    address: '23 Falaki St, Cairo',
    rating: 4.7,
    priceLevel: '$',
    hours: '6:00 AM - 9:00 PM',
    description: 'Fresh baked goods daily',
  },
]

export interface FetchPOIsParams {
  query: string
  userLocation?: {
    latitude: number
    longitude: number
  }
  radius?: number // in kilometers
}

/**
 * Mock backend API to fetch filtered POIs based on search query and user location
 * In a real implementation, this would make an HTTP request to the backend
 */
export async function fetchFilteredPOIs(
  params: FetchPOIsParams
): Promise<POI[]> {
  const { query, userLocation, radius = 5 } = params

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  // If no query, return all nearby POIs
  if (!query.trim()) {
    return filterByLocation(mockPOIPool, userLocation, radius)
  }

  // Filter POIs based on query
  const lowerQuery = query.toLowerCase()
  let filteredPOIs = mockPOIPool.filter((poi) => {
    // Check if query matches name, type, or description
    const matchesName = poi.name.toLowerCase().includes(lowerQuery)
    const matchesType = poi.type.toLowerCase().includes(lowerQuery)
    const matchesDescription = poi.description?.toLowerCase().includes(lowerQuery)

    // Special handling for common search patterns
    const matchesPizza =
      lowerQuery.includes('pizza') &&
      (poi.type.toLowerCase().includes('pizza') ||
        poi.name.toLowerCase().includes('pizza'))
    const matchesCoffee =
      (lowerQuery.includes('coffee') || lowerQuery.includes('cafe')) &&
      (poi.type.toLowerCase().includes('cafe') ||
        poi.name.toLowerCase().includes('cafe') ||
        poi.name.toLowerCase().includes('coffee'))
    const matchesRestaurant =
      lowerQuery.includes('restaurant') &&
      poi.type.toLowerCase().includes('restaurant')

    return (
      matchesName ||
      matchesType ||
      matchesDescription ||
      matchesPizza ||
      matchesCoffee ||
      matchesRestaurant
    )
  })

  // Filter by location if provided
  filteredPOIs = filterByLocation(filteredPOIs, userLocation, radius)

  return filteredPOIs
}

/**
 * Filter POIs by distance from user location
 */
function filterByLocation(
  pois: POI[],
  userLocation?: { latitude: number; longitude: number },
  radius: number = 5
): POI[] {
  if (!userLocation) {
    return pois
  }

  return pois.filter((poi) => {
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      poi.coordinates[1], // latitude
      poi.coordinates[0] // longitude
    )
    return distance <= radius
  })
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
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return distance
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}
