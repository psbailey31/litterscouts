// Report service for API interactions
import { apiClient } from './api';
import type { CreateReportDTO, ReportResponseDTO, Report } from '@/types';

export interface CreateReportPayload {
  latitude: number;
  longitude: number;
  locationSource: 'exif' | 'gps' | 'manual';
  litterType: string;
  quantity: string;
  description?: string;
  photoUrls: string[];
  photoTimestamp?: string;
  environmentalConcerns?: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
  }>;
}

export interface UploadPhotoResponse {
  url: string;
  thumbnailUrl?: string;
}

class ReportService {
  private getToken?: () => Promise<string | null>;

  setTokenGetter(getToken: () => Promise<string | null>) {
    this.getToken = getToken;
  }

  /**
   * Upload a photo to the server
   */
  async uploadPhoto(file: File): Promise<UploadPhotoResponse> {
    const formData = new FormData();
    formData.append('photo', file);

    // Get auth token
    const token = this.getToken ? await this.getToken() : null;

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3005/api'}/reports/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed. Please make sure the backend Clerk Secret Key is configured correctly.');
      }
      
      // Try to get error details from response
      try {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to upload photo');
      } catch {
        throw new Error('Failed to upload photo');
      }
    }

    return response.json();
  }

  /**
   * Create a new litter report
   */
  async createReport(data: CreateReportPayload): Promise<ReportResponseDTO> {
    return apiClient.post<ReportResponseDTO>('/reports', data);
  }

  /**
   * Get a single report by ID
   */
  async getReport(id: string): Promise<ReportResponseDTO> {
    return apiClient.get<ReportResponseDTO>(`/reports/${id}`);
  }

  /**
   * Get all reports with optional filters
   */
  async getReports(filters?: {
    dateRange?: { start: string; end: string };
    litterTypes?: string[];
    quantities?: string[];
    verificationStatus?: string[];
    bounds?: { north: number; south: number; east: number; west: number };
  }): Promise<ReportResponseDTO[]> {
    const params = new URLSearchParams();
    
    if (filters?.dateRange) {
      params.append('startDate', filters.dateRange.start);
      params.append('endDate', filters.dateRange.end);
    }
    
    if (filters?.litterTypes?.length) {
      params.append('litterTypes', filters.litterTypes.join(','));
    }
    
    if (filters?.quantities?.length) {
      params.append('quantities', filters.quantities.join(','));
    }
    
    if (filters?.verificationStatus?.length) {
      params.append('verificationStatus', filters.verificationStatus.join(','));
    }
    
    if (filters?.bounds) {
      params.append('north', filters.bounds.north.toString());
      params.append('south', filters.bounds.south.toString());
      params.append('east', filters.bounds.east.toString());
      params.append('west', filters.bounds.west.toString());
    }

    const queryString = params.toString();
    return apiClient.get<ReportResponseDTO[]>(`/reports${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Verify a report
   */
  async verifyReport(reportId: string, comment?: string): Promise<void> {
    return apiClient.post(`/reports/${reportId}/verify`, { comment });
  }

  /**
   * Dispute a report
   */
  async disputeReport(reportId: string, comment?: string): Promise<void> {
    return apiClient.post(`/reports/${reportId}/dispute`, { comment });
  }

  /**
   * Mark a report as cleaned up
   */
  async markAsCleaned(reportId: string): Promise<void> {
    return apiClient.post(`/reports/${reportId}/mark-cleaned`);
  }

  /**
   * Delete a report (only by owner)
   */
  async deleteReport(reportId: string): Promise<void> {
    return apiClient.delete(`/reports/${reportId}`);
  }
}

export const reportService = new ReportService();
