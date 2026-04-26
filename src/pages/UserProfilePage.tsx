import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useClerk } from '@clerk/clerk-react';
import { userService, type UserProfile, type UserActivity } from '@/services/userService';
import type { Report, CleanupEvent } from '@/types';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { NotificationSettings, type NotificationPreferences, BadgeDisplay } from '@/components/auth';
import { UserQRCode } from '@/components/user/UserQRCode';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default marker icon issue
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

export function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [events, setEvents] = useState<{ registered: CleanupEvent[]; organized: CleanupEvent[] }>({ registered: [], organized: [] });
  const [activity, setActivity] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'events' | 'activity' | 'notifications'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
  });
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>({
    notificationEmail: true,
    notificationInApp: true,
    areasOfInterest: [],
  });

  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    if (!userId) {
      setError('User ID is required');
      setLoading(false);
      return;
    }

    loadProfileData();
  }, [userId]);

  const loadProfileData = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const [profileData, reportsData, eventsData, activityData] = await Promise.all([
        userService.getProfile(userId),
        userService.getUserReports(userId),
        userService.getUserEvents(userId),
        userService.getUserActivity(userId),
      ]);

      setProfile(profileData);
      setReports(reportsData);
      // Handle both array and object response formats
      if (Array.isArray(eventsData)) {
        setEvents({ registered: eventsData, organized: [] });
      } else {
        setEvents(eventsData);
      }
      setActivity(activityData);
      
      setEditForm({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        username: profileData.username || '',
        email: profileData.email || '',
      });

      // Set notification preferences from profile
      setNotificationPreferences({
        notificationEmail: profileData.notificationEmail ?? true,
        notificationInApp: profileData.notificationInApp ?? true,
        areasOfInterest: profileData.areasOfInterest || [],
      });
    } catch (err) {
      console.error('Error loading profile data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (profile) {
      setEditForm({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        username: profile.username || '',
        email: profile.email || '',
      });
    }
  };

  const handleSaveProfile = async () => {
    if (!userId) return;

    try {
      await userService.updateProfile(userId, editForm);
      setIsEditing(false);
      await loadProfileData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  const handleSaveNotificationPreferences = async (preferences: NotificationPreferences) => {
    if (!userId) return;

    try {
      await userService.updateNotificationPreferences(userId, preferences);
      setNotificationPreferences(preferences);
      setActiveTab('overview'); // Return to overview after saving
    } catch (err) {
      throw err; // Let NotificationSettings component handle the error
    }
  };

  const handleCancelNotificationSettings = () => {
    // Reset to current preferences
    if (profile) {
      setNotificationPreferences({
        notificationEmail: profile.notificationEmail ?? true,
        notificationInApp: profile.notificationInApp ?? true,
        areasOfInterest: profile.areasOfInterest || [],
      });
    }
    setActiveTab('overview');
  };

  const calculateImpactScore = () => {
    if (!profile) return 0;
    // Impact score calculation: reports * 10 + events attended * 20
    const reportCount = profile.reportCount || 0;
    const eventCount = profile.eventCount || 0;
    return reportCount * 10 + eventCount * 20;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Profile not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              {profile.avatarUrl && (
                <img
                  src={profile.avatarUrl}
                  alt={profile.username}
                  className="h-20 w-20 rounded-full object-cover border-4 border-blue-100"
                />
              )}
              <div>
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <label htmlFor="edit-firstName" className="sr-only">First name</label>
                        <input
                          id="edit-firstName"
                          type="text"
                          value={editForm.firstName}
                          onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                          placeholder="First name"
                          className="px-3 py-1 border border-gray-300 rounded-md w-full"
                        />
                      </div>
                      <div className="flex-1">
                        <label htmlFor="edit-lastName" className="sr-only">Last name</label>
                        <input
                          id="edit-lastName"
                          type="text"
                          value={editForm.lastName}
                          onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                          placeholder="Last name"
                          className="px-3 py-1 border border-gray-300 rounded-md w-full"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="edit-username" className="sr-only">Username</label>
                      <input
                        id="edit-username"
                        type="text"
                        value={editForm.username}
                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                        placeholder="Username"
                        className="px-3 py-1 border border-gray-300 rounded-md w-full"
                      />
                    </div>
                    <div className="relative">
                      <label htmlFor="edit-email" className="sr-only">Email address</label>
                      <input
                        id="edit-email"
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        placeholder="Email address (optional)"
                        className="px-3 py-1 border border-gray-300 rounded-md w-full"
                      />
                      {!profile.email && (
                        <p className="text-xs text-blue-600 mt-1">
                          💡 Add an email to receive email notifications
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {profile.firstName && profile.lastName
                        ? `${profile.firstName} ${profile.lastName}`
                        : profile.username}
                    </h1>
                    <p className="text-gray-600">@{profile.username}</p>
                    {!profile.email && (
                      <p className="text-sm text-amber-600 mt-1">
                        📧 No email address set
                      </p>
                    )}
                    {profile.email && (
                      <p className="text-sm text-gray-500 mt-1">
                        📧 {profile.email}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
            {isOwnProfile && (
              <div className="flex space-x-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSaveProfile}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleEditProfile}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Edit Profile
                    </button>
                    <button
                      onClick={async () => {
                        await signOut();
                        navigate('/');
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Sign Out
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Statistics and Badge */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
            {/* Reports Submitted */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-blue-200">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="bg-blue-200 rounded-full p-3">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-700 mb-1">Reports Submitted</p>
                  <p className="text-4xl font-bold text-blue-600">{profile.reportCount}</p>
                </div>
              </div>
            </div>

            {/* Events Attended */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-green-200">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="bg-green-200 rounded-full p-3">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-green-700 mb-1">Events Attended</p>
                  <p className="text-4xl font-bold text-green-600">{profile.eventCount}</p>
                </div>
              </div>
            </div>

            {/* Total Litter Collected */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-emerald-200">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="bg-emerald-200 rounded-full p-3">
                  <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-700 mb-1">Litter Collected</p>
                  <p className="text-4xl font-bold text-emerald-600">{profile.totalLitterCollected.toFixed(1)}</p>
                  <p className="text-xs text-emerald-600 font-medium">kg</p>
                </div>
              </div>
            </div>

            {/* Impact Score */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-purple-200">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="bg-purple-200 rounded-full p-3">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-700 mb-1">Impact Score</p>
                  <p className="text-4xl font-bold text-purple-600">{calculateImpactScore()}</p>
                </div>
              </div>
            </div>

            {/* Current Badge */}
            <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-yellow-200 flex items-center justify-center">
              <BadgeDisplay impactScore={calculateImpactScore()} size="small" />
            </div>
          </div>
          
          {/* Badge Progress Section */}
          <div className="mt-6 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-xl p-8 shadow-md border border-purple-200">
            <div className="flex items-center justify-center mb-2">
              <svg className="w-6 h-6 text-purple-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <h3 className="text-xl font-bold text-gray-900 text-center">Your Achievement Badge</h3>
            </div>
            <p className="text-center text-sm text-gray-600 mb-6">Keep contributing to unlock higher badges!</p>
            <BadgeDisplay impactScore={calculateImpactScore()} showProgress={true} size="large" />
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {(['overview', 'reports', 'events', 'activity', ...(isOwnProfile ? ['notifications'] as const : [])] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 text-sm font-medium capitalize ${
                    activeTab === tab
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* QR Code for own profile */}
                {isOwnProfile && (
                  <UserQRCode />
                )}

                <div>
                  <h2 className="text-xl font-semibold mb-4">Contribution Map</h2>
                  {reports.length > 0 && reports[0] ? (
                    <div className="h-96 rounded-lg overflow-hidden">
                      <MapContainer
                        center={[reports[0].latitude, reports[0].longitude]}
                        zoom={10}
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {reports.map((report) => (
                          <Marker
                            key={report.id}
                            position={[report.latitude, report.longitude]}
                          >
                            <Popup>
                              <div>
                                <p className="font-semibold capitalize">{report.litterType}</p>
                                <p className="text-sm text-gray-600">{formatDate(report.createdAt)}</p>
                              </div>
                            </Popup>
                          </Marker>
                        ))}
                      </MapContainer>
                    </div>
                  ) : (
                    <p className="text-gray-500">No reports submitted yet</p>
                  )}
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
                  {activity.length > 0 ? (
                    <div className="space-y-3">
                      {activity.slice(0, 5).map((item, index) => (
                        <div key={`overview-${item.type}-${item.id}-${index}`} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0">
                            {item.type === 'report' && (
                              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600">📍</span>
                              </div>
                            )}
                            {item.type.startsWith('event') && (
                              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-green-600">🗓️</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.title}</p>
                            {item.description && (
                              <p className="text-sm text-gray-600">{item.description}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">{formatDate(item.timestamp)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No activity yet</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Submitted Reports</h2>
                {reports.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reports.map((report) => (
                      <div key={report.id} className="bg-gray-50 rounded-lg p-4">
                        {report.photoUrls.length > 0 && (
                          <img
                            src={report.photoUrls[0]}
                            alt="Report"
                            className="w-full h-48 object-cover rounded-md mb-3"
                          />
                        )}
                        <div className="space-y-2">
                          <p className="font-semibold capitalize">{report.litterType}</p>
                          <p className="text-sm text-gray-600 capitalize">Quantity: {report.quantity}</p>
                          {report.description && (
                            <p className="text-sm text-gray-700">{report.description}</p>
                          )}
                          <p className="text-xs text-gray-500">{formatDate(report.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No reports submitted yet</p>
                )}
              </div>
            )}

            {activeTab === 'events' && (
              <div className="space-y-6">
                {/* Registered Events */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Registered Events</h2>
                  {events.registered.length > 0 ? (
                    <div className="space-y-4">
                      {events.registered.map((event) => (
                        <div key={`registered-${event.id}`} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-lg">{event.title}</h3>
                              <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                              <p className="text-sm text-gray-500 mt-2">
                                📍 {event.locationName}
                              </p>
                              <p className="text-sm text-gray-500">
                                🗓️ {formatDate(event.scheduledDate)}
                              </p>
                              <p className="text-sm text-gray-500">
                                👥 {event.participantCount} participants
                              </p>
                              {event.litterCollected && (
                                <p className="text-sm text-green-600 font-medium mt-2">
                                  ♻️ {event.litterCollected} kg collected
                                </p>
                              )}
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                event.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : event.status === 'upcoming'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {event.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No registered events yet</p>
                  )}
                </div>

                {/* Organized Events */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Organized Events</h2>
                  {events.organized.length > 0 ? (
                    <div className="space-y-4">
                      {events.organized.map((event) => (
                        <div key={`organized-${event.id}`} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-lg">{event.title}</h3>
                              <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                              <p className="text-sm text-gray-500 mt-2">
                                📍 {event.locationName}
                              </p>
                              <p className="text-sm text-gray-500">
                                🗓️ {formatDate(event.scheduledDate)}
                              </p>
                              <p className="text-sm text-gray-500">
                                👥 {event.participantCount} participants
                              </p>
                              {event.litterCollected && (
                                <p className="text-sm text-green-600 font-medium mt-2">
                                  ♻️ {event.litterCollected} kg collected
                                </p>
                              )}
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                event.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : event.status === 'upcoming'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {event.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No organized events yet</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Activity Timeline</h2>
                {activity.length > 0 ? (
                  <div className="space-y-4">
                    {activity.map((item, index) => (
                      <div key={`${item.type}-${item.id}-${index}`} className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                            {item.type === 'report' && <span className="text-xl">📍</span>}
                            {item.type === 'event_created' && <span className="text-xl">➕</span>}
                            {item.type === 'event_attended' && <span className="text-xl">✅</span>}
                            {item.type === 'event_completed' && <span className="text-xl">🎉</span>}
                          </div>
                        </div>
                        <div className="flex-1 bg-gray-50 rounded-lg p-4">
                          <p className="font-medium text-gray-900">{item.title}</p>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          )}
                          {item.location && (
                            <p className="text-sm text-gray-500 mt-1">
                              📍 {item.location.locationName || `${item.location.latitude?.toFixed(4)}, ${item.location.longitude?.toFixed(4)}`}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-2">{formatDate(item.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No activity yet</p>
                )}
              </div>
            )}

            {activeTab === 'notifications' && isOwnProfile && (
              <NotificationSettings
                preferences={notificationPreferences}
                onSave={handleSaveNotificationPreferences}
                onCancel={handleCancelNotificationSettings}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfilePage;
