export type DiningIntention = "dine-in" | "ordering & pickup";

export type ParkingAvailability =
  | "No"
  | "Street Parking nearby"
  | "On site parking lot"
  | "Valet service available";

export type SmokingSectionAvailability =
  | "Smoking section only"
  | "Non smoking section only"
  | "Both smoking and non smoking areas";

export type OutdoorFamilyAmenity =
  | "Open-air seating"
  | "Seaside view"
  | "Kids play area";

export type ServiceStyle =
  | "Dine-in only"
  | "Takeaway/delivery only"
  | "dine-in plus takeaway/delivery";

export type HealthPositioning =
  | "health focused"
  | "balanced"
  | "comfort indulgent dishes";

export type MealPeriod = "Breakfast" | "Lunch" | "Dinner" | "Late night";

export type PriceRange =
  | "Budget friendly"
  | "mid-range"
  | "premium"
  | "fine dining";

export type PaymentMethod =
  | "visa"
  | "mastercard"
  | "cash"
  | "contactless/wallet"
  | "crypto";

export type Restaurant = {
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
  city: string;
  state_governorate: string;
  street_address: string;
  phone_number?: string;
  website?: string;
  tiktok?: string;
  facebook?: string;
  instagram?: string;
  whatsapp?: string;
  location_neighborhood: string;
  dining_intention: DiningIntention;
  parking_availability: ParkingAvailability;
  smoking_section_availability: SmokingSectionAvailability;
  outdoor_family_amenities: OutdoorFamilyAmenity[];
  atmosphere_vibe: string;
  service_style: ServiceStyle;
  cuisine_mix: string;
  delivery_timing_insights: string;
  health_positioning: HealthPositioning;
  opening_hours: string;
  meal_periods_served: MealPeriod[];
  typical_price_range: PriceRange;
  accepted_payment_methods: PaymentMethod[];
  reviews_influencers: string;
};

export type RestaurantFormData = Omit<Restaurant, "id">;
