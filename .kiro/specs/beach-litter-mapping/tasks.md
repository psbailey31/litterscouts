# Implementation Plan

## Frontend Foundation

- [x] 1. Set up project structure and dependencies
  - Install required frontend dependencies: Leaflet, React Query, Tailwind CSS, React Router, date-fns, chart libraries
  - Configure Tailwind CSS with Vite
  - Set up folder structure: components, pages, services, hooks, utils, types
  - Create TypeScript configuration for type safety
  - _Requirements: 8.1, 8.4_

- [x] 2. Implement authentication UI and state management
  - Create login and registration forms with validation
  - Implement JWT token storage and refresh logic
  - Create protected route wrapper component
  - Build authentication context provider
  - Create user profile display component
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 3. Build interactive map component with Leaflet
  - Initialize Leaflet map with OpenStreetMap tiles
  - Implement map zoom and pan controls
  - Add geolocation button to center map on user location
  - Create custom marker icons for different litter types
  - Implement marker click handlers to show report details
  - _Requirements: 2.1, 2.2, 2.3, 8.2_

- [x] 4. Implement marker clustering and filtering
  - Integrate Leaflet.markercluster plugin
  - Configure cluster radius and appearance
  - Build filter controls for date range, litter type, and quantity
  - Implement filter state management and map updates
  - _Requirements: 2.4, 2.5_

- [x] 5. Create heat map visualization
  - Integrate Leaflet.heat plugin
  - Implement heat map toggle control
  - Configure heat map intensity based on report density
  - Add heat map layer management
  - _Requirements: 3.1, 3.5_

## Report Submission System

- [x] 6. Build photo upload component with EXIF extraction
  - Create drag-and-drop photo upload interface
  - Implement file type and size validation
  - Integrate exifr library to extract GPS coordinates and timestamps
  - Display photo previews with metadata
  - Handle multiple photo uploads
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 8.3_

- [x] 7. Implement location selection interface
  - Auto-populate location from EXIF data when available
  - Add device GPS location capture button
  - Create map-based location picker for manual selection
  - Display selected location coordinates with accuracy indicator
  - Validate coordinate ranges for Ireland
  - _Requirements: 1.1, 1.2, 1.3, 8.2_

- [x] 8. Create litter report form
  - Build multi-step form with progress indicator
  - Implement litter type categorization dropdown
  - Create quantity estimation slider with visual indicators
  - Add optional description textarea
  - Implement form validation with error messages
  - Create environmental concerns section
  - _Requirements: 1.6, 1.7, 9.1, 9.2_

- [x] 9. Implement report submission and display
  - Connect form to API endpoint for report creation
  - Handle submission success and error states
  - Create report detail modal/popup component
  - Display report information with photos and metadata
  - Show verification status indicators
  - _Requirements: 1.8, 7.4_

## Analytics and Visualization

- [x] 10. Build analytics dashboard layout
  - Create dashboard page with responsive grid layout
  - Implement summary statistics cards (total reports, events, users)
  - Add date range selector component
  - Create export to CSV functionality
  - _Requirements: 5.1, 5.5_

- [x] 11. Implement data visualization charts
  - Create time series chart for report trends
  - Build pie chart for litter type distribution
  - Implement comparison metrics with previous periods
  - Add quantity estimation aggregation display
  - Configure chart responsiveness for mobile
  - _Requirements: 5.2, 5.3, 5.4_

- [x] 12. Create hotspot visualization
  - Fetch and display hotspot data on map
  - Implement color-coded severity indicators
  - Show hotspot boundaries and statistics
  - Create hotspot detail popup with report count
  - _Requirements: 3.2, 3.3, 3.5_

## Event Management

- [x] 13. Build event creation and management interface
  - Create event creation form with date/time picker
  - Implement location selection on map
  - Add participant registration functionality
  - Build event list view with filters
  - Create event detail page with participant count
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 14. Implement event completion workflow
  - Create event completion form for organizers
  - Add litter collected quantity input
  - Implement photo upload for cleanup results
  - Update event status and display completion data
  - _Requirements: 4.5_

## User Profile and Engagement

- [x] 15. Build user profile page
  - Display user statistics (reports, events attended)
  - Calculate and show impact score
  - Create personal contribution map
  - Implement activity timeline
  - Add profile editing functionality
  - _Requirements: 6.3, 6.4, 6.5_

- [x] 16. Implement notification preferences
  - Create notification settings interface
  - Build area of interest selector with map
  - Implement radius configuration (1-50km)
  - Add notification type toggles (email, in-app)
  - Save and load user preferences
  - _Requirements: 10.1, 10.4_

## Report Verification System

- [x] 17. Implement report verification interface
  - Add verify/dispute buttons to report details
  - Create verification comment form
  - Display verification count and status
  - Implement auto-hide logic for disputed reports (3+ disputes)
  - Show verification audit log
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

## Cleanup Tracking System

- [x] 18. Implement "Mark as Cleaned" functionality
  - Add `cleaned_at` timestamp field to reports table
  - Add `cleaned_by_user_id` field to track who marked it as cleaned
  - Create POST /api/reports/:id/mark-cleaned backend endpoint
  - Add "Mark as Cleaned" button to report popup on map
  - Update map markers to visually distinguish cleaned vs uncleaned reports (e.g., green vs red markers)
  - Add filter option to show/hide cleaned reports
  - Display cleanup date and user in report details
  - Implement authorization (only authenticated users can mark as cleaned)
  - _Requirements: Community engagement, impact tracking_

## External Data Integration

- [x] 19. Create external data display components
  - Build weather information widget
  - Implement tide times display
  - Add water quality indicator
  - Create beach quality rating display
  - Show marine biodiversity information when available
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.6, 11.7_

## Mobile Optimization

- [ ] 20. Implement mobile-responsive design
  - Apply Tailwind responsive classes throughout
  - Optimize map controls for touch interfaces
  - Ensure minimum tap target sizes (44x44px)
  - Test and optimize for screen widths 320px-768px
  - Implement mobile navigation menu
  - _Requirements: 8.1, 8.4_

- [x] 21. Optimize mobile performance
  - Implement code splitting and lazy loading
  - Add image optimization and lazy loading
  - Configure service worker for offline capability
  - Optimize bundle size and load times
  - Test on 4G network conditions
  - _Requirements: 8.5_

## Backend API Development

- [x] 22. Set up backend project structure
  - Initialize Node.js project with Express
  - Configure TypeScript for backend
  - Set up folder structure: routes, controllers, services, middleware, utils
  - Install dependencies: Prisma, JWT, Multer, bcrypt, express-validator
  - Create environment configuration
  - _Requirements: All backend requirements_

- [x] 23. Configure database with Prisma and MySQL spatial support
  - Set up MySQL 8.0+ with spatial data support
  - Create Prisma schema with all models (User, Report, Event, etc.)
  - Configure MySQL POINT spatial types for location fields
  - Create database migrations
  - Set up database indexes including spatial indexes for performance
  - _Requirements: 1.1, 2.1, 3.2, 4.1_

- [ ] 24. Implement authentication system
  - Create user registration endpoint with password hashing
  - Build login endpoint with JWT token generation
  - Implement refresh token logic with httpOnly cookies
  - Create authentication middleware for protected routes
  - Add rate limiting to auth endpoints
  - _Requirements: 6.1, 6.2_

- [ ] 25. Build report API endpoints
  - Create POST /api/reports endpoint for report submission
  - Implement GET /api/reports with filtering and pagination
  - Build GET /api/reports/:id for single report retrieval
  - Create PATCH /api/reports/:id for updates
  - Implement DELETE /api/reports/:id with authorization
  - Add spatial queries using MySQL spatial functions for location-based filtering
  - _Requirements: 1.1-1.8, 2.1, 2.4_

- [x] 26. Implement file upload and EXIF processing
  - Configure Multer for photo uploads to local filesystem
  - Set up uploads directory and configure Express static file serving
  - Implement EXIF metadata extraction with exifr
  - Add file validation (type, size limits)
  - Create photo URL generation for local storage paths
  - _Requirements: 1.2, 1.3, 1.4, 1.5_

- [ ] 27. Build event management endpoints
  - Create POST /api/events for event creation
  - Implement GET /api/events with filtering
  - Build event registration endpoint
  - Create event completion endpoint
  - Add participant count tracking
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 28. Implement analytics endpoints
  - Create GET /api/analytics/summary for overall statistics
  - Build time series data endpoint for trends
  - Implement CSV export functionality
  - Add aggregation queries for litter types and quantities
  - Create comparison calculations for period-over-period metrics
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 29. Build hotspot calculation system
  - Create scheduled job with node-cron for hotspot calculations
  - Implement MySQL spatial queries to identify clusters
  - Calculate severity scores based on report count and frequency
  - Store hotspot data in database
  - Create GET /api/analytics/hotspots endpoint
  - _Requirements: 3.2, 3.3, 3.4_

- [ ] 30. Implement verification system endpoints
  - Create POST /api/reports/:id/verify endpoint
  - Build POST /api/reports/:id/dispute endpoint
  - Implement verification count tracking
  - Add auto-hide logic for reports with 3+ disputes
  - Create verification audit log
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 31. Build user profile endpoints
  - Create GET /api/users/:id for profile retrieval
  - Implement PATCH /api/users/:id for profile updates
  - Build GET /api/users/:id/reports endpoint
  - Create GET /api/users/:id/events endpoint
  - Implement impact score calculation
  - Add notification preferences endpoint
  - _Requirements: 6.3, 6.4, 6.5, 10.4_

- [x] 32. Integrate external APIs with caching
  - Set up Redis for caching external API responses
  - Implement weather API integration (OpenWeatherMap)
  - Build tide API integration (WorldTides or NOAA)
  - Create EPA water quality data integration
  - Add beach quality rating integration
  - Implement 6-hour cache expiration
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [ ] 33. Implement notification system
  - Create notification service with area-of-interest matching
  - Build email notification integration (SendGrid)
  - Implement in-app notification storage and retrieval
  - Create scheduled job to check for new reports/events
  - Add notification delivery within 10-minute requirement
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 34. Add API security and validation
  - Implement request validation with Zod schemas
  - Add rate limiting middleware
  - Configure CORS for allowed origins
  - Implement input sanitization
  - Add security headers (helmet)
  - Create error handling middleware
  - _Requirements: All security-related requirements_

- [ ] 35. Implement environmental concerns endpoints
  - Create endpoints for submitting environmental concerns
  - Build filtering and retrieval for concern types
  - Implement linking of related reports within 100m
  - Add JSON export endpoint for research integration
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

## Integration and Polish

- [ ] 36. Connect frontend to backend APIs
  - Configure API base URL and axios/fetch setup
  - Implement React Query hooks for all endpoints
  - Add error handling and retry logic
  - Create loading states for all async operations
  - Implement optimistic updates where appropriate
  - _Requirements: All integration requirements_

- [ ] 37. Implement error handling and user feedback
  - Create toast notification system for user feedback
  - Add error boundaries for React components
  - Implement form validation error displays
  - Create user-friendly error messages
  - Add loading spinners and skeleton screens
  - _Requirements: All UX requirements_

- [ ]* 38. Write integration tests
  - Create API endpoint tests with Supertest
  - Test authentication flows
  - Test file upload pipeline
  - Test spatial queries with MySQL
  - Test external API integration with mocks
  - _Requirements: All requirements_

- [ ] 39. Set up deployment configuration
  - Create Docker configuration for development
  - Set up environment variables for production
  - Configure build scripts for frontend and backend
  - Create database migration scripts
  - Document deployment process
  - _Requirements: Infrastructure requirements_
