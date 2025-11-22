'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { getChangedFields } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Restaurant,
  RestaurantFormData,
  DiningIntention,
  ParkingAvailability,
  SmokingSectionAvailability,
  OutdoorFamilyAmenity,
  ServiceStyle,
  HealthPositioning,
  MealPeriod,
  PriceRange,
  PaymentMethod,
} from '@/lib/types/restaurant'
import { restaurantSchema, restaurantUpdateSchema } from '@/lib/validation/restaurantSchema'
import { z } from 'zod'
import { AlertCircle, LocateFixed, X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Image from 'next/image'
import { toast } from 'sonner'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN as string

type RestaurantFormProps = {
  initialData?: Restaurant
  onSubmit: (data: RestaurantFormData | Partial<RestaurantFormData>) => Promise<void>
  isLoading?: boolean
}

const outdoorFamilyAmenities: OutdoorFamilyAmenity[] = ['Open-air seating', 'Seaside view', 'Kids play area']

const mealPeriods: MealPeriod[] = ['Breakfast', 'Lunch', 'Dinner', 'Late night']

const paymentMethods: PaymentMethod[] = ['visa', 'mastercard', 'cash', 'contactless/wallet', 'crypto']

export function RestaurantForm({ initialData, onSubmit, isLoading = false }: RestaurantFormProps) {
  // Track original data to detect changes
  const originalDataRef = useRef<RestaurantFormData | null>(null)

  // State for validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState<string>('')

  // Location state
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [mapOpen, setMapOpen] = useState(false)

  const miniMapRef = useRef<HTMLDivElement | null>(null)
  const miniMapInstance = useRef<mapboxgl.Map | null>(null)
  const miniMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markerRef = useRef<mapboxgl.Marker | null>(null)

  // Mini map initialization
  useEffect(() => {
    if (!miniMapRef.current) return

    miniMapInstance.current = new mapboxgl.Map({
      container: miniMapRef.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: location ? [location.lng, location.lat] : [30.8025, 26.8206],
      zoom: location ? 15 : 6,
      interactive: false,
      attributionControl: false,
    })

    if (location) {
      miniMarkerRef.current = new mapboxgl.Marker({ color: 'red' })
        .setLngLat([location.lng, location.lat])
        .addTo(miniMapInstance.current)
    }

    return () => {
      miniMapInstance.current?.remove()
      miniMapInstance.current = null
      miniMarkerRef.current = null
    }
  }, [location])

  useEffect(() => {
    if (location && miniMarkerRef.current) {
      miniMarkerRef.current.setLngLat([location.lng, location.lat])
      miniMapInstance.current?.setCenter([location.lng, location.lat])
    }
  }, [location])

  // Modal map initialization
  useEffect(() => {
    if (!mapOpen || !mapContainerRef.current) return

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: location ? [location.lng, location.lat] : [30.8025, 26.8206],
      zoom: location ? 15 : 6,
    })

    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    if (location) {
      markerRef.current = new mapboxgl.Marker({ color: 'red' })
        .setLngLat([location.lng, location.lat])
        .addTo(mapRef.current)
    }

    mapRef.current.on('click', (e) => {
      const coords = { lat: e.lngLat.lat, lng: e.lngLat.lng }
      setLocation(coords)

      if (markerRef.current) {
        markerRef.current.setLngLat([coords.lng, coords.lat])
      } else {
        markerRef.current = new mapboxgl.Marker({ color: 'red' })
          .setLngLat([coords.lng, coords.lat])
          .addTo(mapRef.current!)
      }
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [mapOpen])

  useEffect(() => {
    if (location) {
      setFormData((prev) => ({
        ...prev,
        latitude: location.lat,
        longitude: location.lng,
      }))
    }
  }, [location])

  const [formData, setFormData] = useState<RestaurantFormData>({
    name: initialData?.name || '',
    latitude: initialData?.latitude || 0,
    longitude: initialData?.longitude || 0,
    city: initialData?.city || '',
    state: initialData?.state || '',
    address: initialData?.address || '',
    phone_number: initialData?.phone_number || '',
    website: initialData?.website || '',
    tiktok: initialData?.tiktok || '',
    facebook: initialData?.facebook || '',
    instagram: initialData?.instagram || '',
    whatsapp: initialData?.whatsapp || '',
    location_neighborhood: initialData?.location_neighborhood || '',
    dining_intention: initialData?.dining_intention || 'dine-in',
    parking_availability: initialData?.parking_availability || 'No',
    smoking_section_availability: initialData?.smoking_section_availability || 'Non smoking section only',
    outdoor_family_amenities: initialData?.outdoor_family_amenities || [],
    description: initialData?.description || '',
    service_style: initialData?.service_style || 'Dine-in only',
    cuisine_mix: initialData?.cuisine_mix || '',
    delivery_timing_insights: initialData?.delivery_timing_insights || '',
    health_positioning: initialData?.health_positioning || 'balanced',
    opening_hours: initialData?.opening_hours || '',
    meal_periods_served: initialData?.meal_periods_served || [],
    price_range: initialData?.price_range || 'mid-range',
    accepted_payment_methods: initialData?.accepted_payment_methods || [],
    reviews_influencers: initialData?.reviews_influencers || '',
  })

  // Update form data when initialData changes
  useEffect(() => {
    const newFormData: RestaurantFormData = {
      name: initialData?.name || '',
      latitude: initialData?.latitude || 0,
      longitude: initialData?.longitude || 0,
      city: initialData?.city || '',
      state: initialData?.state || '',
      address: initialData?.address || '',
      phone_number: initialData?.phone_number || '',
      website: initialData?.website || '',
      tiktok: initialData?.tiktok || '',
      facebook: initialData?.facebook || '',
      instagram: initialData?.instagram || '',
      whatsapp: initialData?.whatsapp || '',
      location_neighborhood: initialData?.location_neighborhood || '',
      dining_intention: initialData?.dining_intention || 'dine-in',
      parking_availability: initialData?.parking_availability || 'No',
      smoking_section_availability: initialData?.smoking_section_availability || 'Non smoking section only',
      outdoor_family_amenities: initialData?.outdoor_family_amenities || [],
      description: initialData?.description || '',
      service_style: initialData?.service_style || 'Dine-in only',
      cuisine_mix: initialData?.cuisine_mix || '',
      delivery_timing_insights: initialData?.delivery_timing_insights || '',
      health_positioning: initialData?.health_positioning || 'balanced',
      opening_hours: initialData?.opening_hours || '',
      meal_periods_served: initialData?.meal_periods_served || [],
      price_range: initialData?.price_range || 'mid-range',
      accepted_payment_methods: initialData?.accepted_payment_methods || [],
      reviews_influencers: initialData?.reviews_influencers || '',
    }

    setFormData(newFormData)
    // Store a snapshot of the original data for comparison on submit
    originalDataRef.current = { ...newFormData }
    // Clear validation errors when data changes
    setValidationErrors({})
    setGeneralError('')
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Clear previous errors
    setValidationErrors({})
    setGeneralError('')

    try {
      // Determine which data to validate
      let dataToValidate: RestaurantFormData | Partial<RestaurantFormData>
      let dataToSubmit: RestaurantFormData | Partial<RestaurantFormData>

      if (initialData && originalDataRef.current) {
        // For updates, get changed fields
        const changedFields = getChangedFields(originalDataRef.current, formData)
        dataToValidate = formData // Validate the full form for context
        dataToSubmit = changedFields
        console.log('Sending only changed fields:', Object.keys(changedFields))

        // Use partial schema for updates
        restaurantUpdateSchema.parse(changedFields)
      } else {
        // For new restaurants, validate all required fields
        dataToValidate = formData
        dataToSubmit = formData
        console.log('Creating new restaurant with all fields')

        // Use full schema for creation
        restaurantSchema.parse(formData)
      }

      // If validation passes, submit the data
      await onSubmit(dataToSubmit)
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Convert Zod errors to a more usable format
        const fieldErrors: Record<string, string> = {}
        error.issues.forEach((err) => {
          const path = err.path.join('.')
          fieldErrors[path] = err.message
        })
        setValidationErrors(fieldErrors)

        // Set a general error message
        setGeneralError('Please fix the validation errors below before submitting.')

        // Scroll to the top to show the error alert
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        // Handle unexpected errors
        setGeneralError('An unexpected error occurred. Please try again.')
        console.error('Validation error:', error)
      }
    }
  }

  const handleCheckboxChange = <T extends string>(
    field: 'outdoor_family_amenities' | 'meal_periods_served' | 'accepted_payment_methods',
    value: T,
    checked: boolean
  ) => {
    setFormData((prev) => {
      const currentValues = prev[field] as T[]
      return {
        ...prev,
        [field]: checked ? [...currentValues, value] : currentValues.filter((v) => v !== value),
      }
    })
  }

  // Helper component to display field errors
  const FieldError = ({ fieldName }: { fieldName: string }) => {
    const error = validationErrors[fieldName]
    if (!error) return null

    return (
      <p className="text-sm text-destructive flex items-center gap-1 mt-1">
        <AlertCircle className="h-3 w-3" />
        {error}
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* General error alert */}
      {generalError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{generalError}</AlertDescription>
        </Alert>
      )}
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Essential details about the restaurant</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">Restaurant Name *</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter restaurant name"
              className={validationErrors.name ? 'border-destructive' : ''}
            />
            <FieldError fieldName="name" />
          </div>

          {/* <div className="space-y-2">
            <Label htmlFor="latitude">Latitude *</Label>
            <Input
              id="latitude"
              type="number"
              step="any"
              required
              value={formData.latitude}
              onChange={(e) =>
                setFormData({ ...formData, latitude: parseFloat(e.target.value) })
              }
              placeholder="e.g., 33.8938"
              className={validationErrors.latitude ? "border-destructive" : ""}
            />
            <FieldError fieldName="latitude" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="longitude">Longitude *</Label>
            <Input
              id="longitude"
              type="number"
              step="any"
              required
              value={formData.longitude}
              onChange={(e) =>
                setFormData({ ...formData, longitude: parseFloat(e.target.value) })
              }
              placeholder="e.g., 35.5018"
              className={validationErrors.longitude ? "border-destructive" : ""}
            />
            <FieldError fieldName="longitude" />
          </div> */}

          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              required
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Enter city"
              className={validationErrors.city ? 'border-destructive' : ''}
            />
            <FieldError fieldName="city" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">State/Governorate *</Label>
            <Input
              id="state"
              required
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              placeholder="Enter state or governorate"
              className={validationErrors.state ? 'border-destructive' : ''}
            />
            <FieldError fieldName="state" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Street Address *</Label>
            <Input
              id="address"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter street address"
              className={validationErrors.address ? 'border-destructive' : ''}
            />
            <FieldError fieldName="address" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location_neighborhood">Location/Neighborhood *</Label>
            <Input
              id="location_neighborhood"
              required
              value={formData.location_neighborhood}
              onChange={(e) => setFormData({ ...formData, location_neighborhood: e.target.value })}
              placeholder="e.g., Downtown, West End"
              className={validationErrors.location_neighborhood ? 'border-destructive' : ''}
            />
            <FieldError fieldName="location_neighborhood" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input
              id="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              placeholder="+1 234 567 8900"
              className={validationErrors.phone_number ? 'border-destructive' : ''}
            />
            <FieldError fieldName="phone_number" />
          </div>
        </CardContent>
      </Card>

      {/* Mini Map Preview */}
      <div className="mb-6 mt-4">
        <Label>Location</Label>
        <div
          className="relative mt-2 w-full h-64 rounded-md overflow-hidden border cursor-pointer"
          onClick={() => setMapOpen(true)}
        >
          <div ref={miniMapRef} className="w-full h-full" />
          <button
            type="button"
            className="absolute bottom-2 right-2 bg-green-600 text-white p-2 rounded-full"
            onClick={(e) => {
              e.stopPropagation()
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                  () => toast.error('Could not fetch location.')
                )
              } else {
                toast.error('Geolocation not supported')
              }
            }}
          >
            <LocateFixed size={20} />
          </button>
        </div>
        {location && (
          <p className="text-sm mt-1">
            Selected:{' '}
            <span className="font-medium">
              {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
            </span>
          </p>
        )}
      </div>

      {/* Modal Map */}
      {mapOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[95%] max-w-3xl h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-black">Select Location</h2>
              <button onClick={() => setMapOpen(false)}>
                <X />
              </button>
            </div>
            <div className="flex-1 p-4">
              <div ref={mapContainerRef} className="w-full h-full rounded-md" />
            </div>
            <div className="p-4 flex justify-end">
              <button type="button" className="bg-green-600 text-white px-4 py-2" onClick={() => setMapOpen(false)}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Social Media & Web Presence */}
      <Card>
        <CardHeader>
          <CardTitle>Social Media & Web Presence</CardTitle>
          <CardDescription>All fields are optional</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://example.com"
              className={validationErrors.website ? 'border-destructive' : ''}
            />
            <FieldError fieldName="website" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram</Label>
            <Input
              id="instagram"
              value={formData.instagram}
              onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
              placeholder="@restaurant"
              className={validationErrors.instagram ? 'border-destructive' : ''}
            />
            <FieldError fieldName="instagram" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="facebook">Facebook</Label>
            <Input
              id="facebook"
              value={formData.facebook}
              onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
              placeholder="facebook.com/restaurant"
              className={validationErrors.facebook ? 'border-destructive' : ''}
            />
            <FieldError fieldName="facebook" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tiktok">TikTok</Label>
            <Input
              id="tiktok"
              value={formData.tiktok}
              onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
              placeholder="@restaurant"
              className={validationErrors.tiktok ? 'border-destructive' : ''}
            />
            <FieldError fieldName="tiktok" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              type="tel"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              placeholder="+1 234 567 8900"
              className={validationErrors.whatsapp ? 'border-destructive' : ''}
            />
            <FieldError fieldName="whatsapp" />
          </div>
        </CardContent>
      </Card>

      {/* Service & Amenities */}
      <Card>
        <CardHeader>
          <CardTitle>Service & Amenities</CardTitle>
          <CardDescription>Details about dining options and facilities</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="dining_intention">Dining Intention *</Label>
            <Select
              value={formData.dining_intention}
              onValueChange={(value: DiningIntention) => setFormData({ ...formData, dining_intention: value })}
            >
              <SelectTrigger id="dining_intention">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dine-in">Dine-in</SelectItem>
                <SelectItem value="ordering & pickup">Ordering & Pickup</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service_style">Service Style *</Label>
            <Select
              value={formData.service_style}
              onValueChange={(value: ServiceStyle) => setFormData({ ...formData, service_style: value })}
            >
              <SelectTrigger id="service_style">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Dine-in only">Dine-in only</SelectItem>
                <SelectItem value="Takeaway/delivery only">Takeaway/delivery only</SelectItem>
                <SelectItem value="dine-in plus takeaway/delivery">Dine-in plus takeaway/delivery</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="parking_availability">Parking Availability *</Label>
            <Select
              value={formData.parking_availability}
              onValueChange={(value: ParkingAvailability) => setFormData({ ...formData, parking_availability: value })}
            >
              <SelectTrigger id="parking_availability">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="No">No</SelectItem>
                <SelectItem value="Street Parking nearby">Street Parking nearby</SelectItem>
                <SelectItem value="On site parking lot">On site parking lot</SelectItem>
                <SelectItem value="On site parking with fees">On site parking with fees</SelectItem>
                <SelectItem value="Valet service available">Valet service available</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="smoking_section_availability">Smoking Section Availability *</Label>
            <Select
              value={formData.smoking_section_availability}
              onValueChange={(value: SmokingSectionAvailability) =>
                setFormData({ ...formData, smoking_section_availability: value })
              }
            >
              <SelectTrigger id="smoking_section_availability">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Smoking section only">Smoking section only</SelectItem>
                <SelectItem value="Non smoking section only">Non smoking section only</SelectItem>
                <SelectItem value="Both smoking and non smoking areas">Both smoking and non smoking areas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Outdoor & Family Amenities</Label>
            <div className="grid gap-3 md:grid-cols-3">
              {outdoorFamilyAmenities.map((amenity) => (
                <div key={amenity} className="flex items-center space-x-2">
                  <Checkbox
                    id={`amenity-${amenity}`}
                    checked={formData.outdoor_family_amenities.includes(amenity)}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange('outdoor_family_amenities', amenity, checked === true)
                    }
                  />
                  <Label htmlFor={`amenity-${amenity}`} className="text-sm font-normal cursor-pointer">
                    {amenity}
                  </Label>
                </div>
              ))}
            </div>
            <FieldError fieldName="outdoor_family_amenities" />
          </div>
        </CardContent>
      </Card>

      {/* Food & Atmosphere */}
      <Card>
        <CardHeader>
          <CardTitle>Food & Atmosphere</CardTitle>
          <CardDescription>Cuisine, vibe, and dining experience details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="cuisine_mix">
              Cuisine Mix * <span className="text-xs text-muted-foreground">(comma-separated)</span>
            </Label>
            <Textarea
              id="cuisine_mix"
              required
              value={formData.cuisine_mix}
              onChange={(e) => setFormData({ ...formData, cuisine_mix: e.target.value })}
              placeholder="Italian, Mediterranean, Seafood"
              rows={2}
              className={validationErrors.cuisine_mix ? 'border-destructive' : ''}
            />
            <FieldError fieldName="cuisine_mix" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description or Atmosphere *</Label>
            <Textarea
              id="description"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the restaurant's atmosphere..."
              rows={3}
              className={validationErrors.description ? 'border-destructive' : ''}
            />
            <FieldError fieldName="description" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="health_positioning">Health Positioning *</Label>
            <Select
              value={formData.health_positioning}
              onValueChange={(value: HealthPositioning) => setFormData({ ...formData, health_positioning: value })}
            >
              <SelectTrigger id="health_positioning">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="health focused">Health focused</SelectItem>
                <SelectItem value="balanced">Balanced</SelectItem>
                <SelectItem value="comfort indulgent dishes">Comfort indulgent dishes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery_timing_insights">Delivery Timing Insights *</Label>
            <Textarea
              id="delivery_timing_insights"
              required
              value={formData.delivery_timing_insights}
              onChange={(e) => setFormData({ ...formData, delivery_timing_insights: e.target.value })}
              placeholder="Typical delivery times and availability..."
              rows={3}
              className={validationErrors.delivery_timing_insights ? 'border-destructive' : ''}
            />
            <FieldError fieldName="delivery_timing_insights" />
          </div>
        </CardContent>
      </Card>

      {/* Operating Hours & Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Operating Hours & Pricing</CardTitle>
          <CardDescription>When you&apos;re open and pricing information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="opening_hours">
              Opening Hours *{' '}
              <span className="text-xs text-muted-foreground">(e.g., Weekdays 9am-11pm, Weekends 9am-1am)</span>
            </Label>
            <Textarea
              id="opening_hours"
              required
              value={formData.opening_hours}
              onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })}
              placeholder="Weekdays 9am-11pm, Weekends 9am-1am"
              rows={2}
              className={validationErrors.opening_hours ? 'border-destructive' : ''}
            />
            <FieldError fieldName="opening_hours" />
          </div>

          <div className="space-y-2">
            <Label>Meal Periods Served *</Label>
            <div className="grid gap-3 md:grid-cols-4">
              {mealPeriods.map((period) => (
                <div key={period} className="flex items-center space-x-2">
                  <Checkbox
                    id={`meal-${period}`}
                    checked={formData.meal_periods_served.includes(period)}
                    onCheckedChange={(checked) => handleCheckboxChange('meal_periods_served', period, checked === true)}
                  />
                  <Label htmlFor={`meal-${period}`} className="text-sm font-normal cursor-pointer">
                    {period}
                  </Label>
                </div>
              ))}
            </div>
            <FieldError fieldName="meal_periods_served" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price_range">Price Range *</Label>
            <Select
              value={formData.price_range}
              onValueChange={(value: PriceRange) => setFormData({ ...formData, price_range: value })}
            >
              <SelectTrigger id="price_range">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Budget friendly">Budget friendly</SelectItem>
                <SelectItem value="mid-range">Mid-range</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="fine dining">Fine dining</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Accepted Payment Methods *</Label>
            <div className="grid gap-3 md:grid-cols-3">
              {paymentMethods.map((method) => (
                <div key={method} className="flex items-center space-x-2">
                  <Checkbox
                    id={`payment-${method}`}
                    checked={formData.accepted_payment_methods.includes(method)}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange('accepted_payment_methods', method, checked === true)
                    }
                  />
                  <Label htmlFor={`payment-${method}`} className="text-sm font-normal cursor-pointer capitalize">
                    {method}
                  </Label>
                </div>
              ))}
            </div>
            <FieldError fieldName="accepted_payment_methods" />
          </div>
        </CardContent>
      </Card>

      {/* Reviews & Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle>Reviews & Additional Information</CardTitle>
          <CardDescription>Notable reviews and influencer mentions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="reviews_influencers">Reviews & Influencers *</Label>
            <Textarea
              id="reviews_influencers"
              required
              value={formData.reviews_influencers}
              onChange={(e) => setFormData({ ...formData, reviews_influencers: e.target.value })}
              placeholder="Notable reviews, ratings, and influencer mentions..."
              rows={4}
              className={validationErrors.reviews_influencers ? 'border-destructive' : ''}
            />
            <FieldError fieldName="reviews_influencers" />
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={isLoading} size="lg">
          {isLoading
            ? initialData
              ? 'Updating...'
              : 'Creating...'
            : initialData
            ? 'Update Restaurant'
            : 'Create Restaurant'}
        </Button>
      </div>
    </form>
  )
}
