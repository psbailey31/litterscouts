# Database Configuration

## Overview

This project uses **MySQL 8.0+** with spatial data support for storing geographical information about beach litter reports, cleanup events, and environmental concerns.

## Database Connection

**Connection Details:**
- Host: 192.168.4.20
- Port: 3306
- Database: beach_litter_mapping
- User: beach_litter_user

**Environment Variable:**
```env
DATABASE_URL="mysql://beach_litter_user:BeachClean2024!@192.168.4.20:3306/beach_litter_mapping"
```

## Spatial Data Support

The database uses MySQL's spatial data types and functions:

- **POINT type with SRID 4326**: Used for storing GPS coordinates (WGS 84 coordinate system)
- **Spatial indexes**: Optimized for location-based queries
- Tables with spatial data: `reports`, `events`, `hotspots`

### Spatial Columns

Each table with location data has:
- `location` (POINT SRID 4326): Spatial column for efficient geographical queries
- `latitude` (DECIMAL(10,8)): Decimal latitude for easy access
- `longitude` (DECIMAL(11,8)): Decimal longitude for easy access

## Schema Models

### Users
- Clerk-based authentication (clerkId field)
- Profile information synced from Clerk
- App-specific data: impact score, notification preferences, areas of interest

### Reports
- Litter reports with photos and GPS coordinates
- Spatial indexing for location-based queries
- Verification status tracking
- Environmental concerns linked to reports

### Events
- Cleanup events with location and scheduling
- Participant registration tracking
- Completion data (litter collected, photos)

### Verifications
- Community-driven report verification
- Tracks verify/dispute actions
- Audit trail with timestamps

### Environmental Concerns
- Additional environmental issues beyond litter
- Linked to reports
- Severity levels and categorization

### Hotspots
- Calculated areas with high litter concentration
- Spatial queries to identify clusters
- Severity scoring based on report frequency

## Indexes

### Standard Indexes
- Primary keys on all tables (UUID)
- Foreign key indexes for relationships
- Unique indexes on email, username, clerk_id
- Date indexes for time-based queries
- Enum indexes for filtering (litter_type, status, etc.)

### Spatial Indexes
- `idx_location` on reports.location
- `idx_location` on events.location
- `idx_location` on hotspots.location

These spatial indexes enable efficient queries like:
- Finding reports within a radius
- Identifying nearby events
- Calculating hotspot clusters

## Migrations

### Running Migrations

```bash
# Apply pending migrations
npm run prisma:migrate

# Deploy migrations (production)
npx prisma migrate deploy

# Create a new migration
npx prisma migrate dev --name migration_name
```

### Migration History

1. **20241116000000_initial_setup**: Initial database schema with all tables
2. **20241116000001_add_clerk_auth**: Added Clerk authentication support (clerk_id field)

## Prisma Client

### Generate Client

```bash
npm run prisma:generate
```

### Usage Example

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create a report with spatial data
const report = await prisma.report.create({
  data: {
    userId: 'user-uuid',
    latitude: 53.3498,
    longitude: -6.2603,
    // Note: location POINT field is handled by database triggers or raw queries
    locationSource: 'gps',
    litterType: 'plastic',
    quantity: 'moderate',
    photoUrls: ['https://...'],
  },
});

// Find reports near a location (requires raw SQL for spatial queries)
const nearbyReports = await prisma.$queryRaw`
  SELECT id, latitude, longitude,
    ST_Distance_Sphere(
      location,
      ST_GeomFromText('POINT(${longitude} ${latitude})', 4326)
    ) as distance
  FROM reports
  WHERE ST_Distance_Sphere(
    location,
    ST_GeomFromText('POINT(${longitude} ${latitude})', 4326)
  ) <= ${radiusInMeters}
  ORDER BY distance
`;
```

## Spatial Query Examples

### Find Reports Within Radius

```sql
SELECT *
FROM reports
WHERE ST_Distance_Sphere(
  location,
  ST_GeomFromText('POINT(-6.2603 53.3498)', 4326)
) <= 5000; -- 5km radius
```

### Calculate Hotspots

```sql
SELECT 
  ST_AsText(ST_Centroid(ST_Collect(location))) as center,
  COUNT(*) as report_count,
  AVG(latitude) as avg_lat,
  AVG(longitude) as avg_lng
FROM reports
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY ST_GeoHash(location, 7)
HAVING COUNT(*) >= 5;
```

### Find Nearest Event

```sql
SELECT id, title, location_name,
  ST_Distance_Sphere(
    location,
    ST_GeomFromText('POINT(-6.2603 53.3498)', 4326)
  ) as distance
FROM events
WHERE status = 'upcoming'
ORDER BY distance
LIMIT 1;
```

## Database Maintenance

### Backup

```bash
mysqldump -h 192.168.4.20 -u beach_litter_user -p beach_litter_mapping > backup.sql
```

### Restore

```bash
mysql -h 192.168.4.20 -u beach_litter_user -p beach_litter_mapping < backup.sql
```

### Prisma Studio

View and edit data in a GUI:

```bash
npm run prisma:studio
```

## Performance Considerations

1. **Spatial Indexes**: All location columns have spatial indexes for fast queries
2. **Composite Indexes**: lat/lng pairs indexed for non-spatial queries
3. **Date Indexes**: created_at, scheduled_date indexed for time-based filtering
4. **Foreign Key Indexes**: All foreign keys automatically indexed
5. **Enum Indexes**: litter_type, status, verification_status indexed for filtering

## Troubleshooting

### Connection Issues

If you can't connect to the database:
1. Check network connectivity to 192.168.4.20
2. Verify MySQL is running on port 3306
3. Confirm user credentials in .env file
4. Check firewall rules

### Migration Errors

If migrations fail:
1. Check database schema with `npx prisma db pull`
2. Resolve conflicts manually if needed
3. Mark migrations as applied: `npx prisma migrate resolve --applied migration_name`

### Spatial Data Issues

If spatial queries fail:
1. Verify MySQL version is 8.0+
2. Check that spatial indexes exist: `SHOW INDEX FROM reports`
3. Ensure SRID 4326 is used consistently
4. Use ST_GeomFromText() for creating POINT values

## References

- [Prisma Documentation](https://www.prisma.io/docs)
- [MySQL Spatial Data Types](https://dev.mysql.com/doc/refman/8.0/en/spatial-types.html)
- [MySQL Spatial Functions](https://dev.mysql.com/doc/refman/8.0/en/spatial-function-reference.html)
- [Clerk Authentication](https://clerk.com/docs)
