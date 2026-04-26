# Litter Scouts - Design Document

## Overview

Litter Scouts is a full-stack web application that enables crowdsourced environmental monitoring of Irish coastal areas. The system combines modern web technologies with geospatial data processing to create an interactive platform for reporting, visualizing, and addressing beach litter and environmental concerns.

### Technology Stack

**Frontend:**
- React 18+ with TypeScript for type-safe component development
- Vite for build tooling
- Clerk React SDK (@clerk/clerk-react) for authentication
- Leaflet.js for interactive mapping (free, open-source alternative to Google Maps)
- OpenStreetMap tiles as the base map layer (free)
- Leaflet.heat plugin for heat map visualization
- Leaflet.markercluster for marker clustering
- React Query for server state management
- Tailwind CSS for responsive styling

**Backend:**
- Node.js with Express.js for REST API
- MySQL 8.0+ for database with spatial data support
- Prisma ORM for database access and migrations (or Sequelize as alternative)
- Clerk for authentication and user management
- Multer for file upload handling
- exifr library for EXIF metadata extraction
- Node-cron for scheduled tasks (hotspot calculations, notifications)

**Infrastructure:**
- Cloud storage (AWS S3 or Cloudinary) for photo storage
- Redis for caching external API responses
- Email service (SendGrid or similar) for notifications

**External APIs:**
- OpenWeatherMap API (free tier) for weather data
- WorldTides API or NOAA for tide information
- Irish EPA Open Data Portal for water quality
- OpenStreetMap Nominatim for reverse geocoding

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Map View     │  │ Report Form  │  │ Analytics    │      │
│  │ (Leaflet)    │  │              │  │ Dashboard    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Event Mgmt   │  │ User Profile │  │ Notifications│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS/REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                       │
│                    (Express.js Router)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Auth         │  │ Rate Limiting│  │ Validation   │      │
│  │ Middleware   │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Service Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Report       │  │ Event        │  │ Analytics    │      │
│  │ Service      │  │ Service      │  │ Service      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ User         │  │ Notification │  │ External API │      │
│  │ Service      │  │ Service      │  │ Service      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Data Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ PostgreSQL   │  │ Redis Cache  │  │ Cloud Storage│      │
│  │ + PostGIS    │  │              │  │ (Photos)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  External Services                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Weather API  │  │ Tide API     │  │ EPA Data     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Design Patterns

1. **Repository Pattern**: Abstracts data access logic from business logic
2. **Service Layer Pattern**: Encapsulates business logic separate from API routes
3. **Dependency Injection**: Services receive dependencies through constructors
4. **Factory Pattern**: For creating complex objects like notifications
5. **Observer Pattern**: For event-driven notifications

## Components and Interfaces

### Frontend Components

#### 1. Map Interface Component


**Purpose**: Interactive map displaying litter reports and environmental data

**Key Features**:
- Leaflet map with OpenStreetMap tiles
- Custom marker icons for different litter types
- Marker clustering for dense areas
- Heat map overlay toggle
- Filter controls (date, type, quantity)
- Click handlers for marker details
- Geolocation button for user positioning

**Props Interface**:
```typescript
interface MapInterfaceProps {
  reports: LitterReport[];
  events: CleanupEvent[];
  filters: FilterState;
  onMarkerClick: (reportId: string) => void;
  onMapClick: (lat: number, lng: number) => void;
  showHeatmap: boolean;
  showClusters: boolean;
}
```

#### 2. Report Form Component

**Purpose**: Multi-step form for submitting litter reports

**Key Features**:
- Photo upload with drag-and-drop
- EXIF metadata extraction on upload
- Location selection (auto from EXIF, device GPS, or map picker)
- Litter categorization dropdown
- Quantity estimation slider
- Optional description textarea
- Form validation
- Progress indicator

**Props Interface**:
```typescript
interface ReportFormProps {
  onSubmit: (report: CreateReportDTO) => Promise<void>;
  initialLocation?: Coordinates;
  onCancel: () => void;
}
```

#### 3. Analytics Dashboard Component

**Purpose**: Data visualization and statistics display

**Key Features**:
- Chart.js or Recharts for data visualization
- Time series charts for report trends
- Pie charts for litter type distribution
- Summary statistics cards
- Date range selector
- Export to CSV button
- Comparison metrics (vs previous period)

#### 4. Event Management Component

**Purpose**: Create and manage cleanup events

**Key Features**:
- Event creation form
- Calendar date/time picker
- Location selector on map
- Participant list display
- Registration button
- Event completion form
- Photo gallery of cleanup results

#### 5. User Profile Component

**Purpose**: Display user contributions and impact

**Key Features**:
- User statistics (reports submitted, events attended)
- Impact score calculation and display
- Personal map of contributions
- Achievement badges
- Activity timeline

### Backend API Endpoints

#### Authentication Endpoints

Authentication is handled by Clerk. The backend uses Clerk's middleware to verify session tokens.

```
POST   /api/webhooks/clerk       # Clerk webhook for user sync
GET    /api/auth/session         # Verify current session (protected)
```

#### Report Endpoints

```
GET    /api/reports              # List reports with filters
GET    /api/reports/:id          # Get single report
POST   /api/reports              # Create new report
PATCH  /api/reports/:id          # Update report
DELETE /api/reports/:id          # Delete report
POST   /api/reports/:id/verify   # Verify report
POST   /api/reports/:id/dispute  # Dispute report
```

#### Event Endpoints

```
GET    /api/events               # List events
GET    /api/events/:id           # Get single event
POST   /api/events               # Create event
PATCH  /api/events/:id           # Update event
DELETE /api/events/:id           # Delete event
POST   /api/events/:id/register  # Register for event
POST   /api/events/:id/complete  # Mark event complete
```

#### Analytics Endpoints

```
GET    /api/analytics/summary    # Overall statistics
GET    /api/analytics/trends     # Time series data
GET    /api/analytics/hotspots   # Litter hotspot data
GET    /api/analytics/export     # Export data as CSV
```

#### User Endpoints

```
GET    /api/users/:id            # Get user profile
PATCH  /api/users/:id            # Update profile
GET    /api/users/:id/reports    # User's reports
GET    /api/users/:id/events     # User's events
PATCH  /api/users/:id/preferences # Update notification preferences
```

#### External Data Endpoints

```
GET    /api/external/weather/:lat/:lng     # Weather data
GET    /api/external/tides/:lat/:lng       # Tide information
GET    /api/external/water-quality/:lat/:lng # EPA water quality
```

## Data Models

### Database Configuration

**Connection Details:**
- Database: MySQL 8.0+
- Host: 192.168.4.20
- Port: 3306
- Database Name: beach_litter_mapping
- User: beach_litter_user
- Connection String: `mysql://beach_litter_user:BeachClean2024!@192.168.4.20:3306/beach_litter_mapping`

**Environment Variables:**
```env
DATABASE_URL=mysql://beach_litter_user:BeachClean2024!@192.168.4.20:3306/beach_litter_mapping
DB_HOST=192.168.4.20
DB_PORT=3306
DB_NAME=beach_litter_mapping
DB_USER=beach_litter_user
DB_PASSWORD=BeachClean2024!
```

### Authentication Configuration (Clerk)

**Frontend Setup:**
1. Install Clerk React SDK: `npm install @clerk/clerk-react@latest`
2. Set `VITE_CLERK_PUBLISHABLE_KEY` in `.env.local`
3. Wrap app in `<ClerkProvider>` in `main.tsx`
4. Use Clerk components: `<SignedIn>`, `<SignedOut>`, `<SignInButton>`, `<SignUpButton>`, `<UserButton>`

**Backend Setup:**
1. Install Clerk SDK: `npm install @clerk/clerk-sdk-node`
2. Set `CLERK_SECRET_KEY` for API authentication
3. Set `CLERK_WEBHOOK_SECRET` for webhook verification
4. Use Clerk middleware to protect routes
5. Set up webhook endpoint to sync user data

**Clerk Environment Variables:**
```env
# Frontend (.env.local)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# Backend (.env)
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
```

### Database Schema

#### User Table (MySQL)
```sql
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,  -- Clerk user ID
    clerk_id VARCHAR(255) UNIQUE NOT NULL,  -- Clerk user ID for reference
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Profile (synced from Clerk)
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url VARCHAR(500),
    
    -- App-specific data
    impact_score INT DEFAULT 0,
    
    -- Preferences
    notification_email BOOLEAN DEFAULT TRUE,
    notification_in_app BOOLEAN DEFAULT TRUE,
    areas_of_interest JSON,
    
    INDEX idx_clerk_id (clerk_id),
    INDEX idx_email (email),
    INDEX idx_username (username)
) ENGINE=InnoDB;
```

**TypeScript Interface:**
```typescript
interface User {
  id: string;  // Clerk user ID
  clerkId: string;
  email: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  impactScore: number;
  notificationEmail: boolean;
  notificationInApp: boolean;
  areasOfInterest?: Array<{lat: number, lng: number, radius: number}>;
}
```

**Note:** User authentication is handled entirely by Clerk. The users table stores only app-specific data and syncs basic profile information from Clerk via webhooks.

#### Report Table (MySQL)
```sql
CREATE TABLE reports (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    
    -- Location (using POINT spatial type)
    location POINT NOT NULL SRID 4326,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    location_source ENUM('exif', 'gps', 'manual') NOT NULL,
    
    -- Content
    photo_urls JSON NOT NULL,
    photo_timestamp TIMESTAMP NULL,
    litter_type ENUM('plastic', 'metal', 'glass', 'organic', 'hazardous', 'other') NOT NULL,
    quantity ENUM('minimal', 'moderate', 'significant', 'severe') NOT NULL,
    description TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Verification
    verification_status ENUM('pending', 'verified', 'disputed') DEFAULT 'pending',
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    SPATIAL INDEX idx_location (location),
    INDEX idx_created_at (created_at),
    INDEX idx_litter_type (litter_type),
    INDEX idx_lat_lng (latitude, longitude)
) ENGINE=InnoDB;
```

**TypeScript Interface:**
```typescript
interface Report {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  locationSource: 'exif' | 'gps' | 'manual';
  photoUrls: string[];
  photoTimestamp?: Date;
  litterType: 'plastic' | 'metal' | 'glass' | 'organic' | 'hazardous' | 'other';
  quantity: 'minimal' | 'moderate' | 'significant' | 'severe';
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  submittedAt: Date;
  verificationStatus: 'pending' | 'verified' | 'disputed';
}
```

#### Event Table (MySQL)
```sql
CREATE TABLE events (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    organizer_id VARCHAR(36) NOT NULL,
    
    -- Details
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location POINT NOT NULL SRID 4326,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    
    -- Timing
    scheduled_date TIMESTAMP NOT NULL,
    duration INT NOT NULL COMMENT 'Duration in minutes',
    
    -- Status
    status ENUM('upcoming', 'completed', 'cancelled') DEFAULT 'upcoming',
    participant_count INT DEFAULT 0,
    litter_collected DECIMAL(10, 2) COMMENT 'Kilograms collected',
    photos JSON,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE,
    SPATIAL INDEX idx_location (location),
    INDEX idx_scheduled_date (scheduled_date),
    INDEX idx_status (status)
) ENGINE=InnoDB;
```

#### EventRegistration Table (MySQL)
```sql
CREATE TABLE event_registrations (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    event_id VARCHAR(36) NOT NULL,
    
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attended BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_event (user_id, event_id)
) ENGINE=InnoDB;
```

#### Verification Table (MySQL)
```sql
CREATE TABLE verifications (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    report_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    
    verification_type ENUM('verify', 'dispute') NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_report_user (report_id, user_id)
) ENGINE=InnoDB;
```

#### EnvironmentalConcern Table (MySQL)
```sql
CREATE TABLE environmental_concerns (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    report_id VARCHAR(36) NOT NULL,
    
    concern_type VARCHAR(100) NOT NULL COMMENT 'water_quality, erosion, wildlife_impact, algae_bloom, etc.',
    severity ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    description TEXT NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
    INDEX idx_concern_type (concern_type)
) ENGINE=InnoDB;
```

#### Hotspot Table (MySQL)
```sql
CREATE TABLE hotspots (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    location POINT NOT NULL SRID 4326,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    radius DECIMAL(10, 2) NOT NULL COMMENT 'Radius in meters',
    
    report_count INT NOT NULL,
    severity_score DECIMAL(5, 2) NOT NULL,
    last_report_date TIMESTAMP NOT NULL,
    
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    SPATIAL INDEX idx_location (location),
    INDEX idx_severity_score (severity_score)
) ENGINE=InnoDB;
```

### Data Transfer Objects (DTOs)

#### CreateReportDTO
```typescript
interface CreateReportDTO {
  photos: File[];
  latitude?: number;
  longitude?: number;
  locationSource: 'exif' | 'gps' | 'manual';
  litterType: LitterType;
  quantity: QuantityLevel;
  description?: string;
  environmentalConcerns?: {
    type: string;
    severity: string;
    description: string;
  }[];
}
```

#### ReportResponseDTO
```typescript
interface ReportResponseDTO {
  id: string;
  user: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  location: {
    latitude: number;
    longitude: number;
  };
  photoUrls: string[];
  photoTimestamp?: string;
  litterType: LitterType;
  quantity: QuantityLevel;
  description?: string;
  verificationStatus: VerificationStatus;
  verificationCount: number;
  disputeCount: number;
  createdAt: string;
  environmentalConcerns: EnvironmentalConcernDTO[];
}
```

## Error Handling

### Error Response Format

All API errors follow a consistent format:

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  }
}
```

### Error Codes

```typescript
enum ErrorCode {
  // Authentication
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_COORDINATES = 'INVALID_COORDINATES',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  
  // Resources
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',
  
  // Permissions
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // External Services
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  GEOCODING_FAILED = 'GEOCODING_FAILED',
  
  // Server
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
}
```

### Error Handling Strategy

1. **Input Validation**: Use Zod schemas for request validation at API boundary
2. **Try-Catch Blocks**: Wrap async operations with proper error handling
3. **Error Middleware**: Global Express error handler for consistent responses
4. **Logging**: Winston logger for error tracking and debugging
5. **User-Friendly Messages**: Transform technical errors into readable messages
6. **Retry Logic**: Implement exponential backoff for external API calls
7. **Circuit Breaker**: Prevent cascading failures from external services

### Frontend Error Handling

1. **Error Boundaries**: React error boundaries for component-level errors
2. **Toast Notifications**: User-friendly error messages via toast library
3. **Retry Mechanisms**: Automatic retry for failed API calls
4. **Offline Support**: Queue actions when offline, sync when online
5. **Validation Feedback**: Real-time form validation with clear messages

## Testing Strategy

### Unit Testing

**Backend**:
- Jest for test framework
- Test all service layer functions
- Mock database calls with Prisma mock
- Test utility functions (EXIF extraction, coordinate validation)
- Target: 80% code coverage

**Frontend**:
- Vitest for test framework
- React Testing Library for component tests
- Test user interactions and state changes
- Mock API calls with MSW (Mock Service Worker)
- Target: 70% code coverage

### Integration Testing

- Test API endpoints with Supertest
- Use test database with Docker
- Test authentication flows
- Test file upload pipeline
- Test external API integration with mocked responses

### End-to-End Testing

- Playwright or Cypress for E2E tests
- Test critical user journeys:
  - User registration and login
  - Submit report with photo
  - View reports on map
  - Create and register for event
  - View analytics dashboard
- Run on CI/CD pipeline

### Performance Testing

- Load testing with Artillery or k6
- Test concurrent report submissions
- Test map rendering with 1000+ markers
- Test database query performance with PostGIS
- Monitor API response times

### Accessibility Testing

- Axe DevTools for automated a11y testing
- Manual keyboard navigation testing
- Screen reader compatibility (NVDA, JAWS)
- WCAG 2.1 AA compliance target
- Color contrast validation

## Security Considerations

### Authentication & Authorization

- Clerk handles all authentication (sign-up, sign-in, password management, MFA)
- Session tokens verified via Clerk middleware on backend
- User data synced to local database via Clerk webhooks
- Rate limiting on API endpoints
- Clerk provides built-in email verification and social auth options

### Data Protection

- HTTPS only in production
- Input sanitization to prevent XSS
- Parameterized queries to prevent SQL injection
- CORS configuration for allowed origins
- Content Security Policy headers

### File Upload Security

- File type validation (MIME type checking)
- File size limits (5MB per photo)
- Virus scanning for uploaded files
- Separate storage domain for user content
- Strip EXIF data except GPS/timestamp before public display

### API Security

- Rate limiting per IP and per user
- API key rotation for external services
- Secrets management (environment variables)
- Request validation with Zod schemas
- CSRF protection for state-changing operations

## Performance Optimization

### Frontend Optimization

- Code splitting by route
- Lazy loading for map components
- Image optimization and lazy loading
- Virtual scrolling for large lists
- Debouncing for search and filter inputs
- Service worker for offline capability
- CDN for static assets

### Backend Optimization

- Database indexing on frequently queried fields
- PostGIS spatial indexes for location queries
- Redis caching for:
  - External API responses (6 hours)
  - Hotspot calculations (15 minutes)
  - Analytics aggregations (1 hour)
- Connection pooling for database
- Pagination for list endpoints
- Compression middleware (gzip)

### Database Optimization

- Materialized views for hotspot calculations
- Scheduled jobs to refresh materialized views
- Partitioning for large tables (by date)
- Query optimization with EXPLAIN ANALYZE
- Read replicas for analytics queries

## Deployment Architecture

### Development Environment

- Docker Compose for local development
- PostgreSQL + PostGIS container
- Redis container
- Hot reload for frontend and backend
- Mock external APIs for testing

### Production Environment

- Frontend: Vercel or Netlify
- Backend: Railway, Render, or AWS ECS
- Database: Managed PostgreSQL (AWS RDS, Supabase)
- Redis: Managed Redis (AWS ElastiCache, Upstash)
- Storage: AWS S3 or Cloudinary
- CDN: CloudFlare
- Monitoring: Sentry for error tracking
- Analytics: Plausible or Google Analytics

### CI/CD Pipeline

1. GitHub Actions workflow
2. Run linting and type checking
3. Run unit and integration tests
4. Build Docker images
5. Deploy to staging environment
6. Run E2E tests on staging
7. Deploy to production (manual approval)

## Scalability Considerations

### Horizontal Scaling

- Stateless API servers (can add more instances)
- Load balancer for API traffic
- Database read replicas for analytics
- CDN for static content and images

### Data Growth Strategy

- Archive old reports (>2 years) to cold storage
- Implement data retention policies
- Optimize photo storage with compression
- Use database partitioning for time-series data

### Future Enhancements

- Mobile native apps (React Native)
- Real-time updates with WebSockets
- Machine learning for litter type classification from photos
- Gamification with leaderboards and achievements
- Integration with local government systems
- Multi-language support for international expansion
- API for third-party integrations
- Blockchain for verified cleanup certificates
