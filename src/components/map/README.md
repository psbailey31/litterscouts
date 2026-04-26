# Map Components

## MapView

Interactive map component built with Leaflet.js for displaying litter reports and cleanup events.

### Features

- **OpenStreetMap Integration**: Uses free OpenStreetMap tiles
- **Custom Markers**: Color-coded markers for different litter types with size based on quantity
- **Geolocation**: Button to center map on user's current location
- **Interactive Popups**: Click markers to view report details
- **Event Markers**: Display cleanup events with distinct styling
- **Zoom & Pan Controls**: Standard Leaflet map controls

### Usage

```tsx
import { MapView } from '@/components/map';

function MyMapPage() {
  const reports = [/* array of Report objects */];
  const events = [/* array of CleanupEvent objects */];

  const handleMarkerClick = (reportId: string) => {
    console.log('Report clicked:', reportId);
  };

  return (
    <MapView
      reports={reports}
      events={events}
      onMarkerClick={handleMarkerClick}
      center={[53.3498, -6.2603]} // Optional: default center
      zoom={7} // Optional: default zoom level
    />
  );
}
```

### Props

- `reports` (Report[]): Array of litter reports to display
- `events` (CleanupEvent[]): Array of cleanup events to display (optional)
- `filters` (FilterState): Filter state for reports (optional, for future use)
- `onMarkerClick` ((reportId: string) => void): Callback when a report marker is clicked (optional)
- `onMapClick` ((lat: number, lng: number) => void): Callback when the map is clicked (optional)
- `showHeatmap` (boolean): Toggle heat map overlay (optional, for future use)
- `showClusters` (boolean): Toggle marker clustering (optional, for future use)
- `center` ([number, number]): Initial map center coordinates (default: Dublin, Ireland)
- `zoom` (number): Initial zoom level (default: 7)

### Marker Colors

- **Plastic**: Blue (#3B82F6)
- **Metal**: Gray (#6B7280)
- **Glass**: Green (#10B981)
- **Organic**: Lime (#84CC16)
- **Hazardous**: Red (#EF4444)
- **Other**: Purple (#8B5CF6)

### Marker Sizes (by quantity)

- **Minimal**: 24px
- **Moderate**: 28px
- **Significant**: 32px
- **Severe**: 36px

### Event Marker Colors

- **Upcoming**: Amber (#F59E0B)
- **Completed**: Green (#10B981)
- **Cancelled**: Gray (#6B7280)

### Requirements Satisfied

- ✅ 2.1: Display litter reports as visual markers on interactive map
- ✅ 2.2: Click markers to display full report details
- ✅ 2.3: Map zoom functionality from country to street level
- ✅ 8.2: Access device GPS to center map on user location
