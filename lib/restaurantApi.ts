import { Restaurant, RestaurantFormData } from "./types/restaurant";

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
 * Fetch all restaurants from the backend
 */
export async function getRestaurants(): Promise<Restaurant[]> {
  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/restaurants`);

  if (!response.ok) {
    throw new Error(`Failed to fetch restaurants: ${response.statusText}`);
  }

  const data = await response.json();

  if (Array.isArray(data)) {
    return data;
  }

  if (data && Array.isArray((data as { restaurants?: Restaurant[] }).restaurants)) {
    return (data as { restaurants: Restaurant[] }).restaurants;
  }

  throw new Error("Unexpected restaurants response shape");
}

/**
 * Create a new restaurant
 */
export async function createRestaurant(
  data: RestaurantFormData
): Promise<Restaurant> {
  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/restaurants`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create restaurant: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Update an existing restaurant
 */
export async function updateRestaurant(
  restaurantId: string,
  data: Partial<RestaurantFormData>
): Promise<Restaurant> {
  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/restaurants/${restaurantId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update restaurant: ${response.statusText}`);
  }

  return response.json();
}
