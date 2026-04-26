// Event service for API calls related to cleanup events
import { apiClient } from './api';
import type { CleanupEvent } from '@/types';

export interface CreateEventDTO {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  locationName: string;
  scheduledDate: Date;
  duration: number; // in minutes
}

export interface UpdateEventDTO {
  title?: string;
  description?: string;
  scheduledDate?: Date;
  duration?: number;
  status?: 'upcoming' | 'completed' | 'cancelled';
}

export interface EventFilters {
  status?: 'upcoming' | 'completed' | 'cancelled';
  startDate?: Date;
  endDate?: Date;
  latitude?: number;
  longitude?: number;
  radius?: number; // in kilometers
}

export interface EventRegistration {
  id: string;
  userId: string;
  eventId: string;
  registeredAt: Date;
  attended: boolean;
}

export const eventService = {
  // Get all events with optional filters
  async getEvents(filters?: EventFilters): Promise<CleanupEvent[]> {
    const params = new URLSearchParams();
    
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate.toISOString());
    if (filters?.endDate) params.append('endDate', filters.endDate.toISOString());
    if (filters?.latitude) params.append('latitude', filters.latitude.toString());
    if (filters?.longitude) params.append('longitude', filters.longitude.toString());
    if (filters?.radius) params.append('radius', filters.radius.toString());

    const queryString = params.toString();
    const endpoint = queryString ? `/events?${queryString}` : '/events';
    
    return apiClient.get<CleanupEvent[]>(endpoint);
  },

  // Get single event by ID
  async getEvent(id: string): Promise<CleanupEvent> {
    return apiClient.get<CleanupEvent>(`/events/${id}`);
  },

  // Create new event
  async createEvent(data: CreateEventDTO): Promise<CleanupEvent> {
    return apiClient.post<CleanupEvent>('/events', data);
  },

  // Update event
  async updateEvent(id: string, data: UpdateEventDTO): Promise<CleanupEvent> {
    return apiClient.patch<CleanupEvent>(`/events/${id}`, data);
  },

  // Delete event
  async deleteEvent(id: string): Promise<void> {
    return apiClient.delete<void>(`/events/${id}`);
  },

  // Register for event
  async registerForEvent(eventId: string): Promise<EventRegistration> {
    return apiClient.post<EventRegistration>(`/events/${eventId}/register`);
  },

  // Unregister from event
  async unregisterFromEvent(eventId: string): Promise<void> {
    return apiClient.delete<void>(`/events/${eventId}/register`);
  },

  // Get event registrations
  async getEventRegistrations(eventId: string): Promise<EventRegistration[]> {
    return apiClient.get<EventRegistration[]>(`/events/${eventId}/registrations`);
  },

  // Check if user is registered for event
  async isUserRegistered(eventId: string): Promise<boolean> {
    try {
      const response = await apiClient.get<{ registered: boolean }>(`/events/${eventId}/registration-status`);
      return response.registered;
    } catch {
      return false;
    }
  },

  // Complete event
  async completeEvent(
    eventId: string, 
    data: { 
      litterCollected: number; 
      photos?: string[];
      attendees?: Array<{
        userId: string;
        attended: boolean;
        litterCollected?: number;
        contributionNote?: string;
      }>;
    }
  ): Promise<CleanupEvent> {
    try {
      // If attendees data is provided, update them first
      if (data.attendees && data.attendees.length > 0) {
        console.log('Updating attendees:', data.attendees);
        await apiClient.post(`/events/${eventId}/attendees/bulk`, {
          attendees: data.attendees,
        });
        console.log('Attendees updated successfully');
      }

      // Then complete the event
      console.log('Completing event with data:', {
        litterCollected: data.litterCollected,
        photos: data.photos,
      });
      const result = await apiClient.post<CleanupEvent>(`/events/${eventId}/complete`, {
        litterCollected: data.litterCollected,
        photos: data.photos,
      });
      console.log('Event completed successfully:', result);
      return result;
    } catch (error) {
      console.error('Error in completeEvent:', error);
      throw error;
    }
  },
};
