# Litter Scouts - Source Code

This directory contains the frontend source code for Litter Scouts.

## Project Structure

```
src/
├── components/       # React components organized by feature
├── pages/           # Page-level components for routing
├── services/        # API clients and external service integrations
├── hooks/           # Custom React hooks
├── utils/           # Utility functions and helpers
├── types/           # TypeScript type definitions
├── App.tsx          # Main application component
├── main.tsx         # Application entry point
└── index.css        # Global styles with Tailwind CSS
```

## Technology Stack

### Core
- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server

### Routing & State
- **React Router** - Client-side routing
- **React Query (@tanstack/react-query)** - Server state management

### Authentication
- **Clerk** - User authentication and management

### Mapping
- **Leaflet** - Interactive maps
- **OpenStreetMap** - Free map tiles
- **Leaflet.heat** - Heat map visualization
- **Leaflet.markercluster** - Marker clustering

### Styling
- **Tailwind CSS v4** - Utility-first CSS framework

### Data Visualization
- **Recharts** - Charts and graphs

### Utilities
- **date-fns** - Date manipulation

## Path Aliases

The project uses TypeScript path aliases for cleaner imports:

```typescript
import { Report } from '@/types';
import { apiClient } from '@/services/api';
import { useGeolocation } from '@/hooks';
import { isValidIrishCoordinates } from '@/utils';
```

Available aliases:
- `@/*` → `src/*`
- `@/components/*` → `src/components/*`
- `@/pages/*` → `src/pages/*`
- `@/services/*` → `src/services/*`
- `@/hooks/*` → `src/hooks/*`
- `@/utils/*` → `src/utils/*`
- `@/types/*` → `src/types/*`

## Environment Variables

Required environment variables (see `.env.local`):

```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=your_publishable_key

# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Key Files

### `main.tsx`
Application entry point that renders the root component.

### `App.tsx`
Main application component that sets up:
- Clerk authentication provider
- React Query client
- React Router
- Global layout

### `types/index.ts`
Central type definitions for:
- Domain models (Report, Event, User, etc.)
- DTOs (Data Transfer Objects)
- Enums (LitterType, QuantityLevel, etc.)

### `services/api.ts`
Base API client with methods for HTTP requests.

### `hooks/useGeolocation.ts`
Custom hook for accessing device geolocation.

### `utils/index.ts`
Utility functions for:
- Coordinate validation
- Distance calculations
- File validation
- Date formatting

## Next Steps

The following components and features will be implemented in subsequent tasks:
1. Map interface with Leaflet
2. Report submission form
3. Analytics dashboard
4. Event management
5. User profile
6. Verification system
