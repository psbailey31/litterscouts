# Technology Stack

## Frontend

- **React 19** with **TypeScript** for type-safe development
- **Vite** for build tooling and dev server
- **React Router** for client-side routing
- **Tailwind CSS v4** for styling (utility-first)
- **Clerk** (@clerk/clerk-react) for authentication
- **React Query** (@tanstack/react-query) for server state management

### Mapping & Visualization

- **Leaflet** for interactive maps (free, open-source)
- **OpenStreetMap** tiles as base layer
- **Leaflet.heat** for heat map overlays
- **Leaflet.markercluster** for marker clustering
- **Recharts** for charts and data visualization

### Utilities

- **date-fns** for date manipulation

## Backend (Planned)

- **Node.js** with **Express.js** REST API
- **MySQL 8.0+** database with spatial data support
- **Prisma** ORM for database access
- **Clerk** for authentication (backend SDK)
- **Multer** for file uploads
- **exifr** for EXIF metadata extraction
- **Redis** for caching external API responses

## Path Aliases

Use TypeScript path aliases for cleaner imports:

```typescript
import { Report } from '@/types';
import { apiClient } from '@/services/api';
import { useGeolocation } from '@/hooks';
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

Required in `.env.local`:

```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=your_publishable_key

# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api
```

## Common Commands

```bash
# Development
npm run dev          # Start dev server (http://localhost:5173)

# Build
npm run build        # Production build to dist/

# Preview
npm run preview      # Preview production build locally

# Linting
npm run lint         # Run ESLint
```

## TypeScript Configuration

- **Strict mode** enabled
- **noUnusedLocals** and **noUnusedParameters** enforced
- **noUncheckedIndexedAccess** for safer array/object access
- **JSX**: react-jsx (React 17+ transform)
- **Module resolution**: bundler mode

## Code Quality

- ESLint with React hooks and React refresh plugins
- Strict TypeScript checking
- No unused variables/parameters allowed
