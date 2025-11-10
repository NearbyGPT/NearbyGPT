import { z } from "zod";

// Enum schemas for strict type checking
const diningIntentionSchema = z.enum(["dine-in", "ordering & pickup"]);

const parkingAvailabilitySchema = z.enum([
  "No",
  "Street Parking nearby",
  "On site parking lot",
  "Valet service available",
]);

const smokingSectionAvailabilitySchema = z.enum([
  "Smoking section only",
  "Non smoking section only",
  "Both smoking and non smoking areas",
]);

const outdoorFamilyAmenitySchema = z.enum([
  "Open-air seating",
  "Seaside view",
  "Kids play area",
]);

const serviceStyleSchema = z.enum([
  "Dine-in only",
  "Takeaway/delivery only",
  "dine-in plus takeaway/delivery",
]);

const healthPositioningSchema = z.enum([
  "health focused",
  "balanced",
  "comfort indulgent dishes",
]);

const mealPeriodSchema = z.enum(["Breakfast", "Lunch", "Dinner", "Late night"]);

const priceRangeSchema = z.enum([
  "Budget friendly",
  "mid-range",
  "premium",
  "fine dining",
]);

const paymentMethodSchema = z.enum([
  "visa",
  "mastercard",
  "cash",
  "contactless/wallet",
  "crypto",
]);

// Main restaurant validation schema
export const restaurantSchema = z.object({
  // Basic Information - Required fields
  name: z
    .string()
    .min(1, "Restaurant name is required")
    .min(2, "Restaurant name must be at least 2 characters")
    .max(200, "Restaurant name must not exceed 200 characters"),

  latitude: z
    .number({ message: "Latitude must be a number" })
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),

  longitude: z
    .number({ message: "Longitude must be a number" })
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),

  city: z
    .string()
    .min(1, "City is required")
    .min(2, "City must be at least 2 characters")
    .max(100, "City must not exceed 100 characters"),

  state: z
    .string()
    .min(1, "State/Governorate is required")
    .min(2, "State must be at least 2 characters")
    .max(100, "State must not exceed 100 characters"),

  address: z
    .string()
    .min(1, "Street address is required")
    .min(5, "Street address must be at least 5 characters")
    .max(300, "Street address must not exceed 300 characters"),

  location_neighborhood: z
    .string()
    .min(1, "Location/Neighborhood is required")
    .min(2, "Location/Neighborhood must be at least 2 characters")
    .max(100, "Location/Neighborhood must not exceed 100 characters"),

  // Optional contact information
  phone_number: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        // Basic phone validation - allows various formats
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        return phoneRegex.test(val) && val.replace(/\D/g, "").length >= 7;
      },
      { message: "Please enter a valid phone number" }
    ),

  // Social Media & Web - Optional but validated if provided
  website: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        try {
          new URL(val);
          return true;
        } catch {
          return false;
        }
      },
      { message: "Please enter a valid website URL (e.g., https://example.com)" }
    ),

  instagram: z
    .string()
    .max(100, "Instagram handle must not exceed 100 characters")
    .optional(),

  facebook: z
    .string()
    .max(200, "Facebook URL/handle must not exceed 200 characters")
    .optional(),

  tiktok: z
    .string()
    .max(100, "TikTok handle must not exceed 100 characters")
    .optional(),

  whatsapp: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        return phoneRegex.test(val) && val.replace(/\D/g, "").length >= 7;
      },
      { message: "Please enter a valid WhatsApp number" }
    ),

  // Service & Amenities - Required
  dining_intention: diningIntentionSchema,
  parking_availability: parkingAvailabilitySchema,
  smoking_section_availability: smokingSectionAvailabilitySchema,
  outdoor_family_amenities: z.array(outdoorFamilyAmenitySchema),

  // Food & Atmosphere - Required
  description: z
    .string()
    .min(1, "Description is required")
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must not exceed 1000 characters"),

  service_style: serviceStyleSchema,

  cuisine_mix: z
    .string()
    .min(1, "Cuisine mix is required")
    .min(3, "Cuisine mix must be at least 3 characters")
    .max(300, "Cuisine mix must not exceed 300 characters"),

  delivery_timing_insights: z
    .string()
    .min(1, "Delivery timing insights is required")
    .min(5, "Delivery timing insights must be at least 5 characters")
    .max(500, "Delivery timing insights must not exceed 500 characters"),

  health_positioning: healthPositioningSchema,

  // Operating Hours & Pricing - Required
  opening_hours: z
    .string()
    .min(1, "Opening hours is required")
    .min(5, "Opening hours must be at least 5 characters")
    .max(500, "Opening hours must not exceed 500 characters"),

  meal_periods_served: z
    .array(mealPeriodSchema)
    .min(1, "Please select at least one meal period"),

  price_range: priceRangeSchema,

  accepted_payment_methods: z
    .array(paymentMethodSchema)
    .min(1, "Please select at least one payment method"),

  // Reviews & Additional Info - Required
  reviews_influencers: z
    .string()
    .min(1, "Reviews & influencers information is required")
    .min(10, "Reviews & influencers must be at least 10 characters")
    .max(2000, "Reviews & influencers must not exceed 2000 characters"),
});

// Type inference for TypeScript
export type RestaurantSchemaType = z.infer<typeof restaurantSchema>;

// Schema for partial updates (all fields optional)
export const restaurantUpdateSchema = restaurantSchema.partial();

export type RestaurantUpdateSchemaType = z.infer<typeof restaurantUpdateSchema>;
