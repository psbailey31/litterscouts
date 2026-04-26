// User service for profile and user-related API calls
import { apiClient } from './api';
import type { User, Report, CleanupEvent } from '@/types';

export interface UserProfile extends User {
  reportCount: number;
  eventCount: number;
  totalLitterCollected: number;
  notificationEmail: boolean;
  notificationInApp: boolean;
  areasOfInterest: Array<{
    lat: number;
    lng: number;
    radius: number;
  }>;
}

export interface UserActivity {
  id: string;
  type: 'report' | 'event_created' | 'event_attended' | 'event_completed';
  timestamp: Date;
  title: string;
  description?: string;
  location?: {
    latitude: number;
    longitude: number;
    locationName?: string;
  };
}

export interface UpdateProfileDTO {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
}

export interface NotificationPreferences {
  notificationEmail: boolean;
  notificationInApp: boolean;
  areasOfInterest?: Array<{
    lat: number;
    lng: number;
    radius: number;
  }>;
}

export const userService = {
  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<UserProfile> {
    return apiClient.get<UserProfile>(`/users/${userId}`);
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: UpdateProfileDTO): Promise<User> {
    return apiClient.patch<User>(`/users/${userId}`, data);
  },

  /**
   * Get user's reports
   */
  async getUserReports(userId: string): Promise<Report[]> {
    return apiClient.get<Report[]>(`/users/${userId}/reports`);
  },

  /**
   * Get user's events (created and attended)
   */
  async getUserEvents(userId: string): Promise<CleanupEvent[]> {
    return apiClient.get<CleanupEvent[]>(`/users/${userId}/events`);
  },

  /**
   * Get user's activity timeline
   */
  async getUserActivity(userId: string): Promise<UserActivity[]> {
    return apiClient.get<UserActivity[]>(`/users/${userId}/activity`);
  },

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(
    userId: string,
    preferences: NotificationPreferences
  ): Promise<NotificationPreferences> {
    return apiClient.patch<NotificationPreferences>(`/users/${userId}/preferences`, preferences);
  },

  /**
   * Calculate and update user impact score
   */
  async calculateImpactScore(userId: string): Promise<{ impactScore: number }> {
    return apiClient.post<{ impactScore: number }>(`/users/${userId}/calculate-impact`, {});
  },
};
