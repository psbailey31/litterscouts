import { useState, useEffect } from 'react';
import type { EventAttendee } from '@/types';

interface CompletedEventDetailsProps {
  eventId: string;
  totalLitterCollected: number;
  photos?: string[];
}

export function CompletedEventDetails({
  eventId,
  totalLitterCollected,
  photos = [],
}: CompletedEventDetailsProps) {
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllAttendees, setShowAllAttendees] = useState(false);

  useEffect(() => {
    fetchAttendees();
  }, [eventId]);

  const fetchAttendees = async () => {
    try {
      setLoading(true);
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3005/api';
      const token = await (window as any).Clerk?.session?.getToken();
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/events/${eventId}/attendees`, { headers });

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          setAttendees(data.filter((a: EventAttendee) => a.attended));
        } else {
          console.warn('Non-JSON response when fetching attendees');
        }
      } else {
        console.error('Failed to fetch attendees:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Error fetching attendees:', error);
    } finally {
      setLoading(false);
    }
  };

  const topContributors = attendees
    .filter(a => a.litterCollected && a.litterCollected > 0)
    .sort((a, b) => (b.litterCollected || 0) - (a.litterCollected || 0))
    .slice(0, showAllAttendees ? undefined : 5);

  const attendedCount = attendees.length;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="h-6 w-6 text-green-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-green-900">Event Completed</p>
            <p className="text-sm text-green-700 mt-1">
              {totalLitterCollected} kg of litter collected by {attendedCount} {attendedCount === 1 ? 'volunteer' : 'volunteers'}
            </p>
          </div>
        </div>
      </div>

      {/* Top Contributors */}
      {topContributors.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Top Contributors</h4>
          <div className="space-y-2">
            {topContributors.map((attendee, index) => (
              <div
                key={attendee.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center flex-1">
                  <div className="flex-shrink-0 mr-3">
                    {index < 3 && (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700' :
                        index === 1 ? 'bg-gray-200 text-gray-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        <span className="text-sm font-bold">#{index + 1}</span>
                      </div>
                    )}
                    {index >= 3 && attendee.user.avatarUrl && (
                      <img
                        src={attendee.user.avatarUrl}
                        alt={attendee.user.username}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    {index >= 3 && !attendee.user.avatarUrl && (
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {attendee.user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {attendee.user.firstName && attendee.user.lastName
                        ? `${attendee.user.firstName} ${attendee.user.lastName}`
                        : attendee.user.username}
                    </p>
                    {attendee.contributionNote && (
                      <p className="text-xs text-gray-500 truncate">{attendee.contributionNote}</p>
                    )}
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    {attendee.litterCollected?.toFixed(1)} kg
                  </span>
                </div>
              </div>
            ))}
          </div>
          {attendees.filter(a => a.litterCollected && a.litterCollected > 0).length > 5 && (
            <button
              onClick={() => setShowAllAttendees(!showAllAttendees)}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {showAllAttendees ? 'Show Less' : `Show All ${attendees.filter(a => a.litterCollected && a.litterCollected > 0).length} Contributors`}
            </button>
          )}
        </div>
      )}

      {/* All Attendees */}
      {attendees.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            All Attendees ({attendees.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {attendees.map((attendee) => (
              <div
                key={attendee.id}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full"
                title={attendee.user.username}
              >
                {attendee.user.avatarUrl ? (
                  <img
                    src={attendee.user.avatarUrl}
                    alt={attendee.user.username}
                    className="w-5 h-5 rounded-full"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">
                      {attendee.user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-sm text-gray-700">
                  {attendee.user.firstName && attendee.user.lastName
                    ? `${attendee.user.firstName} ${attendee.user.lastName}`
                    : attendee.user.username}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event Photos */}
      {photos.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Event Photos</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photo, index) => (
              <img
                key={index}
                src={photo}
                alt={`Event photo ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                onClick={() => window.open(photo, '_blank')}
              />
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}
