import { apiClient } from './api';

export interface Notification {
  id: string;
  userId: string;
  type: 'new_report' | 'new_event' | 'event_reminder' | 'report_verified' | 'report_disputed';
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: 'report' | 'event';
  latitude?: number;
  longitude?: number;
  read: boolean;
  emailSent: boolean;
  createdAt: string;
}

class NotificationService {
  async getNotifications(unreadOnly: boolean = false): Promise<Notification[]> {
    const query = unreadOnly ? '?unreadOnly=true' : '';
    return apiClient.get<Notification[]>(`/notifications${query}`);
  }

  async getUnreadCount(): Promise<number> {
    const result = await apiClient.get<{ count: number }>('/notifications/unread-count');
    return result.count;
  }

  async markAsRead(notificationId: string): Promise<void> {
    await apiClient.patch(`/notifications/${notificationId}/read`);
  }

  async markAllAsRead(): Promise<number> {
    const result = await apiClient.patch<{ count: number }>('/notifications/read-all');
    return result.count;
  }
}

export const notificationService = new NotificationService();
