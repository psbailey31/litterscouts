import { useState, useRef, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { isWithinIreland, IRELAND_BOUNDS } from '@/utils/coordinates';
import type { Coordinates } from '@/types';

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

interface EventFormData {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  locationName: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  equipmentProvided: boolean;
  requiredItems: string[];
}

interface EventFormProps {
  onSubmit: (data: EventFormData) => void;
  onCancel: () => void;
  initialData?: Partial<EventFormData>;
  isSubmitting?: boolean;
}

export function EventForm({ onSubmit, onCancel, initialData, isSubmitting = false }: EventFormProps) {
  const [formData, setFormData] = useState<EventFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    latitude: initialData?.latitude || 0,
    longitude: initialData?.longitude || 0,
    locationName: initialData?.locationName || '',
    scheduledDate: initialData?.scheduledDate || '',
    scheduledTime: initialData?.scheduledTime || '',
    duration: initialData?.duration || 120,
    equipmentProvided: initialData?.equipmentProvided || false,
    requiredItems: initialData?.requiredItems || [],
  });

  const [newItem, setNewItem] = useState('');

  const [selectedLocation, setSelectedLocation] = useState<Coordinates | null>(
    initialData?.latitude && initialData?.longitude
      ? { latitude: initialData.latitude, longitude: initialData.longitude }
      : null
  );
  const [errors, setErrors] = useState<Partial<Record<keyof EventFormData, string>>>({});
  const [locationError, setLocationError] = useState<string | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Default center: Dublin, Ireland
    const defaultCenter: [number, number] = [53.3498, -6.2603];
    const initialCenter: [number, number] = selectedLocation
      ? [selectedLocation.latitude, selectedLocation.longitude]
      : defaultCenter;

    const map = L.map(mapRef.current).setView(initialCenter, selectedLocation ? 13 : 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add Ireland boundary rectangle
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
  }, []);

  // Update marker when location changes
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedLocation) return;

    const map = mapInstanceRef.current;

    if (markerRef.current) {
      map.removeLayer(markerRef.current);
    }

    markerRef.current = L.marker([selectedLocation.latitude, selectedLocation.longitude], {
      draggable: true,
    }).addTo(map);

    markerRef.current.on('dragend', () => {
      if (markerRef.current) {
        const position = markerRef.current.getLatLng();
        handleMapLocationSelect(position.lat, position.lng);
      }
    });

    map.setView([selectedLocation.latitude, selectedLocation.longitude], 13);
  }, [selectedLocation]);

  const handleMapLocationSelect = (lat: number, lng: number) => {
    if (!isWithinIreland(lat, lng)) {
      setLocationError('Selected location is outside Ireland. Please select a location within Ireland.');
      return;
    }

    const coords = { latitude: lat, longitude: lng };
    setSelectedLocation(coords);
    setLocationError(null);
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
  };

  const handleInputChange = (field: keyof EventFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof EventFormData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Event title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Event description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!formData.locationName.trim()) {
      newErrors.locationName = 'Location name is required';
    }

    if (!selectedLocation) {
      setLocationError('Please select a location on the map');
    }

    if (!formData.scheduledDate) {
      newErrors.scheduledDate = 'Event date is required';
    } else {
      const selectedDate = new Date(formData.scheduledDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.scheduledDate = 'Event date must be in the future';
      }
    }

    if (!formData.scheduledTime) {
      newErrors.scheduledTime = 'Event time is required';
    }

    if (formData.duration < 30) {
      newErrors.duration = 'Duration must be at least 30 minutes';
    } else if (formData.duration > 480) {
      newErrors.duration = 'Duration cannot exceed 8 hours';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && selectedLocation !== null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Event Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="e.g., Sandymount Beach Cleanup"
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={4}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Describe the cleanup event, what to bring, meeting point, etc."
        />
        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
      </div>

      {/* Date and Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700 mb-1">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="scheduledDate"
            value={formData.scheduledDate}
            onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
            min={getMinDate()}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.scheduledDate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.scheduledDate && <p className="mt-1 text-sm text-red-600">{errors.scheduledDate}</p>}
        </div>

        <div>
          <label htmlFor="scheduledTime" className="block text-sm font-medium text-gray-700 mb-1">
            Time <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            id="scheduledTime"
            value={formData.scheduledTime}
            onChange={(e) => handleInputChange('scheduledTime', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.scheduledTime ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.scheduledTime && <p className="mt-1 text-sm text-red-600">{errors.scheduledTime}</p>}
        </div>
      </div>

      {/* Duration */}
      <div>
        <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
          Duration (minutes) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="duration"
          value={formData.duration}
          onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
          min={30}
          max={480}
          step={15}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.duration ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        <p className="mt-1 text-sm text-gray-500">
          {formData.duration >= 60
            ? `${Math.floor(formData.duration / 60)} hour${Math.floor(formData.duration / 60) > 1 ? 's' : ''} ${
                formData.duration % 60 > 0 ? `${formData.duration % 60} minutes` : ''
              }`
            : `${formData.duration} minutes`}
        </p>
        {errors.duration && <p className="mt-1 text-sm text-red-600">{errors.duration}</p>}
      </div>

      {/* Equipment Section */}
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Equipment</h3>
        
        {/* Equipment Provided Toggle */}
        <div className="mb-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.equipmentProvided}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, equipmentProvided: e.target.checked }));
                // Clear required items if equipment is provided
                if (e.target.checked) {
                  setFormData(prev => ({ ...prev, requiredItems: [] }));
                }
              }}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="ml-3 text-sm font-medium text-gray-700">
              Equipment will be provided by organizer
            </span>
          </label>
          <p className="mt-1 ml-8 text-sm text-gray-500">
            Check this if you'll supply all necessary cleanup equipment
          </p>
        </div>

        {/* Required Items List (only shown if equipment not provided) */}
        {!formData.equipmentProvided && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Items Participants Need to Bring
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Add items that participants should bring (e.g., gloves, litter picker, bags, coat)
            </p>
            
            {/* Add Item Input */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (newItem.trim() && !formData.requiredItems.includes(newItem.trim())) {
                      setFormData(prev => ({
                        ...prev,
                        requiredItems: [...prev.requiredItems, newItem.trim()]
                      }));
                      setNewItem('');
                    }
                  }
                }}
                placeholder="e.g., Gloves, Litter picker, Bags"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  if (newItem.trim() && !formData.requiredItems.includes(newItem.trim())) {
                    setFormData(prev => ({
                      ...prev,
                      requiredItems: [...prev.requiredItems, newItem.trim()]
                    }));
                    setNewItem('');
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Add
              </button>
            </div>

            {/* Required Items List */}
            {formData.requiredItems.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Required Items:</p>
                <ul className="space-y-1">
                  {formData.requiredItems.map((item, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-gray-200"
                    >
                      <span className="text-sm text-gray-700">• {item}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            requiredItems: prev.requiredItems.filter((_, i) => i !== index)
                          }));
                        }}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {formData.requiredItems.length === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  💡 Tip: Add common items like gloves, litter pickers, bags, or appropriate clothing
                </p>
              </div>
            )}
          </div>
        )}

        {formData.equipmentProvided && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-700">
              ✓ Participants will be informed that all equipment will be provided
            </p>
          </div>
        )}
      </div>

      {/* Location Name */}
      <div>
        <label htmlFor="locationName" className="block text-sm font-medium text-gray-700 mb-1">
          Location Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="locationName"
          value={formData.locationName}
          onChange={(e) => handleInputChange('locationName', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.locationName ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="e.g., Sandymount Beach, Dublin"
        />
        {errors.locationName && <p className="mt-1 text-sm text-red-600">{errors.locationName}</p>}
      </div>

      {/* Map Location Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Event Location on Map <span className="text-red-500">*</span>
        </label>

        {locationError && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-yellow-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="ml-2 text-sm text-yellow-700">{locationError}</p>
            </div>
          </div>
        )}

        {selectedLocation && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">Location Selected</p>
                <p className="text-sm text-green-700 mt-1">
                  {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="border border-gray-300 rounded-lg overflow-hidden shadow-lg">
          <div className="bg-blue-50 px-4 py-3 border-b border-blue-200">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-blue-600 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-blue-700">
                Click on the map to select the event location, or drag the marker to adjust.
              </p>
            </div>
          </div>
          <div ref={mapRef} className="w-full h-96" />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isSubmitting ? 'Creating Event...' : 'Create Event'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
