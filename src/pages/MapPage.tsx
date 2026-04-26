import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { MapView, MapFilters } from '@/components/map';
import { ReportDetailModal } from '@/components/report';
import { analyticsService } from '@/services/analyticsService';
import { reportService } from '@/services/reportService';
import { eventService } from '@/services/eventService';
import { IRISH_BEACHES } from '@/data/irishBeaches';
import { useToast } from '@/components/common/Toast';
import type { Report, FilterState, HotspotWithSeverity, CleanupEvent, ReportResponseDTO } from '@/types';

/**
 * Map page - Interactive map displaying litter reports and cleanup events
 */
export function MapPage() {
  const { getToken, isSignedIn } = useAuth();
  const { toast } = useToast();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<ReportResponseDTO | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [filters, setFilters] = useState<FilterState>({ showCleaned: false });
  const [showClusters, setShowClusters] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showHotspots, setShowHotspots] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const [showWaterQuality, setShowWaterQuality] = useState(false);
  const [hotspots, setHotspots] = useState<HotspotWithSeverity[]>([]);
  const [isLoadingHotspots, setIsLoadingHotspots] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [events, setEvents] = useState<CleanupEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

  // Set up token getter for report service
  useEffect(() => {
    reportService.setTokenGetter(getToken);
  }, [getToken]);

  // Fetch reports from API
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setIsLoadingReports(true);
        
        // Convert FilterState to API format (Date objects to ISO strings)
        const apiFilters: Parameters<typeof reportService.getReports>[0] = filters.dateRange
          ? {
              dateRange: {
                start: filters.dateRange.start.toISOString(),
                end: filters.dateRange.end.toISOString(),
              },
              litterTypes: filters.litterTypes,
              quantities: filters.quantities,
              verificationStatus: filters.verificationStatus,
            }
          : {
              litterTypes: filters.litterTypes,
              quantities: filters.quantities,
              verificationStatus: filters.verificationStatus,
            };
        
        const data = await reportService.getReports(apiFilters);
        setReports(data);
      } catch (error) {
        console.error('Failed to fetch reports:', error);
        // Fall back to sample data on error
        setReports(sampleReports);
      } finally {
        setIsLoadingReports(false);
      }
    };

    fetchReports();
  }, [filters]);

  // Fetch events from API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoadingEvents(true);
        // Fetch upcoming and completed events to show on map (exclude cancelled)
        const data = await eventService.getEvents();
        // Filter out cancelled events
        const activeEvents = data.filter(event => event.status !== 'cancelled');
        setEvents(activeEvents);
      } catch (error) {
        console.error('Failed to fetch events:', error);
        // Fall back to sample data on error (also filter cancelled)
        setEvents(sampleEvents.filter(event => event.status !== 'cancelled'));
      } finally {
        setIsLoadingEvents(false);
      }
    };

    fetchEvents();
  }, []);

  // Set up global function for opening image modal
  useEffect(() => {
    (window as any).openImageModal = (url: string) => {
      setModalImageUrl(url);
    };
    return () => {
      delete (window as any).openImageModal;
    };
  }, []);

  // Sample data for fallback
  const sampleEvents: CleanupEvent[] = [
    {
      id: 'event1',
      organizerId: 'user1',
      title: 'Sandymount Beach Cleanup',
      description: 'Join us for a community cleanup at Sandymount Beach',
      latitude: 53.3333,
      longitude: -6.2167,
      locationName: 'Sandymount Beach, Dublin',
      scheduledDate: new Date('2024-02-15T10:00:00'),
      duration: 120,
      status: 'upcoming',
      participantCount: 15,
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-10'),
    },
    {
      id: 'event2',
      organizerId: 'user2',
      title: 'Galway Bay Cleanup',
      description: 'Monthly cleanup event at Salthill Beach',
      latitude: 53.2577,
      longitude: -9.0810,
      locationName: 'Salthill Beach, Galway',
      scheduledDate: new Date('2024-02-20T14:00:00'),
      duration: 90,
      status: 'upcoming',
      participantCount: 8,
      createdAt: new Date('2024-01-12'),
      updatedAt: new Date('2024-01-12'),
    },
    {
      id: 'event3',
      organizerId: 'user3',
      title: 'Cork Harbor Cleanup - Completed',
      description: 'Successful cleanup event with great turnout',
      latitude: 51.8503,
      longitude: -8.2944,
      locationName: 'Cork Harbor',
      scheduledDate: new Date('2024-01-10T11:00:00'),
      duration: 150,
      status: 'completed',
      participantCount: 25,
      litterCollected: 45.5,
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-10'),
    },
  ];

  const sampleReports: Report[] = [
    {
      id: '1',
      userId: 'user1',
      latitude: 53.3498,
      longitude: -6.2603,
      locationSource: 'gps',
      photoUrls: ['https://example.com/photo1.jpg'],
      litterType: 'plastic',
      quantity: 'moderate',
      description: 'Plastic bottles and bags near the shore',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      submittedAt: new Date('2024-01-15'),
      verificationStatus: 'verified',
    },
    {
      id: '2',
      userId: 'user2',
      latitude: 53.2707,
      longitude: -9.0568,
      locationSource: 'gps',
      photoUrls: ['https://example.com/photo2.jpg'],
      litterType: 'glass',
      quantity: 'minimal',
      description: 'Broken glass bottles',
      createdAt: new Date('2024-01-16'),
      updatedAt: new Date('2024-01-16'),
      submittedAt: new Date('2024-01-16'),
      verificationStatus: 'pending',
    },
    {
      id: '3',
      userId: 'user3',
      latitude: 51.8969,
      longitude: -8.4863,
      locationSource: 'manual',
      photoUrls: ['https://example.com/photo3.jpg'],
      litterType: 'metal',
      quantity: 'significant',
      description: 'Metal cans and containers',
      createdAt: new Date('2024-01-17'),
      updatedAt: new Date('2024-01-17'),
      submittedAt: new Date('2024-01-17'),
      verificationStatus: 'verified',
    },
    {
      id: '4',
      userId: 'user4',
      latitude: 53.3520,
      longitude: -6.2650,
      locationSource: 'gps',
      photoUrls: ['https://example.com/photo4.jpg'],
      litterType: 'plastic',
      quantity: 'severe',
      description: 'Large amount of plastic waste',
      createdAt: new Date('2024-01-18'),
      updatedAt: new Date('2024-01-18'),
      submittedAt: new Date('2024-01-18'),
      verificationStatus: 'verified',
    },
    {
      id: '5',
      userId: 'user5',
      latitude: 53.3450,
      longitude: -6.2580,
      locationSource: 'gps',
      photoUrls: ['https://example.com/photo5.jpg'],
      litterType: 'hazardous',
      quantity: 'moderate',
      description: 'Chemical containers',
      createdAt: new Date('2024-01-19'),
      updatedAt: new Date('2024-01-19'),
      submittedAt: new Date('2024-01-19'),
      verificationStatus: 'disputed',
    },
    {
      id: '6',
      userId: 'user6',
      latitude: 53.3480,
      longitude: -6.2620,
      locationSource: 'manual',
      photoUrls: ['https://example.com/photo6.jpg'],
      litterType: 'organic',
      quantity: 'minimal',
      description: 'Seaweed and organic debris',
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-01-20'),
      submittedAt: new Date('2024-01-20'),
      verificationStatus: 'verified',
    },
  ];

  const handleMarkerClick = async (reportId: string) => {
    setSelectedReportId(reportId);
    setIsLoadingReport(true);
    
    try {
      const report = await reportService.getReport(reportId);
      setSelectedReport(report);
    } catch (error) {
      console.error('Failed to fetch report details:', error);
    } finally {
      setIsLoadingReport(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedReportId(null);
    setSelectedReport(null);
  };

  const handleVerify = async (reportId: string, comment?: string) => {
    try {
      await reportService.verifyReport(reportId, comment);
      // Refresh the report details
      const updatedReport = await reportService.getReport(reportId);
      setSelectedReport(updatedReport);
      // Refresh the reports list
      const apiFilters: Parameters<typeof reportService.getReports>[0] = filters.dateRange
        ? {
            dateRange: {
              start: filters.dateRange.start.toISOString(),
              end: filters.dateRange.end.toISOString(),
            },
            litterTypes: filters.litterTypes,
            quantities: filters.quantities,
            verificationStatus: filters.verificationStatus,
          }
        : {
            litterTypes: filters.litterTypes,
            quantities: filters.quantities,
            verificationStatus: filters.verificationStatus,
          };
      const data = await reportService.getReports(apiFilters);
      setReports(data);
    } catch (error: any) {
      console.error('Failed to verify report:', error);
      toast(error.message || 'Failed to verify report. Please try again.', 'error');
    }
  };

  const handleDispute = async (reportId: string, comment?: string) => {
    try {
      await reportService.disputeReport(reportId, comment);
      // Refresh the report details
      const updatedReport = await reportService.getReport(reportId);
      setSelectedReport(updatedReport);
      // Refresh the reports list
      const apiFilters: Parameters<typeof reportService.getReports>[0] = filters.dateRange
        ? {
            dateRange: {
              start: filters.dateRange.start.toISOString(),
              end: filters.dateRange.end.toISOString(),
            },
            litterTypes: filters.litterTypes,
            quantities: filters.quantities,
            verificationStatus: filters.verificationStatus,
          }
        : {
            litterTypes: filters.litterTypes,
            quantities: filters.quantities,
            verificationStatus: filters.verificationStatus,
          };
      const data = await reportService.getReports(apiFilters);
      setReports(data);
    } catch (error: any) {
      console.error('Failed to dispute report:', error);
      toast(error.message || 'Failed to dispute report. Please try again.', 'error');
    }
  };

  const handleMarkCleaned = async (reportId: string) => {
    try {
      await reportService.markAsCleaned(reportId);
      // Refresh the report details
      const updatedReport = await reportService.getReport(reportId);
      setSelectedReport(updatedReport);
      // Refresh the reports list
      const apiFilters: Parameters<typeof reportService.getReports>[0] = filters.dateRange
        ? {
            dateRange: {
              start: filters.dateRange.start.toISOString(),
              end: filters.dateRange.end.toISOString(),
            },
            litterTypes: filters.litterTypes,
            quantities: filters.quantities,
            verificationStatus: filters.verificationStatus,
          }
        : {
            litterTypes: filters.litterTypes,
            quantities: filters.quantities,
            verificationStatus: filters.verificationStatus,
          };
      const data = await reportService.getReports(apiFilters);
      setReports(data);
      toast('Report marked as cleaned up!', 'success');
    } catch (error: any) {
      console.error('Failed to mark report as cleaned:', error);
      toast(error.message || 'Failed to mark report as cleaned. Please try again.', 'error');
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    console.log('Map clicked at:', lat, lng);
    // In later tasks, this can be used for manual location selection
  };

  const handleToggleClusters = () => {
    setShowClusters(!showClusters);
  };

  const handleToggleHeatmap = () => {
    setShowHeatmap(!showHeatmap);
  };

  const handleToggleHotspots = () => {
    setShowHotspots(!showHotspots);
  };

  const handleToggleEvents = () => {
    setShowEvents(!showEvents);
  };

  // Fetch hotspots when hotspot view is enabled
  useEffect(() => {
    if (showHotspots && hotspots.length === 0) {
      setIsLoadingHotspots(true);
      analyticsService.getHotspots()
        .then((data) => {
          setHotspots(data);
        })
        .catch((error) => {
          console.error('Failed to fetch hotspots:', error);
        })
        .finally(() => {
          setIsLoadingHotspots(false);
        });
    }
  }, [showHotspots]);

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white border-b border-gray-200 px-4 py-3 sm:py-4 sm:px-6 lg:px-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Interactive Map</h2>
        <p className="mt-1 text-xs sm:text-sm text-gray-600">
          View litter reports and cleanup events across Ireland
        </p>
      </div>
      
      <div className="flex-1 p-2 sm:p-4">
        <div className="h-full bg-white rounded-lg shadow-lg overflow-hidden relative">
          {isLoadingReports || isLoadingEvents ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center px-4">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-sm sm:text-base text-gray-600">
                  Loading {isLoadingReports && isLoadingEvents ? 'map data' : isLoadingReports ? 'reports' : 'events'}...
                </p>
              </div>
            </div>
          ) : (
            <MapView
              reports={reports}
              events={showEvents ? events : []}
              hotspots={hotspots}
              waterQuality={IRISH_BEACHES}
              filters={filters}
              showClusters={showClusters}
              showHeatmap={showHeatmap}
              showHotspots={showHotspots}
              showWaterQuality={showWaterQuality}
              onMarkerClick={handleMarkerClick}
              onMapClick={handleMapClick}
            />
          )}
          
          <MapFilters
            filters={filters}
            onFiltersChange={setFilters}
            onToggleClusters={handleToggleClusters}
            showClusters={showClusters}
            onToggleHeatmap={handleToggleHeatmap}
            showHeatmap={showHeatmap}
            onToggleEvents={handleToggleEvents}
            showEvents={showEvents}
            onToggleHotspots={handleToggleHotspots}
            showHotspots={showHotspots}
            isLoadingHotspots={isLoadingHotspots}
            onToggleWaterQuality={() => setShowWaterQuality(!showWaterQuality)}
            showWaterQuality={showWaterQuality}
          />
        </div>
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          isOpen={!!selectedReport}
          onClose={handleCloseModal}
          onVerify={isSignedIn ? handleVerify : undefined}
          onDispute={isSignedIn ? handleDispute : undefined}
          onMarkCleaned={isSignedIn ? handleMarkCleaned : undefined}
        />
      )}

      {/* Loading indicator for report details */}
      {isLoadingReport && selectedReportId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading report details...</p>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {modalImageUrl && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[2000] p-4"
          onClick={() => setModalImageUrl(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setModalImageUrl(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 text-2xl font-bold"
            >
              ✕
            </button>
            <img 
              src={modalImageUrl} 
              alt="Full size litter photo" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default MapPage;
