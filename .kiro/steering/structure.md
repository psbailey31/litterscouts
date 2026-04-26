# Project Structure

## Directory Organization

```
src/
├── components/       # React components organized by feature
│   ├── auth/        # Authentication components (SignIn, SignUp, ProtectedRoute)
│   ├── layout/      # Layout components (Header, Footer, Navigation)
│   └── map/         # Map components (MapView, MapFilters)
├── pages/           # Page-level components for routing
├── services/        # API clients and external service integrations
├── hooks/           # Custom React hooks
├── utils/           # Utility functions and helpers
├── types/           # TypeScript type definitions
├── App.tsx          # Main application component with routing
├── main.tsx         # Application entry point
└── index.css        # Global styles with Tailwind directives
```

## Component Organization

Components are organized by **feature/domain** rather than by type:

- `components/auth/` - All authentication-related components
- `components/map/` - All mapping-related components
- `components/layout/` - Shared layout components
- Each feature folder includes an `index.ts` for clean exports

## File Naming Conventions

- **Components**: PascalCase (e.g., `MapView.tsx`, `ReportForm.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.ts`, `useGeolocation.ts`)
- **Services**: camelCase (e.g., `api.ts`, `reportService.ts`)
- **Utils**: camelCase (e.g., `validation.ts`, `coordinates.ts`)
- **Types**: PascalCase for interfaces/types in `types/index.ts`

## Import/Export Patterns

Each feature directory includes an `index.ts` barrel file for clean exports:

```typescript
// components/map/index.ts
export { MapView } from './MapView';
export { MapFilters } from './MapFilters';

// Usage elsewhere
import { MapView, MapFilters } from '@/components/map';
```

## Page Structure

Pages in `src/pages/` correspond to routes:

- `HomePage.tsx` - Landing page
- `MapPage.tsx` - Interactive map view
- `ReportFormPage.tsx` - Report submission form
- `EventsPage.tsx` - Event listing and management
- `AnalyticsPage.tsx` - Analytics dashboard

All pages are exported through `pages/index.ts` for centralized route configuration.

## Type Definitions

Centralized in `src/types/index.ts`:

- Domain models (Report, Event, User)
- DTOs (Data Transfer Objects)
- Enums (LitterType, QuantityLevel, VerificationStatus)
- API response types

## Service Layer

Services in `src/services/` handle external communication:

- `api.ts` - Base API client with HTTP methods
- `reportService.ts` - Report-related API calls
- `eventService.ts` - Event-related API calls
- `analyticsService.ts` - Analytics API calls
- `exifService.ts` - EXIF metadata extraction

## Hooks

Custom hooks in `src/hooks/`:

- `useAuth.ts` - Authentication state and methods (Clerk wrapper)
- `useGeolocation.ts` - Device geolocation access
- Additional hooks as needed for shared logic

## Utilities

Helper functions in `src/utils/`:

- Coordinate validation
- Distance calculations
- File validation
- Date formatting
- Other pure utility functions

## Styling Approach

- **Tailwind CSS** for component styling
- Utility classes directly in JSX
- Global styles in `index.css` (minimal)
- No CSS modules or styled-components

## Authentication Pattern

- Clerk handles all authentication
- Use `<SignedIn>` and `<SignedOut>` components for conditional rendering
- Use `<ProtectedRoute>` wrapper for authenticated pages
- Access user with `useUser()` hook from Clerk

## State Management

- **Local state**: React useState for component-specific state
- **Server state**: React Query for API data fetching/caching
- **Auth state**: Clerk provider
- No Redux or other global state libraries
