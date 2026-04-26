# External Environmental Data Components

This directory contains components for displaying external environmental data from various public APIs and data sources.

## Components

### WeatherWidget
Displays current weather conditions for a location including:
- Temperature and "feels like" temperature
- Humidity percentage
- Wind speed and direction
- Weather description

**Props:**
- `latitude: number` - Location latitude
- `longitude: number` - Location longitude

**API Endpoint:** `GET /api/external/weather/:lat/:lng`

### TideDisplay
Shows tide information for coastal locations including:
- Next tide time and type (high/low)
- Today's tide schedule with times and heights
- Tide heights in meters

**Props:**
- `latitude: number` - Location latitude
- `longitude: number` - Location longitude

**API Endpoint:** `GET /api/external/tides/:lat/:lng`

### WaterQualityIndicator
Displays water quality status from EPA data:
- Overall quality rating (excellent, good, sufficient, poor)
- Water quality parameters (bacteria, pH, temperature)
- Last update date
- Data source information

**Props:**
- `latitude: number` - Location latitude
- `longitude: number` - Location longitude

**API Endpoint:** `GET /api/external/water-quality/:lat/:lng`

### BeachQualityDisplay
Shows beach quality ratings and certifications:
- Quality rating (Blue Flag, Green Coast, etc.)
- Awards and certifications
- Available facilities
- Last inspection date

**Props:**
- `latitude: number` - Location latitude
- `longitude: number` - Location longitude

**API Endpoint:** `GET /api/external/beach-quality/:lat/:lng`

### BiodiversityInfo
Displays marine biodiversity information:
- Protected area status
- Habitat type
- Conservation status
- Notable species list with scientific names

**Props:**
- `latitude: number` - Location latitude
- `longitude: number` - Location longitude

**API Endpoint:** `GET /api/external/biodiversity/:lat/:lng`

**Note:** This component only renders if meaningful data is available.

### EnvironmentalDataPanel
Composite component that displays all external environmental data widgets together.

**Props:**
- `latitude: number` - Location latitude
- `longitude: number` - Location longitude
- `className?: string` - Optional CSS classes

## Usage

### Individual Components

```tsx
import { WeatherWidget, TideDisplay } from '@/components/external';

function MyComponent() {
  return (
    <div>
      <WeatherWidget latitude={53.3498} longitude={-6.2603} />
      <TideDisplay latitude={53.3498} longitude={-6.2603} />
    </div>
  );
}
```

### Composite Panel

```tsx
import { EnvironmentalDataPanel } from '@/components/external';

function ReportDetails({ report }) {
  return (
    <div>
      <h2>Report Details</h2>
      {/* ... report info ... */}
      
      <EnvironmentalDataPanel 
        latitude={report.latitude} 
        longitude={report.longitude} 
      />
    </div>
  );
}
```

## Error Handling

All components handle loading and error states gracefully:
- **Loading state:** Shows a spinner with loading message
- **Error state:** Displays "data unavailable" message
- **No data:** Components hide themselves or show appropriate message

Components use `try-catch` blocks and never throw errors to parent components.

## Data Caching

External API responses are cached on the backend for up to 6 hours to:
- Minimize API calls to external services
- Improve performance
- Reduce costs
- Ensure data availability

## Backend Requirements

These components require the following backend API endpoints to be implemented:

1. `GET /api/external/weather/:lat/:lng` - Weather data from OpenWeatherMap
2. `GET /api/external/tides/:lat/:lng` - Tide data from WorldTides or NOAA
3. `GET /api/external/water-quality/:lat/:lng` - EPA water quality data
4. `GET /api/external/beach-quality/:lat/:lng` - Beach quality ratings
5. `GET /api/external/biodiversity/:lat/:lng` - Marine biodiversity information

See the design document for detailed API specifications and data formats.

## Demo

Visit `/demo/environmental-data` to see all components in action with sample locations.

## Requirements Fulfilled

These components fulfill the following requirements:
- **11.1** - Weather data integration
- **11.2** - Tide information display
- **11.3** - Water quality data from EPA
- **11.4** - Beach quality ratings
- **11.6** - Beach quality from EU databases
- **11.7** - Marine biodiversity information
