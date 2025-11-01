# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code
- Always prefer to create new component instead of creating fat components unless there is a very good reason.
- Prefer Typescript types over interfaces, unless there is a very good reason.
- Always use/install shadcn components whenever you need a new component like Card, Button, Input etc..

## Commands

### Development
- `npm run dev` - Start development server with Turbopack (recommended)
- `npm run build` - Build for production using Turbopack
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `bunx --bun shadcn@latest add <component_name>` - Add wanted component to the project

Note: This project uses Turbopack for both development and production builds for improved performance.

## Architecture Overview

This is a Next.js 15 (App Router) map-based POI (Point of Interest) discovery application with the following key architecture:

### Core Components
- **Map Component** (`components/Map.tsx`) - Main Mapbox GL JS integration with POI rendering, user location, and interactive features
- **POI System** - Points of interest fetched from backend API and displayed on map with emoji icons
- **Search & Chat** - Integrated search bar that doubles as a chat interface when POI is selected
- **State Management** - Zustand store with persistence for app state

### Data Flow
1. **POI Loading**: App fetches POIs from backend API via `lib/backendPoiApi.ts`
2. **Map Integration**: POIs are transformed to GeoJSON and rendered on Mapbox with custom emoji markers
3. **Filtering**: POIs filtered by search query and user location proximity (10km radius)
4. **User Interaction**: Click POI → show details card; search activates filtering or chat mode

### Key Technical Details

#### State Management (`store/generalStore.ts`)
- Uses Zustand with persistence middleware
- Manages: selected POI, search query, user location, chat state
- Zustand partialize set to empty object (no state persisted to localStorage)

#### POI API Integration (`lib/backendPoiApi.ts`)
- Backend POI format transformation to frontend POI structure
- Smart name resolution (handles null/duplicate names from backend)
- Type-to-emoji mapping for 30+ business categories
- Haversine distance calculation for location filtering
- Environment variable: `NEXT_PUBLIC_BACKEND_API_URL`

#### Map Implementation
- Mapbox GL JS with `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`
- Custom emoji markers generated using Canvas API
- GeoJSON source for POI data with circle + icon layers
- Auto-fit bounds to POIs on load, fly-to on user location/POI selection
- Geolocation control integration

#### UI Framework
- Tailwind CSS with custom config
- Radix UI primitives for base components
- Lucide React icons
- Sonner for toast notifications
- next-themes for theme support

### Environment Variables Required
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` - Mapbox API key
- `NEXT_PUBLIC_BACKEND_API_URL` - Backend API endpoint for POI data

### File Structure
- `/app` - Next.js App Router pages (layout, page, manifest)
- `/components` - React components (Map, POICard, FloatingChat, UI primitives)
- `/lib` - Utilities and API functions
- `/store` - Zustand state management
- `/public` - Static assets