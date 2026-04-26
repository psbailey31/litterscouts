// Service exports
export { apiClient } from './api';
export { reportService } from './reportService';
export { analyticsService } from './analyticsService';
export { eventService } from './eventService';
export { userService } from './userService';
export { externalDataService } from './externalDataService';
export { notificationService } from './notificationService';
export type { ApiError } from './api';
export type { CreateReportPayload, UploadPhotoResponse } from './reportService';
export type { CreateEventDTO, UpdateEventDTO, EventFilters, EventRegistration } from './eventService';
export type { UserProfile, UserActivity, UpdateProfileDTO } from './userService';
export type { Notification, NotificationCount } from './notificationService';
