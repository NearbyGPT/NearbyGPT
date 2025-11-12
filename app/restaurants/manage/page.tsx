"use client";

import { useState, useEffect } from "react";
import { RestaurantForm } from "@/components/RestaurantForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  getRestaurants,
  createRestaurant,
  updateRestaurant,
} from "@/lib/restaurantApi";
import { Restaurant, RestaurantFormData } from "@/lib/types/restaurant";
import { toast } from "sonner";

export default function ManageRestaurantPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<
    string | null
  >(null);
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingRestaurants, setIsFetchingRestaurants] = useState(true);
  const [mode, setMode] = useState<"create" | "edit">("create");

  // Fetch restaurants on component mount
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const data = await getRestaurants();
        setRestaurants(data);
      } catch (error) {
        console.error("Failed to fetch restaurants:", error);
        toast.error("Failed to load restaurants");
      } finally {
        setIsFetchingRestaurants(false);
      }
    };

    fetchRestaurants();
  }, []);

  // Update selected restaurant when ID changes
  useEffect(() => {
    if (selectedRestaurantId) {
      const restaurant = restaurants.find((r) => r.id === selectedRestaurantId);
      setSelectedRestaurant(restaurant || null);
      setMode("edit");
    } else {
      setSelectedRestaurant(null);
      setMode("create");
    }
  }, [selectedRestaurantId, restaurants]);

  const handleSubmit = async (data: RestaurantFormData | Partial<RestaurantFormData>) => {
    setIsLoading(true);
    try {
      if (mode === "edit" && selectedRestaurantId) {
        // Update existing restaurant - data may contain only changed fields
        const updated = await updateRestaurant(selectedRestaurantId, data);
        toast.success("Restaurant updated successfully!");

        // Update the restaurant in the list
        setRestaurants((prev) =>
          prev.map((r) => (r.id === selectedRestaurantId ? updated : r))
        );
        setSelectedRestaurant(updated);
      } else {
        // Create new restaurant - data should contain all required fields
        const created = await createRestaurant(data as RestaurantFormData);
        toast.success("Restaurant created successfully!");

        // Add the new restaurant to the list
        setRestaurants((prev) => [...prev, created]);

        // Reset form
        setSelectedRestaurantId(null);
        setSelectedRestaurant(null);
        setMode("create");

        // Scroll to top of the page
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (error) {
      console.error("Failed to save restaurant:", error);
      toast.error(
        mode === "edit"
          ? "Failed to update restaurant"
          : "Failed to create restaurant"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedRestaurantId(null);
    setSelectedRestaurant(null);
    setMode("create");
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Manage Restaurants</h1>
        <p className="text-muted-foreground">
          Create a new restaurant or edit an existing one
        </p>
      </div>

      {/* Restaurant Selector */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Select Action</CardTitle>
          <CardDescription>
            Choose to create a new restaurant or edit an existing one
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="restaurant-select">Edit Existing Restaurant</Label>
              <Select
                value={selectedRestaurantId || ""}
                onValueChange={(value) =>
                  setSelectedRestaurantId(value || null)
                }
                disabled={isFetchingRestaurants}
              >
                <SelectTrigger id="restaurant-select">
                  <SelectValue
                    placeholder={
                      isFetchingRestaurants
                        ? "Loading restaurants..."
                        : "Select a restaurant to edit"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {restaurants.map((restaurant) => (
                    <SelectItem key={restaurant.id} value={restaurant.id!}>
                      {restaurant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleCreateNew}
                disabled={mode === "create"}
              >
                Create New Restaurant
              </Button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            {mode === "create" ? (
              <p>Creating a new restaurant</p>
            ) : (
              <p>
                Editing: <span className="font-medium">{selectedRestaurant?.name}</span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Restaurant Form */}
      <RestaurantForm
        key={selectedRestaurantId || "new"}
        initialData={selectedRestaurant || undefined}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
