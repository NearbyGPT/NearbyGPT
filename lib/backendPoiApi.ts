import { POI } from '@/components/POICard'

export interface BackendPOI {
  id: string
  name?: string
  display_name?: string
  business_name?: string
  title?: string
  type: string
  location: {
    latitude: number | string
    longitude: number | string
    address: string
    city: string
    state: string
    zip_code: string
  }
  quick_info?: string | null
}

export interface BackendPOIResponse {
  results: BackendPOI[]
  count: number
}

export interface ChatBusinessFound {
  id: string
  name: string
  type: string
  location: {
    latitude: number
    longitude: number
    address: string
    city: string
  }
  rating?: number | null
  quick_info?: string
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
const sanitizeNameCandidate = (value?: string | null) => {
  if (!value) return null

  const trimmed = value.trim()
  if (!trimmed) return null

  const lowered = trimmed.toLowerCase()
  if (lowered === 'null' || lowered === 'undefined') return null

  return trimmed
}

const transformBackendPOI = (backendPOI: BackendPOI): POI => {
  const { name, display_name, business_name, title, type, location, quick_info } = backendPOI

  const typeName = sanitizeNameCandidate(type)?.toLowerCase()

  const nameCandidates = [
    sanitizeNameCandidate(name),
    sanitizeNameCandidate(business_name),
    sanitizeNameCandidate(title),
    sanitizeNameCandidate(display_name),
  ].filter((candidate): candidate is string => Boolean(candidate))

  const resolvedName =
    nameCandidates.find((candidate) => candidate.toLowerCase() !== typeName) ||
    sanitizeNameCandidate(location.address) ||
    'Unknown location'

  const latitude = typeof location.latitude === 'string' ? Number(location.latitude) : location.latitude
  const longitude = typeof location.longitude === 'string' ? Number(location.longitude) : location.longitude

  return {
    id: backendPOI.id,
    name: resolvedName,
    type,
    icon: getIconForType(type),
    coordinates: [longitude, latitude], // GeoJSON format: [longitude, latitude]
    address: `${location.address}, ${location.city}, ${location.state}`,
    priceLevel: quick_info?.trim() || undefined,
  }
}

/**
 * Transform chat businesses_found to frontend POI format
 */
export const transformChatBusinessToPOI = (business: ChatBusinessFound): POI => {
  const { id, name, type, location, rating, quick_info } = business

  const latitude = location.latitude
  const longitude = location.longitude

  return {
    id,
    name,
    type,
    icon: getIconForType(type),
    coordinates: [longitude, latitude], // GeoJSON format: [longitude, latitude]
    address: `${location.address}, ${location.city}`,
    rating: rating ?? undefined,
    priceLevel: quick_info?.trim() || undefined,
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

    return data.results
      .map(transformBackendPOI)
      .filter((poi) => Number.isFinite(poi.coordinates[0]) && Number.isFinite(poi.coordinates[1]))
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
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

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
