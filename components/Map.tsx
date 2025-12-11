'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import mapboxgl, { GeoJSONSource } from 'mapbox-gl'
import MapSearchBar from './MapSearchBar'
import POICard, { POI } from './POICard'
import useGeneralStore from '@/store/generalStore'
import { fetchPOIsFromBackend, filterPOIsByQuery, filterPOIsByLocation } from '@/lib/backendPoiApi'
import { useAuth } from '@clerk/nextjs'
import { BackendBusiness } from '@/lib/types/restaurant'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN as string

const getEmojiImageId = (emoji: string) =>
  `emoji-${Array.from(emoji)
    .map((char) => char.codePointAt(0)?.toString(16))
    .filter(Boolean)
    .join('-')}`

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
  const { getToken } = useAuth()
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

  const setLoading = useGeneralStore((s) => s.setLoading)

  const [allPOIs, setAllPOIs] = useState<POI[]>([])
  const [pois, setPois] = useState<POI[]>([])
  const hasFitBoundsRef = useRef(false)
  const skipSearchSyncRef = useRef(false)
  const [isChatExpanded, setIsChatExpanded] = useState(true)

  // Store conversation_id per business
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [businessIdWithConversation, setBusinessIdWithConversation] = useState<string | null>(null)

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

  // Reset conversation when switching to a different business
  useEffect(() => {
    if (activeChatPOI?.id !== businessIdWithConversation) {
      setConversationId(null)
      setBusinessIdWithConversation(null)
    }
  }, [activeChatPOI, businessIdWithConversation])

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
    async (query: string, file?: File) => {
      if (!query && !file) return

      const token = await getToken()
      setLoading(true)

      const baseMessageId = createMessageId()

      // Create user message display text
      let displayText = query
      if (file) {
        displayText = query
          ? `${query} [${file.type.startsWith('image/') ? 'Image' : 'PDF'}]`
          : `[${file.type.startsWith('image/') ? 'Image' : 'PDF'}]`
      }

      addChatMessage({
        id: `${baseMessageId}-user`,
        role: 'user',
        text: displayText,
      })

      const map = mapRef.current
      const center = map?.getCenter()
      const bounds = map?.getBounds()

      const viewport =
        center && bounds
          ? {
              center: { lat: center.lat, lng: center.lng },
              zoom: map?.getZoom() ?? 13,
              bounds: {
                north: bounds.getNorth(),
                south: bounds.getSouth(),
                east: bounds.getEast(),
                west: bounds.getWest(),
              },
            }
          : null

      try {
        // Prepare FormData for multipart/form-data request
        const formData = new FormData()

        // Add message if there is one
        if (query) {
          formData.append('message', query)
        }

        // Add file if there is one
        if (file) {
          formData.append('image', file)
        }

        // Add conversation_id if we have one for this business
        if (conversationId && activeChatPOI?.id === businessIdWithConversation) {
          formData.append('conversation_id', conversationId)
        }

        // Add viewport data
        if (viewport) {
          formData.append('viewport', JSON.stringify(viewport))
        }

        // Add user location if available
        if (userLocation) {
          formData.append('latitude', userLocation.latitude.toString())
          formData.append('longitude', userLocation.longitude.toString())
        }

        // Add active filters (empty object for now)
        formData.append('active_filters', JSON.stringify({}))

        // Add business_id if chatting with a POI
        if (activeChatPOI) {
          formData.append('business_id', activeChatPOI.id)
        }

        // Send request with FormData
        const response = await fetch('https://api.nearbygpt.app/api/chat/', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        })

        const text = await response.text()

        if (!response.ok) {
          setLoading(false)
          throw new Error(`API ${response.status}: ${text}`)
        }

        const data = JSON.parse(text)

        addChatMessage({
          id: `${baseMessageId}-assistant`,
          role: 'assistant',
          text: data?.message ?? 'Got your request!',
        })

        // Update conversation_id if returned by backend
        if (data?.conversation_id && activeChatPOI) {
          setConversationId(data.conversation_id)
          setBusinessIdWithConversation(activeChatPOI.id)
        }

        // If backend returned businesses_found, update POIs on map
        if (data?.businesses_found && Array.isArray(data.businesses_found)) {
          const filtered: POI[] = data.businesses_found.map((b: BackendBusiness) => ({
            id: b.id,
            name: b.name,
            icon: '🍽️',
            type: 'restaurant',
            coordinates: [b.location.longitude, b.location.latitude],
          }))

          setPois(filtered)

          // Zoom map to include these POIs
          requestAnimationFrame(() => {
            const map = mapRef.current
            if (!map || filtered.length === 0) return

            const bounds = new mapboxgl.LngLatBounds()
            filtered.forEach((poi) => bounds.extend(poi.coordinates))
            map.fitBounds(bounds, { padding: 80, duration: 1200, maxZoom: 15 })
          })
        }

        setLoading(false)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error('Error calling NearbyGPT API:', error)
        setLoading(false)
        addChatMessage({
          id: `${baseMessageId}-assistant`,
          role: 'assistant',
          text: `Sorry, I couldn't process your request: ${error.message}`,
        })
      }

      skipSearchSyncRef.current = true
      setSearchQuery('')
      setIsChatExpanded(true)
    },
    [
      setLoading,
      addChatMessage,
      setSearchQuery,
      userLocation,
      activeChatPOI,
      getToken,
      setIsChatExpanded,
      conversationId,
      businessIdWithConversation,
    ]
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
  }, [])

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
      style: 'mapbox://styles/mapbox/basic-v9?optimize=true',
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleGeolocate = (e: any) => {
      const ctrl = e?.target
      const pos = ctrl?._lastKnownPosition

      if (!pos?.coords) {
        console.warn('Geolocate missing coords:', e)
        return
      }
      setUserLocation({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
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

    map.on('moveend', () => {
      const center = map.getCenter()
      const lat = center.lat.toFixed(6)
      const lng = center.lng.toFixed(6)

      const newQuery = `?lat=${lat}&lng=${lng}`

      window.history.replaceState(null, '', newQuery)
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
          // reset conversation when clearing chat
          setConversationId(null)
          setBusinessIdWithConversation(null)
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
