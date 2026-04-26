// Core type definitions for Litter Scouts

export type LitterType = 'plastic' | 'metal' | 'glass' | 'organic' | 'hazardous' | 'other';

export type QuantityLevel = 'minimal' | 'moderate' | 'significant' | 'severe';

export type LocationSource = 'exif' | 'gps' | 'manual';

export type VerificationStatus = 'pending' | 'verified' | 'disputed';

export type EventStatus = 'upcoming' | 'completed' | 'cancelled';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface User {
  id: string;
  clerkId: string;
  email: string | null;
  username: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  impactScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Report {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  locationSource: LocationSource;
  photoUrls: string[];
  photoTimestamp?: Date;
  litterType: LitterType;
  quantity: QuantityLevel;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  submittedAt: Date;
  verificationStatus: VerificationStatus;
  cleanedAt?: Date;
  cleanedByUserId?: string;
}

export interface CleanupEvent {
  id: string;
  organizerId: string;
  organizerClerkId?: string; // Clerk ID of the organizer for permission checks
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  locationName: string;
  scheduledDate: Date;
  duration: number; // in minutes
  status: EventStatus;
  participantCount: number;
  litterCollected?: number; // in kilograms
  photos?: string[];
  equipmentProvided?: boolean; // Whether equipment is provided by organizer
  requiredItems?: string[]; // List of items participants need to bring
  createdAt: Date;
  updatedAt: Date;
}

export interface EventAttendee {
  id: string;
  userId: string;
  eventId: string;
  registeredAt: Date;
  attended: boolean;
  litterCollected?: number;
  contributionNote?: string;
  user: {
    id: string;
    clerkId: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  };
}

export interface EnvironmentalConcern {
  id: string;
  reportId: string;
  concernType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  createdAt: Date;
}

export interface Hotspot {
  id: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters
  reportCount: number;
  severityScore: number;
  lastReportDate: Date;
  calculatedAt: Date;
}

export type HotspotSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface HotspotWithSeverity extends Hotspot {
  severity: HotspotSeverity;
}

// DTOs (Data Transfer Objects)
export interface CreateReportDTO {
  photos: File[];
  latitude?: number;
  longitude?: number;
  locationSource: LocationSource;
  litterType: LitterType;
  quantity: QuantityLevel;
  description?: string;
  environmentalConcerns?: {
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
  }[];
}

export interface Verification {
  id: string;
  reportId: string;
  userId: string;
  verificationType: 'verify' | 'dispute';
  comment?: string;
  createdAt: Date;
  user: {
    id: string;
    username: string;
  };
}

export interface ReportResponseDTO extends Report {
  user: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  verificationCount: number;
  disputeCount: number;
  environmentalConcerns: EnvironmentalConcern[];
  verifications?: Verification[];
}

export interface FilterState {
  dateRange?: {
    start: Date;
    end: Date;
  };
  litterTypes?: LitterType[];
  quantities?: QuantityLevel[];
  verificationStatus?: VerificationStatus[];
  showCleaned?: boolean;
}

// Analytics types
export interface AnalyticsSummary {
  totalReports: number;
  totalEvents: number;
  totalUsers: number;
  totalLitterCollected: number; // in kilograms
  reportsByType: Record<string, number>;
  reportsByQuantity: Record<string, number>;
  verifiedReports: number;
  cleanedReports: number;
  activeUsers: number;
  upcomingEvents: number;
  completedEvents: number;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface TimeSeriesDataPoint {
  date: string;
  reportCount: number;
  eventCount: number;
  litterCollected: number;
}

export interface LitterTypeDistribution {
  type: string;
  count: number;
}

export interface QuantityAggregation {
  level: string;
  count: number;
}

// External environmental data types
export interface WeatherData {
  temperature: number; // Celsius
  feelsLike: number;
  humidity: number; // percentage
  windSpeed: number; // m/s
  windDirection: number; // degrees
  description: string;
  icon: string;
  timestamp: Date;
}

export interface TideData {
  tides: Array<{
    time: Date;
    height: number; // meters
    type: 'high' | 'low';
  }>;
  nextTide?: {
    time: Date;
    height: number;
    type: 'high' | 'low';
  };
}

export interface WaterQualityData {
  status: 'excellent' | 'good' | 'sufficient' | 'poor' | 'unknown';
  lastUpdated?: Date;
  parameters?: {
    bacteria?: number;
    ph?: number;
    temperature?: number;
  };
  source?: string;
}

export interface BeachQualityData {
  rating: 'blue-flag' | 'green-coast' | 'excellent' | 'good' | 'adequate' | 'poor' | 'unknown';
  awards?: string[];
  facilities?: string[];
  lastInspection?: Date;
}

export interface BiodiversityData {
  species?: Array<{
    name: string;
    scientificName?: string;
    status?: string;
  }>;
  protectedArea?: boolean;
  habitatType?: string;
  conservationStatus?: string;
}

export interface ExternalEnvironmentalData {
  weather?: WeatherData;
  tides?: TideData;
  waterQuality?: WaterQualityData;
  beachQuality?: BeachQualityData;
  biodiversity?: BiodiversityData;
}
