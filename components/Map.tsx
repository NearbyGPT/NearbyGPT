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

const createMessageId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`
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
  const skipSearchSyncRef = useRef(false)
  const [isChatExpanded, setIsChatExpanded] = useState(true)

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
      if (!query) return

      const baseMessageId = createMessageId()

      addChatMessage({
        id: `${baseMessageId}-user`,
        role: 'user',
        text: query,
      })

      filterPOIs(query)

      addChatMessage({
        id: `${baseMessageId}-assistant`,
        role: 'assistant',
        text: `I am filtering ${query} ... done.`,
      })

      skipSearchSyncRef.current = true
      setSearchQuery('')
      setIsChatExpanded(true)
    },
    [addChatMessage, filterPOIs, setSearchQuery]
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
    if (skipSearchSyncRef.current) {
      skipSearchSyncRef.current = false
      return
    }

    const timeoutId = setTimeout(() => {
      filterPOIs(searchQuery)
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchQuery, filterPOIs])

  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [29.9187, 31.2001],
      zoom: 15,
      attributionControl: false,
      logoPosition: 'top-left',
    })

    mapRef.current = map

    map.addControl(new mapboxgl.NavigationControl(), 'top-right')
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'top-left')

    // Add geolocation control
    const geolocateControl = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      trackUserLocation: true,
      showUserHeading: true,
    })
    map.addControl(geolocateControl, 'top-right')

    const handleGeolocate = (e: GeolocationPosition) => {
      setUserLocation({
        latitude: e.coords.latitude,
        longitude: e.coords.longitude,
      })
    }

    // Update user location in store when geolocate triggers
    geolocateControl.on('geolocate', handleGeolocate)

    // Set flyToLocation function
    setFlyToLocation((lng: number, lat: number) => {
      map.flyTo({
        center: [lng, lat],
        zoom: 15,
        duration: 2000,
      })
    })

    map.on('load', () => {
      // Fly to user location if we already have it (use ref to avoid closure issues)
      if (userLocationRef.current) {
        map.flyTo({
          center: [userLocationRef.current.longitude, userLocationRef.current.latitude],
          zoom: 15,
          duration: 2000,
        })
      }
    })

    const collapseEvents: Array<'click' | 'dragstart' | 'rotatestart' | 'pitchstart' | 'touchstart'> = [
      'click',
      'dragstart',
      'rotatestart',
      'pitchstart',
      'touchstart',
    ]
    const collapseChat = () => setIsChatExpanded(false)
    collapseEvents.forEach((eventName) => map.on(eventName, collapseChat))

    return () => {
      geolocateControl.off('geolocate', handleGeolocate)
      collapseEvents.forEach((eventName) => map.off(eventName, collapseChat))
      map.remove()
      mapRef.current = null
    }
  }, [setFlyToLocation, setUserLocation])

  // ---- Render POIs + layers ----
  useEffect(() => {
    const map = mapRef.current
    if (!map || poisGeoJSON.features.length === 0) return

    const cleanupFns: Array<() => void> = []

    const applyPoisToMap = () => {
      let source = map.getSource('pois') as GeoJSONSource | undefined

      ensureEmojiImages(map, pois)

      if (!source) {
        map.addSource('pois', {
          type: 'geojson',
          generateId: true,
          data: poisGeoJSON,
        })

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

        source = map.getSource('pois') as GeoJSONSource | undefined
      }

      if (source) {
        source.setData(poisGeoJSON)
        map.triggerRepaint()
      }

      const poiClickHandler = (e: mapboxgl.MapMouseEvent | mapboxgl.MapTouchEvent) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['poi-circles', 'poi-icons'],
        }) as mapboxgl.GeoJSONFeature[]

        if (!features?.length) return

        const feature = features[0]
        const properties = feature.properties as { id: string }

        const poi = pois.find((p) => p.id === properties.id)
        if (poi) {
          setSelectedPOI(poi)
        }
      }

      const handleMouseEnter = () => {
        map.getCanvas().style.cursor = 'pointer'
      }
      const handleMouseLeave = () => {
        map.getCanvas().style.cursor = ''
      }

      map.on('click', 'poi-circles', poiClickHandler)
      map.on('touchend', 'poi-circles', poiClickHandler)
      map.on('click', 'poi-icons', poiClickHandler)
      map.on('touchend', 'poi-icons', poiClickHandler)
      map.on('mouseenter', 'poi-circles', handleMouseEnter)
      map.on('mouseleave', 'poi-circles', handleMouseLeave)
      map.on('mouseenter', 'poi-icons', handleMouseEnter)
      map.on('mouseleave', 'poi-icons', handleMouseLeave)

      cleanupFns.push(() => {
        map.off('click', 'poi-circles', poiClickHandler)
        map.off('touchend', 'poi-circles', poiClickHandler)
        map.off('click', 'poi-icons', poiClickHandler)
        map.off('touchend', 'poi-icons', poiClickHandler)
        map.off('mouseenter', 'poi-circles', handleMouseEnter)
        map.off('mouseleave', 'poi-circles', handleMouseLeave)
        map.off('mouseenter', 'poi-icons', handleMouseEnter)
        map.off('mouseleave', 'poi-icons', handleMouseLeave)
      })
    }

    if (map.isStyleLoaded()) {
      applyPoisToMap()
    } else {
      const onLoad = () => {
        applyPoisToMap()
        map.off('load', onLoad)
      }

      map.on('load', onLoad)
      cleanupFns.push(() => {
        map.off('load', onLoad)
      })
    }

    return () => {
      cleanupFns.forEach((fn) => fn())
    }
  }, [poisGeoJSON, pois, setSelectedPOI])

  // Fit map to include all available POIs when they load for the first time
  useEffect(() => {
    const map = mapRef.current
    if (!map || hasFitBoundsRef.current || !pois.length) return

    const fitToPois = () => {
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
    }

    if (map.isStyleLoaded()) {
      fitToPois()
      return
    }

    const onLoad = () => {
      fitToPois()
      map.off('load', onLoad)
    }

    map.on('load', onLoad)

    return () => {
      map.off('load', onLoad)
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
        isExpanded={isChatExpanded}
        onExpand={() => setIsChatExpanded(true)}
      />
      {selectedPOI && <POICard poi={selectedPOI} onClose={() => setSelectedPOI(null)} />}
    </>
  )
}
