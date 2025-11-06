import { Restaurant, RestaurantFormData, BackendRestaurant } from "./types/restaurant";

/**
 * Get the API base URL from environment variable
 */
function getApiBaseUrl(): string {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  if (!backendUrl) {
    throw new Error("NEXT_PUBLIC_BACKEND_API_URL is not defined");
  }

  return `${backendUrl}/api/v1`;
}

/**
 * Transform backend restaurant data to frontend format
 */
function transformBackendToFrontend(backend: BackendRestaurant): Restaurant {
  return {
    id: backend.id,
    name: backend.name,
    latitude: backend.latitude,
    longitude: backend.longitude,
    city: backend.city,
    state: backend.state,
    address: backend.address,
    phone_number: backend.phone || "",
    website: backend.website || "",
    tiktok: backend.tiktok || "",
    facebook: backend.facebook || "",
    instagram: backend.instagram || "",
    whatsapp: backend.whatsapp || "",
    location_neighborhood: backend.neighborhood || "",
    dining_intention: (backend.dining_intention as any) || "dine-in",
    parking_availability: (backend.parking_availability as any) || "No",
    smoking_section_availability: (backend.smoking_section as any) || "Non smoking section only",
    outdoor_family_amenities: (backend.outdoor_amenities || []) as any[],
    description: backend.description || "",
    service_style: (backend.service_style as any) || "Dine-in only",
    cuisine_mix: (backend.cuisine_types || []).join(", "),
    delivery_timing_insights: backend.delivery_timing_insights || "",
    health_positioning: (backend.health_positioning as any) || "balanced",
    opening_hours: backend.opening_hours_text || "",
    meal_periods_served: (backend.meal_periods || []) as any[],
    price_range: (backend.price_range as any) || "mid-range",
    accepted_payment_methods: (backend.payment_methods || []) as any[],
    reviews_influencers: backend.reviews_influencers || "",
  };
}

/**
 * Transform frontend form data to backend format
 */
function transformFrontendToBackend(frontend: RestaurantFormData | Partial<RestaurantFormData>): Partial<BackendRestaurant> {
  const backend: Partial<BackendRestaurant> = {};

  // Map basic fields
  if (frontend.name !== undefined) backend.name = frontend.name;
  if (frontend.latitude !== undefined) backend.latitude = frontend.latitude;
  if (frontend.longitude !== undefined) backend.longitude = frontend.longitude;
  if (frontend.city !== undefined) backend.city = frontend.city;
  if (frontend.state !== undefined) backend.state = frontend.state;
  if (frontend.address !== undefined) backend.address = frontend.address;
  if (frontend.phone_number !== undefined) backend.phone = frontend.phone_number;
  if (frontend.website !== undefined) backend.website = frontend.website;
  if (frontend.tiktok !== undefined) backend.tiktok = frontend.tiktok;
  if (frontend.facebook !== undefined) backend.facebook = frontend.facebook;
  if (frontend.instagram !== undefined) backend.instagram = frontend.instagram;
  if (frontend.whatsapp !== undefined) backend.whatsapp = frontend.whatsapp;
  if (frontend.description !== undefined) backend.description = frontend.description;
  if (frontend.dining_intention !== undefined) backend.dining_intention = frontend.dining_intention;
  if (frontend.parking_availability !== undefined) backend.parking_availability = frontend.parking_availability;
  if (frontend.service_style !== undefined) backend.service_style = frontend.service_style;
  if (frontend.delivery_timing_insights !== undefined) backend.delivery_timing_insights = frontend.delivery_timing_insights;
  if (frontend.health_positioning !== undefined) backend.health_positioning = frontend.health_positioning;
  if (frontend.reviews_influencers !== undefined) backend.reviews_influencers = frontend.reviews_influencers;
  if (frontend.price_range !== undefined) backend.price_range = frontend.price_range;

  // Transform field names
  if (frontend.location_neighborhood !== undefined) {
    backend.neighborhood = frontend.location_neighborhood;
  }
  if (frontend.smoking_section_availability !== undefined) {
    backend.smoking_section = frontend.smoking_section_availability;
  }
  if (frontend.opening_hours !== undefined) {
    backend.opening_hours_text = frontend.opening_hours;
  }

  // Transform arrays
  if (frontend.outdoor_family_amenities !== undefined) {
    backend.outdoor_amenities = frontend.outdoor_family_amenities;
  }
  if (frontend.meal_periods_served !== undefined) {
    backend.meal_periods = frontend.meal_periods_served;
  }
  if (frontend.accepted_payment_methods !== undefined) {
    backend.payment_methods = frontend.accepted_payment_methods;
  }

  // Transform cuisine_mix (comma-separated string) to cuisine_types (array)
  if (frontend.cuisine_mix !== undefined) {
    backend.cuisine_types = frontend.cuisine_mix
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
  }

  return backend;
}

/**
 * Fetch all restaurants from the backend
 */
export async function getRestaurants(): Promise<Restaurant[]> {
  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/restaurants`);

  if (!response.ok) {
    throw new Error(`Failed to fetch restaurants: ${response.statusText}`);
  }

  const data = await response.json();

  let backendRestaurants: BackendRestaurant[] = [];

  if (Array.isArray(data)) {
    backendRestaurants = data;
  } else if (data && Array.isArray((data as { restaurants?: BackendRestaurant[] }).restaurants)) {
    backendRestaurants = (data as { restaurants: BackendRestaurant[] }).restaurants;
  } else {
    throw new Error("Unexpected restaurants response shape");
  }

  // Transform backend data to frontend format
  return backendRestaurants.map(transformBackendToFrontend);
}

/**
 * Create a new restaurant
 */
export async function createRestaurant(
  data: RestaurantFormData
): Promise<Restaurant> {
  const apiBaseUrl = getApiBaseUrl();

  // Transform frontend data to backend format
  const backendData = transformFrontendToBackend(data);

  const response = await fetch(`${apiBaseUrl}/restaurants`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(backendData),
  });

  if (!response.ok) {
    throw new Error(`Failed to create restaurant: ${response.statusText}`);
  }

  const backendRestaurant: BackendRestaurant = await response.json();

  // Transform backend response to frontend format
  return transformBackendToFrontend(backendRestaurant);
}

/**
 * Update an existing restaurant
 */
export async function updateRestaurant(
  restaurantId: string,
  data: Partial<RestaurantFormData>
): Promise<Restaurant> {
  const apiBaseUrl = getApiBaseUrl();

  // Transform frontend data to backend format
  const backendData = transformFrontendToBackend(data);

  const response = await fetch(`${apiBaseUrl}/restaurants/${restaurantId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(backendData),
  });

  if (!response.ok) {
    throw new Error(`Failed to update restaurant: ${response.statusText}`);
  }

  const backendRestaurant: BackendRestaurant = await response.json();

  // Transform backend response to frontend format
  return transformBackendToFrontend(backendRestaurant);
}
