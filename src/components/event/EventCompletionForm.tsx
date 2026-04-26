import { useState } from 'react';
import { PhotoUpload, type PhotoMetadata } from '@/components/report/PhotoUpload';
import { AttendeeManagement } from './AttendeeManagement';

interface EventCompletionFormProps {
  eventId: string;
  onSubmit: (data: { litterCollected: number; photos: string[]; attendees?: Array<{
    userId: string;
    attended: boolean;
    litterCollected?: number;
    contributionNote?: string;
  }> }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function EventCompletionForm({
  eventId,
  onSubmit,
  onCancel,
  isLoading = false,
}: EventCompletionFormProps) {
  const [step, setStep] = useState<'attendees' | 'summary'>('attendees');
  const [litterCollected, setLitterCollected] = useState<string>('');
  const [photos, setPhotos] = useState<PhotoMetadata[]>([]);
  const [attendeeData, setAttendeeData] = useState<Array<{
    userId: string;
    attended: boolean;
    litterCollected?: number;
    contributionNote?: string;
  }>>([]);
  const [errors, setErrors] = useState<{ litterCollected?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { litterCollected?: string } = {};

    if (!litterCollected || litterCollected.trim() === '') {
      newErrors.litterCollected = 'Please enter the amount of litter collected';
    } else {
      const value = parseFloat(litterCollected);
      if (isNaN(value) || value < 0) {
        newErrors.litterCollected = 'Please enter a valid positive number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAttendeesSave = async (attendees: Array<{
    userId: string;
    attended: boolean;
    litterCollected?: number;
    contributionNote?: string;
  }>) => {
    setAttendeeData(attendees);
    
    // Calculate total litter from attendees
    const totalFromAttendees = attendees.reduce((sum, a) => sum + (a.litterCollected || 0), 0);
    setLitterCollected(totalFromAttendees.toFixed(1));
    
    setStep('summary');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const photoUrls = photos.map(photo => photo.preview);
      
      await onSubmit({
        litterCollected: parseFloat(litterCollected),
        photos: photoUrls,
        attendees: attendeeData.length > 0 ? attendeeData : undefined,
      });
    } catch (error) {
      console.error('Error completing event:', error);
    }
  };

  const handlePhotosChange = (photoMetadata: PhotoMetadata[]) => {
    setPhotos(photoMetadata);
  };

  if (step === 'attendees') {
    return (
      <AttendeeManagement
        eventId={eventId}
        onClose={onCancel}
        onSave={handleAttendeesSave}
        isLoading={isLoading}
      />
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Complete Event</h3>
        <button
          onClick={() => setStep('attendees')}
          className="text-sm text-blue-600 hover:text-blue-700"
          type="button"
        >
          ← Back to Attendees
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Litter Collected Input */}
        <div>
          <label htmlFor="litterCollected" className="block text-sm font-medium text-gray-700 mb-2">
            Litter Collected (kg) *
          </label>
          <input
            type="number"
            id="litterCollected"
            step="0.1"
            min="0"
            value={litterCollected}
            onChange={(e) => setLitterCollected(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.litterCollected ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., 25.5"
          />
          {errors.litterCollected && (
            <p className="mt-1 text-sm text-red-600">{errors.litterCollected}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Enter the total weight of litter collected during the event
          </p>
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Event Photos (Optional)
          </label>
          <PhotoUpload
            onPhotosChange={handlePhotosChange}
            maxFiles={5}
          />
          <p className="mt-1 text-xs text-gray-500">
            Upload photos from the cleanup event (max 5 photos)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? 'Completing...' : 'Complete Event'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
