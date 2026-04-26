import { format } from 'date-fns';
import type { CleanupEvent, EventStatus } from '@/types';

interface EventListProps {
  events: CleanupEvent[];
  onEventClick: (event: CleanupEvent) => void;
  onRegister?: (eventId: string) => void;
  isLoading?: boolean;
}

export function EventList({ events, onEventClick, onRegister, isLoading = false }: EventListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900">No events found</h3>
        <p className="mt-2 text-sm text-gray-500">
          Try adjusting your filters or create a new cleanup event.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: EventStatus) => {
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
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const formatEventDate = (date: Date) => {
    return format(new Date(date), 'EEEE, MMMM d, yyyy');
  };

  const formatEventTime = (date: Date) => {
    return format(new Date(date), 'h:mm a');
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div
          key={event.id}
          className="bg-white rounded-lg shadow hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-blue-200"
          onClick={() => onEventClick(event)}
        >
          <div className="p-4">
            {/* Header Row */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{event.title}</h3>
                  {getStatusBadge(event.status)}
                </div>
                <p className="text-sm text-gray-600 line-clamp-1">{event.description}</p>
              </div>
              {event.status === 'upcoming' && onRegister && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRegister(event.id);
                  }}
                  className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm whitespace-nowrap"
                >
                  Quick Register
                </button>
              )}
            </div>

            {/* Info Row - Horizontal Layout */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
              {/* Date and Time */}
              <div className="flex items-center">
                <svg className="h-4 w-4 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="whitespace-nowrap">
                  {formatEventDate(event.scheduledDate)} at {formatEventTime(event.scheduledDate)}
                </span>
              </div>

              {/* Duration */}
              <div className="flex items-center">
                <svg className="h-4 w-4 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{formatDuration(event.duration)}</span>
              </div>

              {/* Location */}
              <div className="flex items-center min-w-0 flex-1">
                <svg className="h-4 w-4 mr-1.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="truncate">{event.locationName}</span>
              </div>

              {/* Participants */}
              <div className="flex items-center">
                <svg className="h-4 w-4 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span>{event.participantCount} {event.participantCount === 1 ? 'participant' : 'participants'}</span>
              </div>

              {/* Completed Event Info */}
              {event.status === 'completed' && event.litterCollected !== undefined && (
                <div className="flex items-center text-green-700 font-medium">
                  <svg className="h-4 w-4 mr-1.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{event.litterCollected} kg collected</span>
                </div>
              )}

              {/* View Details Link */}
              <button
                onClick={() => onEventClick(event)}
                className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 ml-auto"
              >
                View Details
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
