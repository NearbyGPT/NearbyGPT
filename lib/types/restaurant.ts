export type DiningIntention = 'dine-in' | 'ordering & pickup'

export type ParkingAvailability =
  | 'No'
  | 'Street Parking nearby'
  | 'On site parking lot'
  | 'On site parking with fees'
  | 'Valet service available'

export type SmokingSectionAvailability =
  | 'Smoking section only'
  | 'Non smoking section only'
  | 'Both smoking and non smoking areas'

export type OutdoorFamilyAmenity = 'Open-air seating' | 'Seaside view' | 'Kids play area'

export type ServiceStyle = 'Dine-in only' | 'Takeaway/delivery only' | 'dine-in plus takeaway/delivery'

export type HealthPositioning = 'health focused' | 'balanced' | 'comfort indulgent dishes'

export type MealPeriod = 'Breakfast' | 'Lunch' | 'Dinner' | 'Late night'

export type PriceRange = 'Budget friendly' | 'mid-range' | 'premium' | 'fine dining'

export type PaymentMethod = 'visa' | 'mastercard' | 'cash' | 'contactless/wallet' | 'crypto'

// Frontend representation for the form
export type Restaurant = {
  id?: string
  name: string
  latitude: number
  longitude: number
  city: string
  state: string
  address: string
  phone_number?: string
  website?: string
  tiktok?: string
  facebook?: string
  instagram?: string
  whatsapp?: string
  location_neighborhood: string
  dining_intention: DiningIntention
  parking_availability: ParkingAvailability
  smoking_section_availability: SmokingSectionAvailability
  outdoor_family_amenities: OutdoorFamilyAmenity[]
  description: string
  service_style: ServiceStyle
  cuisine_mix: string
  delivery_timing_insights: string
  health_positioning: HealthPositioning
  opening_hours: string
  meal_periods_served: MealPeriod[]
  price_range: PriceRange
  accepted_payment_methods: PaymentMethod[]
  reviews_influencers: string
}

export type RestaurantFormData = Omit<Restaurant, 'id'>

// Backend API representation
export type BackendRestaurant = {
  id?: string
  name: string
  latitude: number
  longitude: number
  city: string
  state: string
  address: string
  phone?: string | null
  email?: string | null
  website?: string
  tiktok?: string
  facebook?: string
  instagram?: string
  whatsapp?: string
  neighborhood?: string | null
  dining_intention?: string
  parking_availability?: string
  smoking_section?: string | null
  outdoor_amenities?: string[]
  description?: string
  service_style?: string
  cuisine_types?: string[]
  specialties?: string[]
  delivery_timing_insights?: string
  health_positioning?: string
  opening_hours_text?: string | null
  meal_periods?: string[]
  price_range?: string
  payment_methods?: string[]
  reviews_influencers?: string
  rating?: number | null
  is_active?: boolean
  created_at?: string
  updated_at?: string
  zip_code?: string | null
  ambiance?: string | null
  accepts_reservations?: boolean
  delivery_available?: boolean
  outdoor_seating?: boolean
}

export type BackendBusiness = {
  id: string
  name: string
  latitude: number
  longitude: number
}
