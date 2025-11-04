import { Restaurant, RestaurantFormData } from "./types/restaurant";

const API_BASE_URL = "https://api.nearbygpt.app/api/v1";

/**
 * Fetch all restaurants from the backend
 */
export async function getRestaurants(): Promise<Restaurant[]> {
  const response = await fetch(`${API_BASE_URL}/restaurants`);

  if (!response.ok) {
    throw new Error(`Failed to fetch restaurants: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Create a new restaurant
 */
export async function createRestaurant(
  data: RestaurantFormData
): Promise<Restaurant> {
  const response = await fetch(`${API_BASE_URL}/restaurants`, {
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
  const response = await fetch(`${API_BASE_URL}/restaurants/${restaurantId}`, {
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
