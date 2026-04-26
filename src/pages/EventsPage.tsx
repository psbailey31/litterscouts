import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { EventForm, EventList, EventFilters, EventDetailModal, EmailPromptModal } from '@/components/event';
import type { EventFilterState } from '@/components/event';
import { eventService } from '@/services/eventService';
import { useToast } from '@/components/common/Toast';
import type { CleanupEvent } from '@/types';

export function EventsPage() {
  const { isSignedIn, user } = useUser();
  const { confirmDialog } = useToast();
  const navigate = useNavigate();
  const [events, setEvents] = useState<CleanupEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CleanupEvent[]>([]);
  const [filters, setFilters] = useState<EventFilterState>({
    status: 'all',
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CleanupEvent | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [pendingEventId, setPendingEventId] = useState<string | null>(null);

  // Load events
  useEffect(() => {
    loadEvents();
  }, []);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [events, filters]);

  // Check registration status and organizer status when event is selected
  useEffect(() => {
    if (selectedEvent && isSignedIn) {
      checkRegistrationStatus(selectedEvent.id);
      // Check if current user is the organizer by comparing Clerk IDs
      setIsOrganizer(user?.id === selectedEvent.organizerClerkId);
    } else {
      setIsOrganizer(false);
    }
  }, [selectedEvent, isSignedIn, user]);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await eventService.getEvents();
      setEvents(data);
    } catch (err) {
      setError('Failed to load events. Please try again.');
      console.error('Error loading events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...events];

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(event => event.status === filters.status);
    }

    // Filter by date range
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filtered = filtered.filter(event => new Date(event.scheduledDate) >= startDate);
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(event => new Date(event.scheduledDate) <= endDate);
    }

    // Sort: upcoming events first (ascending), then completed/cancelled (descending - most recent first)
    filtered.sort((a, b) => {
      // Priority order: upcoming > completed > cancelled
      const statusPriority = { upcoming: 0, completed: 1, cancelled: 2 };
      const priorityA = statusPriority[a.status];
      const priorityB = statusPriority[b.status];
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // Within same status, sort by date
      const dateA = new Date(a.scheduledDate).getTime();
      const dateB = new Date(b.scheduledDate).getTime();
      
      // Upcoming: ascending (next event first)
      // Completed/Cancelled: descending (most recent first)
      return a.status === 'upcoming' ? dateA - dateB : dateB - dateA;
    });

    setFilteredEvents(filtered);
  };

  const checkRegistrationStatus = async (eventId: string) => {
    try {
      const registered = await eventService.isUserRegistered(eventId);
      setIsRegistered(registered);
    } catch (err) {
      console.error('Error checking registration status:', err);
      setIsRegistered(false);
    }
  };

  const handleCreateEvent = async (formData: any) => {
    if (!isSignedIn) {
      setError('You must be signed in to create an event');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Combine date and time
      const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);

      const eventData = {
        title: formData.title,
        description: formData.description,
        latitude: formData.latitude,
        longitude: formData.longitude,
        locationName: formData.locationName,
        scheduledDate: scheduledDateTime,
        duration: formData.duration,
      };

      await eventService.createEvent(eventData);
      setShowCreateForm(false);
      await loadEvents();
    } catch (err: any) {
      setError(err.message || 'Failed to create event. Please try again.');
      console.error('Error creating event:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (eventId: string) => {
    if (!isSignedIn) {
      setError('You must be signed in to register for events');
      return;
    }

    // Check if user has an email address
    const hasEmail = user?.primaryEmailAddress?.emailAddress;
    if (!hasEmail) {
      setPendingEventId(eventId);
      setShowEmailPrompt(true);
      return;
    }

    await performRegistration(eventId);
  };

  const performRegistration = async (eventId: string) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await eventService.registerForEvent(eventId);
      setIsRegistered(true);
      await loadEvents();
    } catch (err: any) {
      setError(err.message || 'Failed to register for event. Please try again.');
      console.error('Error registering for event:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddEmail = () => {
    setShowEmailPrompt(false);
    // Navigate to user profile where they can manage their Clerk account
    if (user?.id) {
      navigate(`/profile/${user.id}`);
    }
  };

  const handleContinueWithoutEmail = async () => {
    setShowEmailPrompt(false);
    if (pendingEventId) {
      await performRegistration(pendingEventId);
      setPendingEventId(null);
    }
  };

  const handleUnregister = async () => {
    if (!selectedEvent) return;

    try {
      setIsSubmitting(true);
      setError(null);
      await eventService.unregisterFromEvent(selectedEvent.id);
      setIsRegistered(false);
      await loadEvents();
    } catch (err: any) {
      setError(err.message || 'Failed to unregister from event. Please try again.');
      console.error('Error unregistering from event:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteEvent = async (data: { 
    litterCollected: number; 
    photos: string[];
    attendees?: Array<{
      userId: string;
      attended: boolean;
      litterCollected?: number;
      contributionNote?: string;
    }>;
  }) => {
    if (!selectedEvent) return;

    try {
      setIsSubmitting(true);
      setError(null);
      await eventService.completeEvent(selectedEvent.id, data);
      setSelectedEvent(null);
      await loadEvents();
    } catch (err: any) {
      setError(err.message || 'Failed to complete event. Please try again.');
      console.error('Error completing event:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEvent = async () => {
    if (!selectedEvent) return;

    if (!await confirmDialog('Are you sure you want to cancel this event? This action cannot be undone.')) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await eventService.updateEvent(selectedEvent.id, { status: 'cancelled' });
      setSelectedEvent(null);
      await loadEvents();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel event. Please try again.');
      console.error('Error cancelling event:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clean-up Events</h1>
          <p className="mt-2 text-sm text-gray-600">
            Join community cleanup events or organize your own
          </p>
        </div>
        {isSignedIn && !showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Event
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-500"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Create Event Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New Event</h2>
          <EventForm
            onSubmit={handleCreateEvent}
            onCancel={() => setShowCreateForm(false)}
            isSubmitting={isSubmitting}
          />
        </div>
      )}

      {/* Filters */}
      {!showCreateForm && (
        <EventFilters
          filters={filters}
          onFiltersChange={setFilters}
        />
      )}

      {/* Event List */}
      {!showCreateForm && (
        <EventList
          events={filteredEvents}
          onEventClick={setSelectedEvent}
          onRegister={handleRegister}
          isLoading={isLoading}
        />
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          isRegistered={isRegistered}
          isOrganizer={isOrganizer}
          onClose={() => setSelectedEvent(null)}
          onRegister={() => handleRegister(selectedEvent.id)}
          onUnregister={handleUnregister}
          onComplete={handleCompleteEvent}
          onCancel={isOrganizer ? handleCancelEvent : undefined}
          isLoading={isSubmitting}
        />
      )}

      {/* Email Prompt Modal */}
      {showEmailPrompt && (
        <EmailPromptModal
          onClose={() => {
            setShowEmailPrompt(false);
            setPendingEventId(null);
          }}
          onAddEmail={handleAddEmail}
          onContinue={handleContinueWithoutEmail}
        />
      )}
    </div>
  );
}

export default EventsPage;
