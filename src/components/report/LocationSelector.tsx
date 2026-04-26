import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import useGeolocation from '@/hooks/useGeolocation';
import { IRELAND_BOUNDS, isWithinIreland, getAccuracyLabel } from '@/utils/coordinates';
import type { Coordinates, LocationSource } from '@/types';
import type { PhotoMetadata } from './PhotoUpload';

// Fix for default marker icons in Leaflet with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface LocationSelectorProps {
  photos: PhotoMetadata[];
  onLocationChange: (location: Coordinates, source: LocationSource, accuracy?: number) => void;
  initialLocation?: Coordinates;
}

export function LocationSelector({ photos, onLocationChange, initialLocation }: LocationSelectorProps) {
  const [selectedLocation, setSelectedLocation] = useState<Coordinates | null>(initialLocation || null);
  const [locationSource, setLocationSource] = useState<LocationSource | null>(null);
  const [accuracy] = useState<number | undefined>(undefined);
  const [showMap, setShowMap] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  
  const { coordinates, error, loading, getCurrentPosition } = useGeolocation();

  // Auto-populate location from EXIF data when photos are uploaded
  useEffect(() => {
    if (photos.length === 0 || selectedLocation) return;

    // Find first photo with GPS data
    const photoWithGPS = photos.find(photo => photo.hasGPS && photo.latitude && photo.longitude);
    
    if (photoWithGPS && photoWithGPS.latitude && photoWithGPS.longitude) {
      const coords = {
        latitude: photoWithGPS.latitude,
        longitude: photoWithGPS.longitude,
      };

      // Validate coordinates are within Ireland
      if (isWithinIreland(coords.latitude, coords.longitude)) {
        setSelectedLocation(coords);
        setLocationSource('exif');
        setValidationError(null);
        setShowMap(true); // Automatically show map with EXIF location
        onLocationChange(coords, 'exif');
      } else {
        setValidationError('Photo location is outside Ireland. Please select a location manually.');
      }
    }
  }, [photos, selectedLocation, onLocationChange]);

  // Handle device GPS location
  useEffect(() => {
    if (coordinates && locationSource === 'gps') {
      // Validate coordinates are within Ireland
      if (isWithinIreland(coordinates.latitude, coordinates.longitude)) {
        setSelectedLocation(coordinates);
        setValidationError(null);
        onLocationChange(coordinates, 'gps', accuracy);
      } else {
        setValidationError('Your current location is outside Ireland. Please select a location manually.');
        setSelectedLocation(null);
      }
    }
  }, [coordinates, locationSource, accuracy, onLocationChange]);

  // Initialize map when map view is shown
  useEffect(() => {
    if (!showMap || !mapRef.current || mapInstanceRef.current) return;

    // Default center: Dublin, Ireland
    const defaultCenter: [number, number] = [53.3498, -6.2603];
    const initialCenter: [number, number] = selectedLocation 
      ? [selectedLocation.latitude, selectedLocation.longitude]
      : defaultCenter;

    // Create map instance with higher zoom for EXIF locations
    const initialZoom = selectedLocation && locationSource === 'exif' ? 15 : selectedLocation ? 13 : 7;
    const map = L.map(mapRef.current).setView(initialCenter, initialZoom);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add Ireland boundary rectangle for visual reference
    const irelandBounds = L.latLngBounds(
      [IRELAND_BOUNDS.minLat, IRELAND_BOUNDS.minLng],
      [IRELAND_BOUNDS.maxLat, IRELAND_BOUNDS.maxLng]
    );
    
    L.rectangle(irelandBounds, {
      color: '#3B82F6',
      weight: 2,
      fillOpacity: 0.05,
      dashArray: '5, 5',
    }).addTo(map);

    // Add marker if location is already selected
    if (selectedLocation) {
      markerRef.current = L.marker([selectedLocation.latitude, selectedLocation.longitude], {
        draggable: true,
      }).addTo(map);

      // Handle marker drag
      markerRef.current.on('dragend', () => {
        if (markerRef.current) {
          const position = markerRef.current.getLatLng();
          handleMapLocationSelect(position.lat, position.lng);
        }
      });
    }

    // Handle map clicks
    map.on('click', (e: L.LeafletMouseEvent) => {
      handleMapLocationSelect(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, [showMap]);

  // Update marker position when selected location changes
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedLocation) return;

    const map = mapInstanceRef.current;

    // Remove existing marker
    if (markerRef.current) {
      map.removeLayer(markerRef.current);
    }

    // Add new marker
    markerRef.current = L.marker([selectedLocation.latitude, selectedLocation.longitude], {
      draggable: true,
    }).addTo(map);

    // Handle marker drag
    markerRef.current.on('dragend', () => {
      if (markerRef.current) {
        const position = markerRef.current.getLatLng();
        handleMapLocationSelect(position.lat, position.lng);
      }
    });

    // Center map on marker
    map.setView([selectedLocation.latitude, selectedLocation.longitude], 13);
  }, [selectedLocation]);

  const handleMapLocationSelect = (lat: number, lng: number) => {
    // Validate coordinates are within Ireland
    if (!isWithinIreland(lat, lng)) {
      setValidationError('Selected location is outside Ireland. Please select a location within Ireland.');
      return;
    }

    const coords = { latitude: lat, longitude: lng };
    setSelectedLocation(coords);
    setLocationSource('manual');
    setValidationError(null);
    onLocationChange(coords, 'manual');
  };

  const handleUseDeviceLocation = () => {
    setLocationSource('gps');
    setValidationError(null);
    getCurrentPosition();
  };

  const handleShowMapPicker = () => {
    setShowMap(true);
  };

  const getLocationSourceLabel = (source: LocationSource): string => {
    const labels: Record<LocationSource, string> = {
      exif: 'Photo EXIF data',
      gps: 'Device GPS',
      manual: 'Manual selection',
    };
    return labels[source];
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location <span className="text-red-500">*</span>
        </label>
        
        {/* Location Selection Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={handleUseDeviceLocation}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {loading ? 'Getting location...' : 'Use Device GPS'}
          </button>

          <button
            type="button"
            onClick={handleShowMapPicker}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
            Select on Map
          </button>
        </div>

        {/* Error Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="ml-2 text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {validationError && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-yellow-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="ml-2 text-sm text-yellow-700">{validationError}</p>
            </div>
          </div>
        )}

        {/* Selected Location Display */}
        {selectedLocation && locationSource && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="ml-3 flex-1">
                <h4 className="text-sm font-medium text-green-800">Location Selected</h4>
                <div className="mt-2 text-sm text-green-700 space-y-1">
                  <p>
                    <span className="font-medium">Coordinates:</span>{' '}
                    {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                  </p>
                  <p>
                    <span className="font-medium">Source:</span>{' '}
                    {getLocationSourceLabel(locationSource)}
                  </p>
                  {accuracy && (
                    <p>
                      <span className="font-medium">Accuracy:</span>{' '}
                      ±{accuracy.toFixed(0)}m ({getAccuracyLabel(accuracy)})
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Map Picker */}
        {showMap && (
          <div className="border border-gray-300 rounded-lg overflow-hidden shadow-lg">
            <div className="bg-blue-50 px-4 py-3 border-b border-blue-200">
              <div className="flex items-start">
                <svg className="h-5 w-5 text-blue-600 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    {locationSource === 'exif' ? 'Location from Photo' : 'Select Location'}
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    {locationSource === 'exif' 
                      ? 'This location was extracted from your photo. You can adjust it by dragging the marker or clicking a new location.'
                      : 'Click on the map to select a location, or drag the marker to adjust.'}
                  </p>
                </div>
              </div>
            </div>
            <div ref={mapRef} className="w-full h-96" />
          </div>
        )}

        {/* Help Text */}
        {!selectedLocation && (
          <p className="text-sm text-gray-500 mt-2">
            Location will be auto-populated from photo EXIF data if available. Otherwise, use your device GPS or select a location on the map.
          </p>
        )}
      </div>
    </div>
  );
}
