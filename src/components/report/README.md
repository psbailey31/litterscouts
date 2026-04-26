# Report Components

Components for submitting and managing litter reports.

## PhotoUpload

A drag-and-drop photo upload component with EXIF metadata extraction.

### Features

- **Drag-and-drop interface**: Users can drag photos directly onto the upload area
- **File validation**: Validates file type (JPEG, PNG, WebP) and size (default 5MB max)
- **EXIF extraction**: Automatically extracts GPS coordinates and timestamps from photo metadata
- **Multiple uploads**: Supports uploading multiple photos (default max 5)
- **Photo previews**: Displays thumbnails with metadata overlay
- **GPS indicators**: Visual indicators showing which photos contain GPS data
- **Error handling**: Clear error messages for validation failures

### Usage

```typescript
import { PhotoUpload, PhotoMetadata } from '@/components/report';

function ReportForm() {
  const handlePhotosChange = (photos: PhotoMetadata[]) => {
    console.log('Photos updated:', photos);
    // Access GPS data: photos[0].latitude, photos[0].longitude
    // Access timestamp: photos[0].timestamp
    // Access file: photos[0].file
  };

  return (
    <PhotoUpload 
      onPhotosChange={handlePhotosChange}
      maxFiles={5}
      maxSizeMB={5}
    />
  );
}
```

### Props

- `onPhotosChange`: Callback function called when photos are added or removed
- `maxFiles`: Maximum number of photos allowed (default: 5)
- `maxSizeMB`: Maximum file size in megabytes (default: 5)

### PhotoMetadata Interface

```typescript
interface PhotoMetadata {
  file: File;              // The original file object
  preview: string;         // Object URL for preview
  latitude?: number;       // GPS latitude from EXIF (if available)
  longitude?: number;      // GPS longitude from EXIF (if available)
  timestamp?: Date;        // Photo capture timestamp from EXIF (if available)
  hasGPS: boolean;         // Whether GPS data was found
}
```

### Requirements Satisfied

- **1.2**: Extracts GPS coordinates from EXIF metadata
- **1.3**: Prompts for location when EXIF GPS is not available (via hasGPS flag)
- **1.4**: Accepts photographs with minimum resolution validation
- **1.5**: Extracts and displays original photo capture time
- **8.3**: Provides mobile-friendly interface with touch support

## LocationSelector

An interactive location selection component that supports multiple input methods: EXIF data from photos, device GPS, and manual map selection.

### Features

- **Auto-population from EXIF**: Automatically extracts and uses GPS coordinates from uploaded photos
- **Device GPS capture**: One-click button to use device's current location
- **Interactive map picker**: Leaflet-based map for manual location selection with draggable marker
- **Ireland validation**: Validates that selected coordinates are within Ireland's boundaries
- **Accuracy indicator**: Displays GPS accuracy with quality labels (Excellent, Good, Fair, Poor)
- **Visual feedback**: Clear indicators showing selected location, source, and coordinates
- **Error handling**: User-friendly error messages for validation failures and GPS errors

### Usage

```typescript
import { LocationSelector } from '@/components/report';
import { PhotoMetadata } from '@/components/report';
import { Coordinates, LocationSource } from '@/types';

function ReportForm() {
  const [photos, setPhotos] = useState<PhotoMetadata[]>([]);
  
  const handleLocationChange = (
    location: Coordinates,
    source: LocationSource,
    accuracy?: number
  ) => {
    console.log('Location:', location);
    console.log('Source:', source); // 'exif', 'gps', or 'manual'
    console.log('Accuracy:', accuracy); // GPS accuracy in meters (if available)
  };

  return (
    <LocationSelector
      photos={photos}
      onLocationChange={handleLocationChange}
      initialLocation={undefined} // Optional: pre-populate location
    />
  );
}
```

### Props

- `photos`: Array of PhotoMetadata objects (from PhotoUpload component)
- `onLocationChange`: Callback function called when location is selected or changed
- `initialLocation`: Optional initial coordinates to pre-populate the selector

### Location Sources

- **exif**: Location extracted from photo EXIF metadata
- **gps**: Location obtained from device GPS
- **manual**: Location selected manually on the map

### Ireland Coordinate Bounds

The component validates coordinates against Ireland's geographical boundaries:
- Latitude: 51.4° to 55.4°
- Longitude: -10.5° to -5.5°

### Requirements Satisfied

- **1.1**: Captures geographical coordinates with accuracy within 10 meters (via GPS)
- **1.2**: Auto-populates location from EXIF data when available
- **1.3**: Prompts for location via device GPS or manual map selection when EXIF is unavailable
- **8.2**: Accesses device GPS capabilities to auto-populate report location coordinates

### Demo

Visit `/demo/location-selector` to test the component with all three location input methods.
