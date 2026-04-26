import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { QRCodeScanner } from '@/components/event/QRCodeScanner';
import { apiClient } from '@/services/api';
import { CleanupEvent, EventAttendee } from '@/types';

export function EventCheckInPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useUser();
  const [event, setEvent] = useState<CleanupEvent | null>(null);
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadEventData();
  }, [eventId]);

  const loadEventData = async () => {
    if (!eventId) return;

    try {
      setLoading(true);
      setError(null);

      // Load event details
      const eventResponse = await apiClient.get<CleanupEvent>(`/events/${eventId}`);
      setEvent(eventResponse);

      // Check if user is the organizer
      if (eventResponse.organizerClerkId !== user?.id) {
        setError('Only the event organizer can access check-in');
        return;
      }

      // Load attendees
      const attendeesResponse = await apiClient.get<EventAttendee[]>(
        `/events/${eventId}/attendees`
      );
      setAttendees(attendeesResponse);


    } catch (err: any) {
      console.error('Error loading event data:', err);
      setError(err.message || 'Failed to load event data');
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async (clerkUserId: string) => {
    if (!eventId) return;

    try {
      // Send the Clerk ID to backend and let it handle the lookup
      const response = await apiClient.post<{ 
        success: boolean; 
        username?: string; 
        firstName?: string; 
        lastName?: string;
        wasWalkIn?: boolean;
      }>(
        `/events/${eventId}/checkin`,
        { clerkUserId }
      );

      const displayName = response.firstName && response.lastName 
        ? `${response.firstName} ${response.lastName}`
        : response.username || 'user';
      
      if (response.wasWalkIn) {
        setSuccessMessage(`✨ ${displayName} registered and checked in as walk-in!`);
      } else {
        setSuccessMessage(`✓ Successfully checked in ${displayName}`);
      }

      // Reload attendees to get updated status
      setTimeout(() => {
        loadEventData();
        setSuccessMessage(null);
      }, 2000);
    } catch (err: any) {
      console.error('Error checking in user:', err);
      setError(err.message || 'Failed to check in user');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleScanError = (errorMsg: string) => {
    setError(errorMsg);
    setTimeout(() => setError(null), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
          <div className="text-red-600 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <Link
            to="/events"
            className="block w-full bg-blue-600 text-white text-center px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            to={`/events/${eventId}`}
            className="text-blue-600 hover:text-blue-700 mb-4 inline-flex items-center"
          >
            <svg
              className="w-5 h-5 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Event
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Event Check-In</h1>
          {event && (
            <p className="text-gray-600 mt-2">{event.title}</p>
          )}
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              {successMessage}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* QR Scanner */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Scan Attendee QR Code
          </h2>
          <QRCodeScanner onScan={handleScan} onError={handleScanError} />
        </div>

        {/* Attendee List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Registered Attendees ({attendees.length})
          </h2>
          {attendees.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No attendees registered yet
            </p>
          ) : (
            <div className="space-y-3">
              {attendees.map((attendee) => (
                <div
                  key={attendee.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    attendee.attended
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {attendee.user.avatarUrl ? (
                      <img
                        src={attendee.user.avatarUrl}
                        alt={attendee.user.username}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                        {attendee.user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">
                        {attendee.user.firstName && attendee.user.lastName
                          ? `${attendee.user.firstName} ${attendee.user.lastName}`
                          : attendee.user.username}
                      </p>
                      <p className="text-sm text-gray-500">
                        @{attendee.user.username}
                      </p>
                    </div>
                  </div>
                  {attendee.attended ? (
                    <div className="flex items-center text-green-600">
                      <svg
                        className="w-6 h-6"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="ml-1 text-sm font-medium">Checked In</span>
                    </div>
                  ) : (
                    <button
                      onClick={async () => {
                        try {
                          const response = await apiClient.post<{ 
                            success: boolean; 
                            username?: string; 
                            firstName?: string; 
                            lastName?: string;
                            wasWalkIn?: boolean;
                          }>(
                            `/events/${eventId}/checkin`,
                            { clerkUserId: attendee.user.clerkId }
                          );

                          const displayName = response.firstName && response.lastName 
                            ? `${response.firstName} ${response.lastName}`
                            : response.username || attendee.user.username;
                          
                          if (response.wasWalkIn) {
                            setSuccessMessage(`✨ ${displayName} registered and checked in as walk-in!`);
                          } else {
                            setSuccessMessage(`✓ Successfully checked in ${displayName}`);
                          }
                          
                          // Reload attendees to get updated status
                          setTimeout(() => {
                            loadEventData();
                            setSuccessMessage(null);
                          }, 2000);
                        } catch (err: any) {
                          console.error('Error checking in user:', err);
                          setError(err.message || 'Failed to check in user');
                          setTimeout(() => setError(null), 3000);
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Check In
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EventCheckInPage;
