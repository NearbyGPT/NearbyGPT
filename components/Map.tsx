'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import mapboxgl, { GeoJSONSource } from 'mapbox-gl'
import MapSearchBar from './MapSearchBar'
import POICard, { POI } from './POICard'
import useGeneralStore from '@/store/generalStore'
import {
  fetchPOIsFromBackend,
  filterPOIsByQuery,
  filterPOIsByLocation,
} from '@/lib/backendPoiApi'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN as string

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
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const userLocationRef = useRef<{ latitude: number; longitude: number } | null>(null)

  const selectedPOI = useGeneralStore((s) => s.selectedPOI)
  const setSelectedPOI = useGeneralStore((s) => s.setSelectedPOI)
  const searchQuery = useGeneralStore((s) => s.searchQuery)
  const setSearchQuery = useGeneralStore((s) => s.setSearchQuery)
  const setFlyToLocation = useGeneralStore((s) => s.setFlyToLocation)
  const userLocation = useGeneralStore((s) => s.userLocation)
  const setUserLocation = useGeneralStore((s) => s.setUserLocation)
  const activeChatPOI = useGeneralStore((s) => s.activeChatPOI)
  const setActiveChatPOI = useGeneralStore((s) => s.setActiveChatPOI)
  const chatMessages = useGeneralStore((s) => s.chatMessages)
  const addChatMessage = useGeneralStore((s) => s.addChatMessage)
  const clearChatMessages = useGeneralStore((s) => s.clearChatMessages)

  const [allPOIs, setAllPOIs] = useState<POI[]>([])
  const [pois, setPois] = useState<POI[]>([])
  const hasFitBoundsRef = useRef(false)

  // Fetch all POIs from backend on mount
  useEffect(() => {
    const loadAllPOIs = async () => {
      try {
        const backendPOIs = await fetchPOIsFromBackend(500)
        setAllPOIs(backendPOIs)
        setPois(backendPOIs) // Initially show all POIs
        hasFitBoundsRef.current = false
      } catch (error) {
        console.error('Error loading POIs from backend:', error)
      }
    }

    loadAllPOIs()
  }, [])

  // Filter POIs based on search query and user location
  const filterPOIs = useCallback(
    (query: string) => {
      let filtered = allPOIs

      // Apply search query filter
      if (query.trim()) {
        filtered = filterPOIsByQuery(filtered, query)
      }

      // Apply location-based filter if user location is available
      if (userLocation) {
        filtered = filterPOIsByLocation(filtered, userLocation, 10) // 10km radius
      }

      setPois(filtered)
      hasFitBoundsRef.current = false
    },
    [allPOIs, userLocation]
  )

  const handleSearchSubmit = useCallback(
    (query: string) => {
      if (activeChatPOI) {
        addChatMessage({
          id: `${activeChatPOI.id}-${Date.now()}`,
          role: 'user',
          text: query,
        })
        setSearchQuery('') // Clear input after sending message in chat mode
      }

      filterPOIs(query)
    },
    [activeChatPOI, addChatMessage, filterPOIs, setSearchQuery]
  )

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

  // Keep ref in sync with userLocation state
  useEffect(() => {
    userLocationRef.current = userLocation
  }, [userLocation])

  // Request user location on component mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation({ latitude, longitude })

          // Fly to user's location if map is already loaded
          if (mapRef.current?.isStyleLoaded()) {
            mapRef.current.flyTo({
              center: [longitude, latitude],
              zoom: 15,
              duration: 2000,
            })
          }
        },
        (error) => {
          console.warn('Error getting user location:', error.message)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      )
    }
  }, [setUserLocation])

  // Filter POIs when search query changes (with debouncing)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      filterPOIs(searchQuery)
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchQuery, filterPOIs])

  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return

    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [31.2001, 29.9187],
      zoom: 15,
      attributionControl: false,
      logoPosition: 'top-left',
    })

    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
    mapRef.current.addControl(new mapboxgl.AttributionControl({ compact: true }), 'top-left')

    // Add geolocation control
    const geolocateControl = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      trackUserLocation: true,
      showUserHeading: true,
    })
    mapRef.current.addControl(geolocateControl, 'top-right')

    // Update user location in store when geolocate triggers
    geolocateControl.on('geolocate', (e: GeolocationPosition) => {
      setUserLocation({
        latitude: e.coords.latitude,
        longitude: e.coords.longitude,
      })
    })

    // Set flyToLocation function
    setFlyToLocation((lng: number, lat: number) => {
      mapRef.current?.flyTo({
        center: [lng, lat],
        zoom: 15,
        duration: 2000,
      })
    })

    mapRef.current.on('load', () => {
      // Fly to user location if we already have it (use ref to avoid closure issues)
      if (userLocationRef.current) {
        mapRef.current?.flyTo({
          center: [userLocationRef.current.longitude, userLocationRef.current.latitude],
          zoom: 15,
          duration: 2000,
        })
      }
    })
  }, [setFlyToLocation, setUserLocation])

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
  }, [poisGeoJSON, pois, setSelectedPOI])

  // Fit map to include all available POIs when they load for the first time
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded() || hasFitBoundsRef.current) return
    if (!pois.length) return

    const bounds = pois.reduce((acc, poi) => {
      if (!acc) {
        return new mapboxgl.LngLatBounds(poi.coordinates, poi.coordinates)
      }

      return acc.extend(poi.coordinates)
    }, null as mapboxgl.LngLatBounds | null)

    if (bounds) {
      map.fitBounds(bounds, {
        padding: 80,
        maxZoom: 16,
        duration: 1200,
      })
      hasFitBoundsRef.current = true
    }
  }, [pois])

  // Fly to the selected POI when it changes
  useEffect(() => {
    if (!selectedPOI || !mapRef.current?.isStyleLoaded()) return

    mapRef.current.flyTo({
      center: selectedPOI.coordinates,
      zoom: 17,
      duration: 1200,
    })
  }, [selectedPOI])

  return (
    <>
      <div ref={mapContainer} style={{ width: '100vw', height: '100vh' }} />
      <MapSearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search places, types, or areas..."
        activeChatName={activeChatPOI?.name}
        onClearChat={() => {
          setActiveChatPOI(null)
          clearChatMessages()
        }}
        onSubmit={handleSearchSubmit}
        messages={chatMessages}
        isChatActive={Boolean(activeChatPOI)}
      />
      {selectedPOI && <POICard poi={selectedPOI} onClose={() => setSelectedPOI(null)} />}
    </>
  )
}
