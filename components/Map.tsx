'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import mapboxgl, { GeoJSONSource } from 'mapbox-gl'
import { useRouter } from 'next/navigation'
import MapSearchBar from './MapSearchBar'
import POICard, { POI } from './POICard'
import useGeneralStore from '@/store/generalStore'
import { fetchFilteredPOIs } from '@/lib/poiApi'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN as string

// ---- Mock POI data with icons ----
const mockPOIs: POI[] = [
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
    name: 'Lucille\'s',
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

const getEmojiImageId = (emoji: string) =>
  `emoji-${
    Array.from(emoji)
      .map((char) => char.codePointAt(0)?.toString(16))
      .filter(Boolean)
      .join('-')
  }`

const createEmojiImage = (emoji: string) => {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')

  if (!context) return null

  context.clearRect(0, 0, size, size)
  context.font = `${size * 0.75}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(emoji, size / 2, size / 2)

  return {
    imageData: context.getImageData(0, 0, size, size),
    pixelRatio: 2,
  }
}

const ensureEmojiImages = (map: mapboxgl.Map, pois: POI[]) => {
  pois.forEach((poi) => {
    const iconId = getEmojiImageId(poi.icon)

    if (!map.hasImage(iconId)) {
      const emojiImage = createEmojiImage(poi.icon)

      if (emojiImage) {
        map.addImage(iconId, emojiImage.imageData, {
          pixelRatio: emojiImage.pixelRatio,
        })
      }
    }
  })
}

export default function Map() {
  const router = useRouter()
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)

  const selectedPOI = useGeneralStore((s) => s.selectedPOI)
  const setSelectedPOI = useGeneralStore((s) => s.setSelectedPOI)
  const searchQuery = useGeneralStore((s) => s.searchQuery)
  const setSearchQuery = useGeneralStore((s) => s.setSearchQuery)
  const setFlyToLocation = useGeneralStore((s) => s.setFlyToLocation)
  const userLocation = useGeneralStore((s) => s.userLocation)

  const [pois, setPois] = useState<POI[]>([])
  const [isLoadingPOIs, setIsLoadingPOIs] = useState(false)

  // Fetch POIs from backend based on search query and user location
  const loadPOIs = useCallback(async (query: string) => {
    setIsLoadingPOIs(true)
    try {
      const filteredPOIs = await fetchFilteredPOIs({
        query,
        userLocation: userLocation || undefined,
        radius: 10, // 10km radius
      })
      setPois(filteredPOIs)
    } catch (error) {
      console.error('Error fetching POIs:', error)
    } finally {
      setIsLoadingPOIs(false)
    }
  }, [userLocation])

  // Fetch POIs when search query changes (with debouncing)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadPOIs(searchQuery)
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchQuery, loadPOIs])

  // Convert POIs to GeoJSON
  const poisGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => {
    return {
      type: 'FeatureCollection',
      features: pois.map((poi) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: poi.coordinates,
        },
        properties: {
          ...poi,
          iconImageId: getEmojiImageId(poi.icon),
        },
      })),
    }
  }, [pois])

  useEffect(() => {
    if (mapRef.current) return

    if (!mapContainer.current) return

    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [31.2001, 29.9187],
      zoom: 15,
    })

    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right')

    // Set flyToLocation function
    setFlyToLocation((lng: number, lat: number) => {
      mapRef.current?.flyTo({
        center: [lng, lat],
        zoom: 15,
        duration: 2000,
      })
    })

    mapRef.current.on('load', () => {
      // Load initial POIs
      loadPOIs('')
    })
  }, [setFlyToLocation, loadPOIs])

  // ---- Render POIs + layers ----
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded() || poisGeoJSON.features.length === 0) return
    const source = map.getSource('pois') as GeoJSONSource | undefined

    ensureEmojiImages(map, pois)

    if (source) {
      source.setData(poisGeoJSON)
      map.triggerRepaint()
    } else {
      map.addSource('pois', {
        type: 'geojson',
        generateId: true,
        data: poisGeoJSON,
      })

      // ---- POI circles with icons ----
      map.addLayer({
        id: 'poi-circles',
        type: 'circle',
        source: 'pois',
        paint: {
          'circle-color': '#20B2AA',
          'circle-radius': 20,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 3,
        },
      })

      // ---- POI emoji icons ----
      map.addLayer({
        id: 'poi-icons',
        type: 'symbol',
        source: 'pois',
        layout: {
          'icon-image': ['get', 'iconImageId'],
          'icon-size': 0.6,
          'icon-anchor': 'center',
          'icon-allow-overlap': true,
        },
      })
    }

    // ---- POI click handler ----
    const poiClickHandler = (e: mapboxgl.MapMouseEvent | mapboxgl.MapTouchEvent) => {
      const features = mapRef.current?.queryRenderedFeatures(e.point, {
        layers: ['poi-circles', 'poi-icons'],
      }) as mapboxgl.GeoJSONFeature[]

      if (!features?.length) return

      const feature = features[0]
      const properties = feature.properties as { id: string }

      // Find the full POI object
      const poi = pois.find((p) => p.id === properties.id)
      if (poi) {
        setSelectedPOI(poi)
      }
    }

    mapRef.current?.on('click', 'poi-circles', poiClickHandler)
    mapRef.current?.on('touchend', 'poi-circles', poiClickHandler)
    mapRef.current?.on('click', 'poi-icons', poiClickHandler)
    mapRef.current?.on('touchend', 'poi-icons', poiClickHandler)

    // ---- Cursor changes ----
    map!.on('mouseenter', 'poi-circles', () => {
      map!.getCanvas().style.cursor = 'pointer'
    })
    map!.on('mouseleave', 'poi-circles', () => {
      map!.getCanvas().style.cursor = ''
    })
    map!.on('mouseenter', 'poi-icons', () => {
      map!.getCanvas().style.cursor = 'pointer'
    })
    map!.on('mouseleave', 'poi-icons', () => {
      map!.getCanvas().style.cursor = ''
    })
  }, [router, poisGeoJSON, pois, setSelectedPOI])

  return (
    <>
      <div ref={mapContainer} style={{ width: '100vw', height: '100vh' }} />
      <MapSearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search places, types, or areas..." />
      {selectedPOI && <POICard poi={selectedPOI} onClose={() => setSelectedPOI(null)} />}
    </>
  )
}
