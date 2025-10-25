import type { POI } from '@/components/POICard'

const MOCK_POIS: POI[] = [
  {
    id: '1',
    name: 'Koshary El Tahrir',
    type: 'Egyptian Restaurant',
    icon: '🍲',
    coordinates: [31.2001, 29.9187],
    address: 'Tahrir Square, Cairo',
    rating: 4.5,
    priceLevel: '$',
    hours: 'Open until 11 PM',
    description: 'Traditional Egyptian koshary and local dishes',
  },
  {
    id: '2',
    name: 'Zooba',
    type: 'Modern Egyptian',
    icon: '🥙',
    coordinates: [31.22, 29.95],
    address: 'Zamalek, Cairo',
    rating: 4.7,
    priceLevel: '$$',
    hours: 'Open until 12 AM',
    description: 'Contemporary take on traditional Egyptian street food',
  },
  {
    id: '3',
    name: 'Abou Shakra',
    type: 'Grill Restaurant',
    icon: '🥩',
    coordinates: [31.21, 29.93],
    address: 'Garden City, Cairo',
    rating: 4.3,
    priceLevel: '$$',
    hours: 'Open until 1 AM',
    description: 'Famous for grilled meats and kebabs',
  },
  {
    id: '4',
    name: 'Felfela',
    type: 'Traditional Egyptian',
    icon: '🍛',
    coordinates: [31.23, 29.94],
    address: 'Downtown Cairo',
    rating: 4.4,
    priceLevel: '$',
    hours: 'Open until 10 PM',
    description: 'Authentic Egyptian cuisine in a traditional setting',
  },
  {
    id: '5',
    name: 'Cairo Kitchen',
    type: 'Cafe',
    icon: '☕',
    coordinates: [31.225, 29.955],
    address: 'Zamalek, Cairo',
    rating: 4.6,
    priceLevel: '$$',
    hours: 'Open until 11 PM',
    description: 'Cozy cafe with Egyptian and international dishes',
  },
  {
    id: '6',
    name: 'The Tap West',
    type: 'Bar & Grill',
    icon: '🍺',
    coordinates: [31.208, 29.928],
    address: 'Maadi, Cairo',
    rating: 4.5,
    priceLevel: '$$$',
    hours: 'Open until 2 AM',
    description: 'Sports bar with great food and drinks',
  },
  {
    id: '7',
    name: 'Kazoku',
    type: 'Japanese Restaurant',
    icon: '🍱',
    coordinates: [31.215, 29.935],
    address: 'Heliopolis, Cairo',
    rating: 4.8,
    priceLevel: '$$$',
    hours: 'Open until 11:30 PM',
    description: 'Authentic Japanese sushi and ramen',
  },
  {
    id: '8',
    name: "Lucille's",
    type: 'American Burger',
    icon: '🍔',
    coordinates: [31.205, 29.945],
    address: 'Mohandiseen, Cairo',
    rating: 4.6,
    priceLevel: '$$',
    hours: 'Open until 12 AM',
    description: 'Gourmet burgers and American comfort food',
  },
]

const normalizeQuery = (query: string) => query.trim().toLowerCase()

const delay = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(resolve, ms)

    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timeout)
        reject(new DOMException('Aborted', 'AbortError'))
      },
      { once: true }
    )
  })

export async function loadPOIs(query: string, signal?: AbortSignal): Promise<POI[]> {
  const normalized = normalizeQuery(query)

  // Simulate a small network delay so we can exercise request cancellation logic.
  await delay(250, signal)

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError')
  }

  if (!normalized) {
    return MOCK_POIS
  }

  return MOCK_POIS.filter((poi) => {
    const name = poi.name.toLowerCase()
    const type = poi.type.toLowerCase()
    const address = poi.address?.toLowerCase() ?? ''

    return (
      name.includes(normalized) ||
      type.includes(normalized) ||
      address.includes(normalized)
    )
  })
}

export { MOCK_POIS }
