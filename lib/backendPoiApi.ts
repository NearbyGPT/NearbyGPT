import { POI } from '@/components/POICard'

export interface BackendPOI {
  id: string
  name: string
  type: string
  location: {
    latitude: number
    longitude: number
    address: string
    city: string
    state: string
    zip_code: string
  }
  quick_info: string
}

export interface BackendPOIResponse {
  results: BackendPOI[]
  count: number
}

/**
 * Map business type to emoji icon
 */
const getIconForType = (type: string): string => {
  const typeMap: Record<string, string> = {
    restaurant: '🍽️',
    cafe: '☕',
    bar: '🍺',
    bakery: '🥖',
    'coffee shop': '☕',
    pizza: '🍕',
    burger: '🍔',
    sushi: '🍣',
    chinese: '🥡',
    japanese: '🍱',
    italian: '🍝',
    mexican: '🌮',
    indian: '🍛',
    thai: '🍜',
    vietnamese: '🍜',
    korean: '🍲',
    american: '🍔',
    'fast food': '🍟',
    dessert: '🍰',
    'ice cream': '🍦',
    grocery: '🛒',
    market: '🏪',
    convenience: '🏪',
    pharmacy: '💊',
    hospital: '🏥',
    clinic: '🏥',
    gym: '💪',
    hotel: '🏨',
    bank: '🏦',
    atm: '💰',
    gas: '⛽',
    parking: '🅿️',
    store: '🏪',
    mall: '🛍️',
    shop: '🛍️',
  }

  const lowerType = type.toLowerCase()

  // Try exact match first
  if (typeMap[lowerType]) {
    return typeMap[lowerType]
  }

  // Try partial match
  for (const [key, icon] of Object.entries(typeMap)) {
    if (lowerType.includes(key)) {
      return icon
    }
  }

  // Default icon
  return '📍'
}

/**
 * Transform backend POI to frontend POI format
 */
const transformBackendPOI = (backendPOI: BackendPOI): POI => {
  return {
    id: backendPOI.id,
    name: backendPOI.name,
    type: backendPOI.type,
    icon: getIconForType(backendPOI.type),
    coordinates: [backendPOI.location.longitude, backendPOI.location.latitude],
    address: `${backendPOI.location.address}, ${backendPOI.location.city}, ${backendPOI.location.state}`,
    priceLevel: backendPOI.quick_info || undefined,
  }
}

/**
 * Fetch POIs from backend API
 */
export async function fetchPOIsFromBackend(limit: number = 500): Promise<POI[]> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL

  if (!backendUrl) {
    console.error('NEXT_PUBLIC_BACKEND_API_URL is not defined')
    return []
  }

  try {
    const url = `${backendUrl}/api/businesses/pois?limit=${limit}`
    console.log('Fetching POIs from:', url)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Don't cache to get fresh data
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: BackendPOIResponse = await response.json()
    console.log(`Fetched ${data.count} POIs from backend`)

    return data.results.map(transformBackendPOI)
  } catch (error) {
    console.error('Error fetching POIs from backend:', error)
    return []
  }
}

/**
 * Filter POIs by search query
 */
export function filterPOIsByQuery(pois: POI[], query: string): POI[] {
  if (!query.trim()) {
    return pois
  }

  const lowerQuery = query.toLowerCase()

  return pois.filter((poi) => {
    const matchesName = poi.name.toLowerCase().includes(lowerQuery)
    const matchesType = poi.type.toLowerCase().includes(lowerQuery)
    const matchesAddress = (poi.address ?? '').toLowerCase().includes(lowerQuery)

    return matchesName || matchesType || matchesAddress
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

/**
 * Filter POIs by distance from user location
 */
export function filterPOIsByLocation(
  pois: POI[],
  userLocation: { latitude: number; longitude: number },
  radius: number = 10
): POI[] {
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
