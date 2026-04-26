import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { CleanupEvent } from '@/types';
import { EventCompletionForm } from './EventCompletionForm';
import { CompletedEventDetails } from './CompletedEventDetails';

// Fix for default marker icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface EventDetailModalProps {
  event: CleanupEvent;
  isRegistered: boolean;
  isOrganizer: boolean;
  onClose: () => void;
  onRegister: () => void;
  onUnregister: () => void;
  onComplete: (data: { 
    litterCollected: number; 
    photos: string[];
    attendees?: Array<{
      userId: string;
      attended: boolean;
      litterCollected?: number;
      contributionNote?: string;
    }>;
  }) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function EventDetailModal({
  event,
  isRegistered,
  isOrganizer,
  onClose,
  onRegister,
  onUnregister,
  onComplete,
  onCancel,
  isLoading = false,
}: EventDetailModalProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  const navigate = useNavigate();

  // Check if event date has passed
  const hasEventPassed = new Date(event.scheduledDate) < new Date();
  const canComplete = isOrganizer && event.status === 'upcoming' && hasEventPassed;

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([event.latitude, event.longitude], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    L.marker([event.latitude, event.longitude]).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [event.latitude, event.longitude]);

  const formatEventDate = (date: Date) => {
    return format(new Date(date), 'EEEE, MMMM d, yyyy');
  };

  const formatEventTime = (date: Date) => {
    return format(new Date(date), 'h:mm a');
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} hour${hours > 1 ? 's' : ''} ${mins} minutes` : `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  const getStatusBadge = () => {
    const styles = {
      upcoming: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    const labels = {
      upcoming: 'Upcoming',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${styles[event.status]}`}>
        {labels[event.status]}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        {/* Modal panel */}
        <div className="relative inline-block align-bottom bg-white rounded-lg text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full max-h-[90vh] overflow-hidden flex flex-col z-10">
          {/* Header */}
          <div className="bg-white px-6 pt-6 pb-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{event.title}</h2>
                <div className="flex items-center gap-3">
                  {getStatusBadge()}
                  <span className="text-sm text-gray-500">
                    {event.participantCount} {event.participantCount === 1 ? 'participant' : 'participants'}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="overflow-y-auto flex-1 bg-white">
            <div className="px-6 py-6 space-y-6">
              {/* Event Details - Hide when showing completion form */}
              {!(canComplete && showCompletionForm) && (
                <>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <svg className="h-6 w-6 text-gray-400 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Date & Time</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatEventDate(event.scheduledDate)} at {formatEventTime(event.scheduledDate)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <svg className="h-6 w-6 text-gray-400 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Duration</p>
                        <p className="text-sm text-gray-600 mt-1">{formatDuration(event.duration)}</p>
                      </div>
                    </div>

                    {/* Equipment Information */}
                    <div className="flex items-start">
                      <svg className="h-6 w-6 text-gray-400 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Equipment</p>
                        {event.equipmentProvided ? (
                          <div className="mt-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ Equipment Provided
                            </span>
                            <p className="text-sm text-gray-600 mt-2">
                              All necessary cleanup equipment will be provided by the organizer.
                            </p>
                          </div>
                        ) : (
                          <div className="mt-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              Bring Your Own
                            </span>
                            {event.requiredItems && event.requiredItems.length > 0 ? (
                              <div className="mt-2">
                                <p className="text-sm text-gray-600 mb-2">Please bring the following items:</p>
                                <ul className="space-y-1">
                                  {event.requiredItems.map((item, index) => (
                                    <li key={index} className="text-sm text-gray-700 flex items-center">
                                      <span className="text-blue-600 mr-2">•</span>
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-600 mt-2">
                                Participants should bring their own cleanup equipment.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start">
                      <svg className="h-6 w-6 text-gray-400 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Location</p>
                        <p className="text-sm text-gray-600 mt-1">{event.locationName}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {event.latitude.toFixed(6)}, {event.longitude.toFixed(6)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Description</h3>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{event.description}</p>
                  </div>

                  {/* Completed Event Details */}
                  {event.status === 'completed' && event.litterCollected !== undefined && (
                    <CompletedEventDetails
                      eventId={event.id}
                      totalLitterCollected={event.litterCollected}
                      photos={event.photos}
                    />
                  )}

                  {/* Map - Temporarily removed for debugging */}
                  {/* <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Event Location Map</h3>
                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                      <div ref={mapRef} className="w-full h-64" />
                    </div>
                  </div> */}
                </>
              )}

              {/* Completion Form for Organizers */}
              {canComplete && showCompletionForm && (
                <div className="mt-6">
                  <EventCompletionForm
                    eventId={event.id}
                    onSubmit={async (data) => {
                      await onComplete(data);
                      setShowCompletionForm(false);
                    }}
                    onCancel={() => setShowCompletionForm(false)}
                    isLoading={isLoading}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          {event.status === 'upcoming' && !showCompletionForm && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex-shrink-0">
              {canComplete ? (
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowCompletionForm(!showCompletionForm)}
                      disabled={isLoading}
                      className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {showCompletionForm ? 'Hide Completion Form' : 'Complete Event'}
                    </button>
                    {onCancel && (
                      <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="px-6 py-3 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        Cancel Event
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => navigate(`/events/${event.id}/checkin`)}
                    className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    QR Code Check-In
                  </button>
                </div>
              ) : isOrganizer && !hasEventPassed ? (
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm text-blue-800">
                        You can complete this event after {format(new Date(event.scheduledDate), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/events/${event.id}/checkin`)}
                    className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    QR Code Check-In
                  </button>
                  {onCancel && (
                    <button
                      onClick={onCancel}
                      disabled={isLoading}
                      className="w-full px-6 py-3 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      Cancel Event
                    </button>
                  )}
                </div>
              ) : isRegistered ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-green-600">
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm font-medium">You're registered for this event</span>
                  </div>
                  <button
                    onClick={onUnregister}
                    disabled={isLoading}
                    className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    {isLoading ? 'Unregistering...' : 'Unregister'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={onRegister}
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isLoading ? 'Registering...' : 'Register for Event'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
