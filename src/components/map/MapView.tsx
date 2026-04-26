import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import 'leaflet.heat';
import type { Report, CleanupEvent, FilterState, HotspotWithSeverity } from '@/types';

// Fix for default marker icons in Leaflet with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface WaterQualityMarker {
  name: string;
  latitude: number;
  longitude: number;
  status: 'excellent' | 'good' | 'sufficient' | 'poor' | 'unknown';
  lastSampled?: string;
}

interface MapViewProps {
  reports: Report[];
  events?: CleanupEvent[];
  hotspots?: HotspotWithSeverity[];
  waterQuality?: WaterQualityMarker[];
  filters?: FilterState;
  onMarkerClick?: (reportId: string) => void;
  onMapClick?: (lat: number, lng: number) => void;
  showHeatmap?: boolean;
  showClusters?: boolean;
  showHotspots?: boolean;
  showWaterQuality?: boolean;
  center?: [number, number];
  zoom?: number;
}

export function MapView({
  reports,
  events = [],
  hotspots = [],
  waterQuality = [],
  filters,
  onMarkerClick,
  onMapClick,
  showClusters = true,
  showHeatmap = false,
  showHotspots = false,
  showWaterQuality = false,
  center = [53.4, -9.0], // Centered on Ireland, minimizing UK visibility
  zoom = 7,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const heatLayerRef = useRef<L.HeatLayer | null>(null);
  const hotspotsLayerRef = useRef<L.LayerGroup | null>(null);
  const waterQualityLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Create map instance
    const map = L.map(mapRef.current).setView(center, zoom);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Handle map clicks
    if (onMapClick) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      });
    }

    // Create markers layer
    markersLayerRef.current = L.layerGroup();

    // Create hotspots layer
    hotspotsLayerRef.current = L.layerGroup();

    // Create water quality layer
    waterQualityLayerRef.current = L.layerGroup();

    // Create cluster group with custom configuration
    clusterGroupRef.current = L.markerClusterGroup({
      maxClusterRadius: 50, // Cluster markers within 50 pixels
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: true,
      zoomToBoundsOnClick: true,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        let sizeClass = 'marker-cluster-small';
        
        if (count > 10) {
          sizeClass = 'marker-cluster-large';
        } else if (count > 5) {
          sizeClass = 'marker-cluster-medium';
        }

        return L.divIcon({
          html: `<div><span>${count}</span></div>`,
          className: `marker-cluster ${sizeClass}`,
          iconSize: L.point(40, 40),
        });
      },
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
      clusterGroupRef.current = null;
      heatLayerRef.current = null;
      hotspotsLayerRef.current = null;
      waterQualityLayerRef.current = null;
    };
  }, []);

  // Filter reports based on filter state
  const getFilteredReports = (): Report[] => {
    if (!filters) return reports;

    return reports.filter((report) => {
      // Filter by date range
      if (filters.dateRange) {
        const reportDate = new Date(report.createdAt);
        if (filters.dateRange.start && reportDate < filters.dateRange.start) {
          return false;
        }
        if (filters.dateRange.end && reportDate > filters.dateRange.end) {
          return false;
        }
      }

      // Filter by litter type
      if (filters.litterTypes && filters.litterTypes.length > 0) {
        if (!filters.litterTypes.includes(report.litterType)) {
          return false;
        }
      }

      // Filter by quantity
      if (filters.quantities && filters.quantities.length > 0) {
        if (!filters.quantities.includes(report.quantity)) {
          return false;
        }
      }

      // Filter by verification status
      if (filters.verificationStatus && filters.verificationStatus.length > 0) {
        if (!filters.verificationStatus.includes(report.verificationStatus)) {
          return false;
        }
      }

      // Filter by cleaned status
      if (filters.showCleaned === false && report.cleanedAt) {
        return false;
      }

      return true;
    });
  };

  // Update markers when reports, filters, or clustering changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !clusterGroupRef.current) return;

    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const clusterGroup = clusterGroupRef.current;

    // Remove existing layers from map
    if (map.hasLayer(markersLayer)) {
      map.removeLayer(markersLayer);
    }
    if (map.hasLayer(clusterGroup)) {
      map.removeLayer(clusterGroup);
    }

    // Clear existing markers
    markersLayer.clearLayers();
    clusterGroup.clearLayers();

    // Get filtered reports
    const filteredReports = getFilteredReports();

    // Add report markers
    filteredReports.forEach((report) => {
      const isCleaned = !!report.cleanedAt;
      const icon = createCustomMarkerIcon(report.litterType, report.quantity, isCleaned);
      const marker = L.marker([report.latitude, report.longitude], { icon });

      // Add popup with report details
      const photoUrl = report.photoUrls && report.photoUrls.length > 0 ? report.photoUrls[0] : null;
      // Remove /api from the base URL for uploads since they're served at the root level
      const serverBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3005/api').replace('/api', '');
      const fullPhotoUrl = photoUrl ? (photoUrl.startsWith('http') ? photoUrl : `${serverBaseUrl}${photoUrl}`) : null;
      
      marker.bindPopup(`
        <div class="p-2 max-w-xs">
          ${fullPhotoUrl ? `
            <img 
              src="${fullPhotoUrl}" 
              alt="Litter photo" 
              class="w-full h-32 object-cover rounded mb-2 cursor-pointer hover:opacity-80 transition-opacity" 
              onclick="window.openImageModal('${fullPhotoUrl}')"
              onerror="this.style.display='none'" 
            />
          ` : ''}
          <h3 class="font-bold text-sm mb-1">${getLitterTypeLabel(report.litterType)}</h3>
          <p class="text-xs text-gray-600">Quantity: ${report.quantity}</p>
          <p class="text-xs text-gray-600">Status: ${report.verificationStatus}</p>
          ${isCleaned && report.cleanedAt ? `
            <p class="text-xs text-green-600 font-semibold">✓ Cleaned up</p>
            <p class="text-xs text-gray-600">Cleaned: ${new Date(report.cleanedAt).toLocaleDateString()}</p>
          ` : `
            <p class="text-xs text-gray-600">Date: ${new Date(report.createdAt).toLocaleDateString()}</p>
          `}
          ${report.description ? `<p class="text-xs mt-1">${report.description}</p>` : ''}
        </div>
      `);

      // Handle marker click
      if (onMarkerClick) {
        marker.on('click', () => {
          onMarkerClick(report.id);
        });
      }

      // Add to appropriate layer
      if (showClusters) {
        clusterGroup.addLayer(marker);
      } else {
        markersLayer.addLayer(marker);
      }
    });

    // Add event markers (always to regular layer, not clustered)
    events.forEach((event) => {
      const icon = createEventMarkerIcon(event.status);
      const marker = L.marker([event.latitude, event.longitude], { icon });

      const scheduledDate = new Date(event.scheduledDate).toLocaleDateString('en-IE', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      marker.bindPopup(`
        <div class="p-3 min-w-[250px]">
          <h3 class="font-bold text-base mb-2">${event.title}</h3>
          <div class="space-y-1 text-sm">
            <p class="flex items-start gap-2">
              <span class="text-gray-500">📍</span>
              <span>${event.locationName}</span>
            </p>
            <p class="flex items-start gap-2">
              <span class="text-gray-500">📅</span>
              <span>${scheduledDate}</span>
            </p>
            <p class="flex items-start gap-2">
              <span class="text-gray-500">⏱️</span>
              <span>${event.duration} minutes</span>
            </p>
            <p class="flex items-start gap-2">
              <span class="text-gray-500">👥</span>
              <span>${event.participantCount} participant${event.participantCount !== 1 ? 's' : ''}</span>
            </p>
            ${event.status === 'completed' && event.litterCollected ? `
              <p class="flex items-start gap-2">
                <span class="text-gray-500">♻️</span>
                <span>${event.litterCollected} kg collected</span>
              </p>
            ` : ''}
            <p class="mt-2 pt-2 border-t">
              <span class="inline-block px-2 py-1 text-xs font-semibold rounded ${
                event.status === 'upcoming' ? 'bg-amber-100 text-amber-800' :
                event.status === 'completed' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }">
                ${event.status.charAt(0).toUpperCase() + event.status.slice(1)}
              </span>
            </p>
          </div>
          ${event.description ? `
            <p class="text-xs text-gray-600 mt-2 pt-2 border-t">${event.description}</p>
          ` : ''}
          <button 
            onclick="window.location.href='/events?id=${event.id}'" 
            class="mt-3 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
          >
            View Event Details
          </button>
        </div>
      `);

      markersLayer.addLayer(marker);
    });

    // Add appropriate layer to map
    if (showClusters) {
      clusterGroup.addTo(map);
    }
    markersLayer.addTo(map);
  }, [reports, events, filters, showClusters, onMarkerClick]);

  // Update heat map when reports, filters, or showHeatmap changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Remove existing heat layer if it exists
    if (heatLayerRef.current && map.hasLayer(heatLayerRef.current)) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    // Only create heat layer if showHeatmap is true
    if (showHeatmap) {
      const filteredReports = getFilteredReports();

      // Convert reports to heat map data points
      // Format: [latitude, longitude, intensity]
      const heatData: [number, number, number][] = filteredReports.map((report) => {
        // Calculate intensity based on quantity level
        const intensityMap = {
          minimal: 0.3,
          moderate: 0.5,
          significant: 0.7,
          severe: 1.0,
        };
        const intensity = intensityMap[report.quantity] || 0.5;

        return [report.latitude, report.longitude, intensity];
      });

      // Create heat layer with configuration
      if (heatData.length > 0) {
        heatLayerRef.current = L.heatLayer(heatData, {
          radius: 25, // Radius of each heat point in pixels
          blur: 15, // Amount of blur
          maxZoom: 17, // Maximum zoom level for heat layer
          max: 1.0, // Maximum intensity value
          gradient: {
            0.0: '#0000ff', // Blue for low intensity
            0.3: '#00ffff', // Cyan
            0.5: '#00ff00', // Green
            0.7: '#ffff00', // Yellow
            0.9: '#ff8800', // Orange
            1.0: '#ff0000', // Red for high intensity
          },
        }).addTo(map);
      }
    }
  }, [reports, filters, showHeatmap]);

  // Update hotspots when hotspots data or showHotspots changes
  useEffect(() => {
    if (!mapInstanceRef.current || !hotspotsLayerRef.current) return;

    const map = mapInstanceRef.current;
    const hotspotsLayer = hotspotsLayerRef.current;

    // Remove existing hotspots layer if it exists
    if (map.hasLayer(hotspotsLayer)) {
      map.removeLayer(hotspotsLayer);
    }

    // Clear existing hotspots
    hotspotsLayer.clearLayers();

    // Only create hotspot layer if showHotspots is true
    if (showHotspots && hotspots.length > 0) {
      hotspots.forEach((hotspot) => {
        // Get color based on severity
        const { color, fillColor, opacity } = getHotspotStyle(hotspot.severity);

        // Create circle for hotspot boundary
        const circle = L.circle([hotspot.latitude, hotspot.longitude], {
          radius: hotspot.radius,
          color: color,
          fillColor: fillColor,
          fillOpacity: opacity,
          weight: 2,
        });

        // Create popup with hotspot details
        const lastReportDate = new Date(hotspot.lastReportDate).toLocaleDateString();
        const calculatedDate = new Date(hotspot.calculatedAt).toLocaleDateString();
        
        circle.bindPopup(`
          <div class="p-3 min-w-[200px]">
            <h3 class="font-bold text-base mb-2 flex items-center gap-2">
              <span class="text-2xl">${getHotspotIcon(hotspot.severity)}</span>
              <span>${getSeverityLabel(hotspot.severity)} Hotspot</span>
            </h3>
            <div class="space-y-1 text-sm">
              <p class="flex justify-between">
                <span class="text-gray-600">Reports:</span>
                <span class="font-semibold">${hotspot.reportCount}</span>
              </p>
              <p class="flex justify-between">
                <span class="text-gray-600">Severity Score:</span>
                <span class="font-semibold">${hotspot.severityScore.toFixed(2)}</span>
              </p>
              <p class="flex justify-between">
                <span class="text-gray-600">Radius:</span>
                <span class="font-semibold">${hotspot.radius}m</span>
              </p>
              <p class="flex justify-between">
                <span class="text-gray-600">Last Report:</span>
                <span class="font-semibold">${lastReportDate}</span>
              </p>
              <p class="text-xs text-gray-500 mt-2 pt-2 border-t">
                Calculated: ${calculatedDate}
              </p>
            </div>
          </div>
        `);

        // Add center marker for hotspot
        const centerMarker = L.marker([hotspot.latitude, hotspot.longitude], {
          icon: createHotspotMarkerIcon(hotspot.severity, hotspot.reportCount),
        });

        centerMarker.bindPopup(circle.getPopup()!);

        // Add to layer
        hotspotsLayer.addLayer(circle);
        hotspotsLayer.addLayer(centerMarker);
      });

      // Add hotspots layer to map
      hotspotsLayer.addTo(map);
    }
  }, [hotspots, showHotspots]);

  // Update water quality markers when waterQuality data or showWaterQuality changes
  useEffect(() => {
    if (!mapInstanceRef.current || !waterQualityLayerRef.current) return;

    const map = mapInstanceRef.current;
    const waterQualityLayer = waterQualityLayerRef.current;

    // Remove existing water quality layer if it exists
    if (map.hasLayer(waterQualityLayer)) {
      map.removeLayer(waterQualityLayer);
    }

    // Clear existing water quality markers
    waterQualityLayer.clearLayers();

    // Only create water quality layer if showWaterQuality is true
    if (showWaterQuality && waterQuality.length > 0) {
      waterQuality.forEach((beach) => {
        // Create marker for beach
        const icon = createWaterQualityMarkerIcon(beach.status);
        const marker = L.marker([beach.latitude, beach.longitude], { icon });

        // Create popup with water quality details
        const lastSampledDate = beach.lastSampled 
          ? new Date(beach.lastSampled).toLocaleDateString('en-IE', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
          : 'Unknown';

        marker.bindPopup(`
          <div class="p-3 min-w-[220px]">
            <h3 class="font-bold text-base mb-2 flex items-center gap-2">
              <span class="text-2xl">💧</span>
              <span>${beach.name}</span>
            </h3>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Water Quality:</span>
                <span class="inline-block px-2 py-1 text-xs font-semibold rounded ${getWaterQualityBadgeClass(beach.status)}">
                  ${beach.status.charAt(0).toUpperCase() + beach.status.slice(1)}
                </span>
              </div>
              ${beach.lastSampled ? `
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-600">Last Sampled:</span>
                  <span class="font-medium">${lastSampledDate}</span>
                </div>
              ` : ''}
              <div class="mt-2 pt-2 border-t text-xs text-gray-500">
                <p>Source: EU Bathing Water Quality (2024)</p>
              </div>
            </div>
          </div>
        `);

        // Add to layer
        waterQualityLayer.addLayer(marker);
      });

      // Add water quality layer to map
      waterQualityLayer.addTo(map);
    }
  }, [waterQuality, showWaterQuality]);

  // Handle geolocation
  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView(coords, 13);

          // Add user location marker
          L.marker(coords, {
            icon: L.divIcon({
              className: 'user-location-marker',
              html: '<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>',
              iconSize: [16, 16],
            }),
          }).addTo(mapInstanceRef.current);
        }
      },
      (error) => {
        console.warn(`Error getting location: ${error.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      
      {/* Geolocation button - optimized for touch with 44x44px minimum */}
      <button
        onClick={handleGeolocation}
        className="absolute top-2 right-2 sm:top-4 sm:right-4 z-[1000] bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 p-3 rounded-lg shadow-lg transition-colors touch-manipulation"
        title="Center map on your location"
        aria-label="Center map on your location"
        style={{ minWidth: '44px', minHeight: '44px' }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 sm:h-6 sm:w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>
    </div>
  );
}

// Helper function to create custom marker icons based on litter type
function createCustomMarkerIcon(litterType: string, quantity: string, isCleaned: boolean = false): L.DivIcon {
  const colors = {
    plastic: '#3B82F6', // blue
    metal: '#6B7280', // gray
    glass: '#10B981', // green
    organic: '#84CC16', // lime
    hazardous: '#EF4444', // red
    other: '#8B5CF6', // purple
  };

  const sizes = {
    minimal: 24,
    moderate: 28,
    significant: 32,
    severe: 36,
  };

  // Use green color for cleaned reports, otherwise use litter type color
  const color = isCleaned ? '#10B981' : (colors[litterType as keyof typeof colors] || colors.other);
  const size = sizes[quantity as keyof typeof sizes] || sizes.moderate;

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ${isCleaned ? 'opacity: 0.7;' : ''}
      ">
        <div style="
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(45deg);
          color: white;
          font-size: ${size * 0.4}px;
          font-weight: bold;
        ">
          ${isCleaned ? '✓' : getLitterTypeIcon(litterType)}
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
}

// Helper function to create event marker icons
function createEventMarkerIcon(status: string): L.DivIcon {
  const colors = {
    upcoming: '#F59E0B', // amber
    completed: '#10B981', // green
    cancelled: '#6B7280', // gray
  };

  const color = colors[status as keyof typeof colors] || colors.upcoming;

  return L.divIcon({
    className: 'event-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 16px;
        font-weight: bold;
      ">
        📅
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

// Helper function to get litter type icon
function getLitterTypeIcon(litterType: string): string {
  const icons: Record<string, string> = {
    plastic: '♻',
    metal: '⚙',
    glass: '◆',
    organic: '🌿',
    hazardous: '⚠',
    other: '●',
  };
  const icon = icons[litterType];
  return icon !== undefined ? icon : '●';
}

// Helper function to get litter type label
function getLitterTypeLabel(litterType: string): string {
  const label = litterType.charAt(0).toUpperCase() + litterType.slice(1);
  return label;
}

// Helper function to get hotspot style based on severity
function getHotspotStyle(severity: string): { color: string; fillColor: string; opacity: number } {
  const styles = {
    low: {
      color: '#FCD34D', // yellow-300
      fillColor: '#FEF3C7', // yellow-100
      opacity: 0.3,
    },
    medium: {
      color: '#FB923C', // orange-400
      fillColor: '#FFEDD5', // orange-100
      opacity: 0.4,
    },
    high: {
      color: '#F97316', // orange-500
      fillColor: '#FED7AA', // orange-200
      opacity: 0.5,
    },
    critical: {
      color: '#DC2626', // red-600
      fillColor: '#FEE2E2', // red-100
      opacity: 0.6,
    },
  };

  return styles[severity as keyof typeof styles] || styles.low;
}

// Helper function to create hotspot marker icon
function createHotspotMarkerIcon(severity: string, reportCount: number): L.DivIcon {
  const colors = {
    low: '#FCD34D',
    medium: '#FB923C',
    high: '#F97316',
    critical: '#DC2626',
  };

  const color = colors[severity as keyof typeof colors] || colors.low;
  const icon = getHotspotIcon(severity);

  return L.divIcon({
    className: 'hotspot-marker',
    html: `
      <div style="
        width: 40px;
        height: 40px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 3px 6px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 20px;
        font-weight: bold;
        position: relative;
      ">
        ${icon}
        <div style="
          position: absolute;
          bottom: -8px;
          right: -8px;
          background-color: white;
          color: ${color};
          border: 2px solid ${color};
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: bold;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        ">
          ${reportCount}
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

// Helper function to get hotspot icon based on severity
function getHotspotIcon(severity: string): string {
  const icons: Record<string, string> = {
    low: '⚠️',
    medium: '🔶',
    high: '🔥',
    critical: '🚨',
  };
  const icon = icons[severity];
  return icon !== undefined ? icon : '⚠️';
}

// Helper function to get severity label
function getSeverityLabel(severity: string): string {
  const labels: Record<string, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
  };
  return labels[severity] || 'Unknown';
}

// Helper function to create water quality marker icons
function createWaterQualityMarkerIcon(status: string): L.DivIcon {
  const colors = {
    excellent: '#10B981', // green-500
    good: '#3B82F6', // blue-500
    sufficient: '#F59E0B', // amber-500
    poor: '#EF4444', // red-500
    unknown: '#6B7280', // gray-500
  };

  const color = colors[status as keyof typeof colors] || colors.unknown;

  return L.divIcon({
    className: 'water-quality-marker',
    html: `
      <div style="
        width: 28px;
        height: 28px;
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
        font-weight: bold;
      ">
        💧
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

// Helper function to get water quality badge class
function getWaterQualityBadgeClass(status: string): string {
  const classes = {
    excellent: 'bg-green-100 text-green-800',
    good: 'bg-blue-100 text-blue-800',
    sufficient: 'bg-amber-100 text-amber-800',
    poor: 'bg-red-100 text-red-800',
    unknown: 'bg-gray-100 text-gray-800',
  };
  return classes[status as keyof typeof classes] || classes.unknown;
}
