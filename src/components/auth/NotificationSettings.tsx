import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default marker icon issue
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

export interface AreaOfInterest {
  lat: number;
  lng: number;
  radius: number; // in kilometers
}

export interface NotificationPreferences {
  notificationEmail: boolean;
  notificationInApp: boolean;
  areasOfInterest: AreaOfInterest[];
}

interface NotificationSettingsProps {
  preferences: NotificationPreferences;
  onSave: (preferences: NotificationPreferences) => Promise<void>;
  onCancel: () => void;
}

// Component to handle map clicks
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function NotificationSettings({ preferences, onSave, onCancel }: NotificationSettingsProps) {
  const [localPreferences, setLocalPreferences] = useState<NotificationPreferences>(preferences);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAreaIndex, setSelectedAreaIndex] = useState<number | null>(null);

  // Default map center (Ireland)
  const defaultCenter: [number, number] = [53.1424, -7.6921];

  useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);

  const handleAddArea = (lat: number, lng: number) => {
    const newArea: AreaOfInterest = {
      lat,
      lng,
      radius: 10, // Default 10km radius
    };
    setLocalPreferences({
      ...localPreferences,
      areasOfInterest: [...localPreferences.areasOfInterest, newArea],
    });
    setSelectedAreaIndex(localPreferences.areasOfInterest.length);
  };

  const handleRemoveArea = (index: number) => {
    const newAreas = localPreferences.areasOfInterest.filter((_, i) => i !== index);
    setLocalPreferences({
      ...localPreferences,
      areasOfInterest: newAreas,
    });
    if (selectedAreaIndex === index) {
      setSelectedAreaIndex(null);
    }
  };

  const handleRadiusChange = (index: number, radius: number) => {
    const newAreas = [...localPreferences.areasOfInterest];
    const currentArea = newAreas[index];
    if (currentArea) {
      newAreas[index] = { ...currentArea, radius };
      setLocalPreferences({
        ...localPreferences,
        areasOfInterest: newAreas,
      });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await onSave(localPreferences);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const mapCenter: [number, number] = 
    localPreferences.areasOfInterest.length > 0 && localPreferences.areasOfInterest[0]
      ? [localPreferences.areasOfInterest[0].lat, localPreferences.areasOfInterest[0].lng]
      : defaultCenter;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
        
        {/* Notification Type Toggles */}
        <div className="space-y-3 mb-6">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={localPreferences.notificationEmail}
              onChange={(e) =>
                setLocalPreferences({
                  ...localPreferences,
                  notificationEmail: e.target.checked,
                })
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">
              Email notifications for new reports and events
            </span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={localPreferences.notificationInApp}
              onChange={(e) =>
                setLocalPreferences({
                  ...localPreferences,
                  notificationInApp: e.target.checked,
                })
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">
              In-app notifications for new reports and events
            </span>
          </label>
        </div>
      </div>

      {/* Areas of Interest */}
      <div>
        <h4 className="text-md font-semibold text-gray-900 mb-2">Areas of Interest</h4>
        <p className="text-sm text-gray-600 mb-4">
          Click on the map to add areas where you want to receive notifications about new reports and events.
        </p>

        {/* Map */}
        <div className="h-96 rounded-lg overflow-hidden border border-gray-300 mb-4">
          <MapContainer
            center={mapCenter}
            zoom={7}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onMapClick={handleAddArea} />
            
            {/* Render circles for each area of interest */}
            {localPreferences.areasOfInterest.map((area, index) => (
              <Circle
                key={index}
                center={[area.lat, area.lng]}
                radius={area.radius * 1000} // Convert km to meters
                pathOptions={{
                  color: selectedAreaIndex === index ? '#3b82f6' : '#6b7280',
                  fillColor: selectedAreaIndex === index ? '#3b82f6' : '#6b7280',
                  fillOpacity: 0.2,
                }}
                eventHandlers={{
                  click: () => setSelectedAreaIndex(index),
                }}
              />
            ))}
          </MapContainer>
        </div>

        {/* Areas List */}
        {localPreferences.areasOfInterest.length > 0 && (
          <div className="space-y-3">
            <h5 className="text-sm font-medium text-gray-700">Your Areas ({localPreferences.areasOfInterest.length})</h5>
            {localPreferences.areasOfInterest.map((area, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  selectedAreaIndex === index
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    Area {index + 1}
                  </span>
                  <button
                    onClick={() => handleRemoveArea(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
                <div className="text-xs text-gray-600 mb-2">
                  Location: {area.lat.toFixed(4)}, {area.lng.toFixed(4)}
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-xs text-gray-700">Radius (km):</label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={area.radius}
                    onChange={(e) => handleRadiusChange(index, parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-xs font-medium text-gray-900 w-12">
                    {area.radius} km
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {localPreferences.areasOfInterest.length === 0 && (
          <p className="text-sm text-gray-500 italic">
            No areas added yet. Click on the map to add your first area of interest.
          </p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}
