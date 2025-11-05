import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Compare two objects and return only the changed fields from the updated object
 * Handles arrays by doing deep equality checks
 */
export function getChangedFields<T extends Record<string, any>>(
  original: T | undefined,
  updated: T
): Partial<T> {
  if (!original) {
    return updated;
  }

  const changes: Partial<T> = {};

  for (const key in updated) {
    const originalValue = original[key];
    const updatedValue = updated[key];

    // Handle array comparison
    if (Array.isArray(originalValue) && Array.isArray(updatedValue)) {
      // Check if arrays have different lengths or different values
      if (
        originalValue.length !== updatedValue.length ||
        !originalValue.every((val, idx) => val === updatedValue[idx])
      ) {
        changes[key] = updatedValue;
      }
    }
    // Handle primitive values
    else if (originalValue !== updatedValue) {
      changes[key] = updatedValue;
    }
  }

  return changes;
}
