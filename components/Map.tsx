'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl, { GeoJSONSource } from 'mapbox-gl'
import { useRouter } from 'next/navigation'
import useGeneralStore from '@/store/generalStore'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN as string

// ---- Mock restaurant data ----
const mockRestaurants: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [29.9187, 31.2001],
      },
      properties: {
        name: 'Koshary El Tahrir',
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [29.95, 31.22],
      },
      properties: {
        name: 'Zooba',
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [29.93, 31.21],
      },
      properties: {
        name: 'Abou Shakra',
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [29.94, 31.23],
      },
      properties: {
        name: 'Felfela',
      },
    },
  ],
}

export default function Map() {
  const router = useRouter()
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)

  const { setFlyToLocation, filteredRestaurants } = useGeneralStore()

  const [restaurants, setRestaurants] = useState<GeoJSON.FeatureCollection>({
    type: 'FeatureCollection',
    features: [],
  })

  // Set global flyToLocation function
  useEffect(() => {
    setFlyToLocation((lng, lat) => {
      mapRef.current?.flyTo({ center: [lng, lat], zoom: 15 })
    })
  }, [setFlyToLocation])

  // Update restaurants when filters change
  useEffect(() => {
    if (filteredRestaurants && filteredRestaurants.features.length > 0) {
      setRestaurants(filteredRestaurants)
    } else {
      setRestaurants(mockRestaurants)
    }
  }, [filteredRestaurants])

  useEffect(() => {
    if (mapRef.current) return

    if (!mapContainer.current) return

    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [29.9187, 31.2001],
      zoom: 13,
    })

    mapRef.current.addControl(new mapboxgl.NavigationControl())
  }, [])

  // ---- Render restaurants + layers ----
  useEffect(() => {
    const map = mapRef.current
    if (!map || restaurants.features.length === 0) return

    if (!map.isStyleLoaded()) {
      map.once('styledata', () => {
        const geoJsonData = restaurants
        const source = map.getSource('restaurants') as GeoJSONSource | undefined
        // console.log(source)

        if (source) {
          source.setData(geoJsonData)
          map.triggerRepaint()
        } else {
          map.addSource('restaurants', {
            type: 'geojson',
            generateId: true,
            data: geoJsonData,
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50,
          })

          // ---- Cluster circles ----
          map.addLayer({
            id: 'clusters',
            type: 'circle',
            source: 'restaurants',
            filter: ['has', 'point_count'],
            paint: {
              'circle-color': ['step', ['get', 'point_count'], '#3a761e', 100, '#3a761e', 750, '#3a761e'],
              'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40],
              'circle-emissive-strength': 1,
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': 3,
            },
          })

          // ---- Cluster count ----
          map.addLayer({
            id: 'cluster-count',
            type: 'symbol',
            source: 'restaurants',
            filter: ['has', 'point_count'],
            layout: {
              'text-field': ['get', 'point_count_abbreviated'],
              'text-font': ['Lexend Regular', 'Arial Unicode MS Bold'],
              'text-size': 16,
              'text-anchor': 'center',
              'text-offset': [0, 0],
              'text-allow-overlap': false,
            },
            paint: {
              'text-color': '#ffffff',
            },
          })

          // ---- Load resturant icon ----
          map.loadImage('/resturant-icon.png', (error, image) => {
            if (error) throw error
            if (!image) return

            if (!map?.hasImage('resturant-icon')) {
              map?.addImage('resturant-icon', image)
            }

            map?.addLayer({
              id: 'resturant-icon',
              type: 'symbol',
              source: 'restaurants',
              filter: ['!', ['has', 'point_count']],
              layout: {
                'icon-image': 'resturant-icon',
                'icon-size': 0.2,
                'icon-allow-overlap': true,
                'text-field': ['get', 'name'], // Show restaurant name
                'text-font': ['Lexend Regular', 'Arial Unicode MS Bold'],
                'text-offset': [0, 1.2],
                'text-anchor': 'top',
              },
              paint: {
                'text-color': '#111',
              },
            })
          })
        }

        // ---- Cluster click/tap ----
        const clusterHandler = (e: mapboxgl.MapMouseEvent | mapboxgl.MapTouchEvent) => {
          const features = mapRef.current?.queryRenderedFeatures(e.point, {
            layers: ['clusters'],
          }) as mapboxgl.GeoJSONFeature[]

          if (!features?.length) return

          const clusterId = features[0].properties?.cluster_id as number

          ;(mapRef.current?.getSource('restaurants') as mapboxgl.GeoJSONSource).getClusterExpansionZoom(
            clusterId,
            (err, zoom) => {
              if (err || zoom == null) return

              const coordinates = (features[0].geometry as GeoJSON.Point).coordinates as [number, number]

              mapRef.current?.easeTo({
                center: coordinates,
                zoom,
              })
            }
          )
        }

        mapRef.current?.on('click', 'clusters', clusterHandler)
        mapRef.current?.on('touchend', 'clusters', clusterHandler)

        // ---- Resturant icon navigation ----
        const resturantClickHandler = (e: mapboxgl.MapMouseEvent | mapboxgl.MapTouchEvent) => {
          const features = mapRef.current?.queryRenderedFeatures(e.point, {
            layers: ['resturant-icon'],
          }) as mapboxgl.GeoJSONFeature[]

          if (!features?.length) return

          const feature = features[0]
          const { setSelectedRestaurant, setPanelOpen } = useGeneralStore.getState()

          setSelectedRestaurant(feature.properties)
          setPanelOpen(true)
        }

        mapRef.current?.on('click', 'resturant-icon', resturantClickHandler)
        mapRef.current?.on('touchend', 'resturant-icon', resturantClickHandler)

        // ---- Cursor changes ----
        map!.on('mouseenter', 'clusters', () => {
          map!.getCanvas().style.cursor = 'pointer'
        })
        map!.on('mouseleave', 'clusters', () => {
          map!.getCanvas().style.cursor = ''
        })
        map!.on('mouseenter', 'resturant-icon', () => {
          map!.getCanvas().style.cursor = 'pointer'
        })
        map!.on('mouseleave', 'resturant-icon', () => {
          map!.getCanvas().style.cursor = ''
        })
      })
    }
  }, [router, restaurants])

  return <div ref={mapContainer} style={{ width: '100vw', height: '100vh' }} />
}
