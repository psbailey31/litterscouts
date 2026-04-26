import { useState, useEffect } from 'react';
import type { EventAttendee } from '@/types';

interface AttendeeManagementProps {
  eventId: string;
  onClose: () => void;
  onSave: (attendees: Array<{
    userId: string;
    attended: boolean;
    litterCollected?: number;
    contributionNote?: string;
  }>) => Promise<void>;
  isLoading?: boolean;
}

export function AttendeeManagement({
  eventId,
  onClose,
  onSave,
  isLoading = false,
}: AttendeeManagementProps) {
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editedAttendees, setEditedAttendees] = useState<Map<string, Partial<EventAttendee>>>(new Map());

  useEffect(() => {
    fetchAttendees();
  }, [eventId]);

  const fetchAttendees = async () => {
    try {
      setLoading(true);
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3005/api';
      const response = await fetch(`${API_BASE_URL}/events/${eventId}/attendees`, {
        headers: {
          'Authorization': `Bearer ${await (window as any).Clerk?.session?.getToken()}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch attendees:', response.status, errorText);
        throw new Error(`Failed to fetch attendees: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();
      setAttendees(data);
    } catch (err) {
      console.error('Error in fetchAttendees:', err);
      setError(err instanceof Error ? err.message : 'Failed to load attendees');
    } finally {
      setLoading(false);
    }
  };

  const handleAttendeeChange = (userId: string, field: string, value: any) => {
    setEditedAttendees(prev => {
      const updated = new Map(prev);
      const current = updated.get(userId) || {};
      updated.set(userId, { ...current, [field]: value });
      return updated;
    });
  };

  const getAttendeeValue = (attendee: EventAttendee, field: keyof EventAttendee) => {
    const edited = editedAttendees.get(attendee.userId);
    return edited && field in edited ? edited[field] : attendee[field];
  };

  const handleSave = async () => {
    const updates = Array.from(editedAttendees.entries()).map(([userId, changes]) => {
      const attendee = attendees.find(a => a.userId === userId);
      return {
        userId,
        attended: changes.attended ?? attendee?.attended ?? false,
        litterCollected: changes.litterCollected ?? attendee?.litterCollected,
        contributionNote: changes.contributionNote ?? attendee?.contributionNote,
      };
    });

    await onSave(updates);
  };

  const getTotalLitter = () => {
    return attendees.reduce((sum, attendee) => {
      const edited = editedAttendees.get(attendee.userId);
      const litter = edited?.litterCollected ?? attendee.litterCollected ?? 0;
      return sum + litter;
    }, 0);
  };

  const getAttendedCount = () => {
    return attendees.filter(attendee => {
      const edited = editedAttendees.get(attendee.userId);
      return edited?.attended ?? attendee.attended;
    }).length;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchAttendees}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (attendees.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <p className="text-gray-500">No registered attendees for this event</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col max-h-[80vh]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-900">Manage Attendees</h3>
        <p className="text-sm text-gray-500 mt-1">
          Mark who attended and track individual contributions
        </p>
      </div>

      {/* Summary Stats */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex-shrink-0">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500">Registered</p>
            <p className="text-2xl font-bold text-gray-900">{attendees.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Attended</p>
            <p className="text-2xl font-bold text-green-600">{getAttendedCount()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Litter (kg)</p>
            <p className="text-2xl font-bold text-blue-600">{getTotalLitter().toFixed(1)}</p>
          </div>
        </div>
      </div>

      {/* Attendee List */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Attendee
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Attended
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Litter (kg)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Note
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {attendees.map((attendee) => (
              <tr key={attendee.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {attendee.user.avatarUrl ? (
                      <img
                        src={attendee.user.avatarUrl}
                        alt={attendee.user.username}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {attendee.user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {attendee.user.firstName && attendee.user.lastName
                          ? `${attendee.user.firstName} ${attendee.user.lastName}`
                          : attendee.user.username}
                      </p>
                      <p className="text-xs text-gray-500">@{attendee.user.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <input
                    type="checkbox"
                    checked={getAttendeeValue(attendee, 'attended') as boolean}
                    onChange={(e) => handleAttendeeChange(attendee.userId, 'attended', e.target.checked)}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={getAttendeeValue(attendee, 'litterCollected') as number || ''}
                    onChange={(e) => handleAttendeeChange(attendee.userId, 'litterCollected', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="0.0"
                    className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    type="text"
                    value={getAttendeeValue(attendee, 'contributionNote') as string || ''}
                    onChange={(e) => handleAttendeeChange(attendee.userId, 'contributionNote', e.target.value)}
                    placeholder="Optional note..."
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3 flex-shrink-0">
        <button
          onClick={handleSave}
          disabled={isLoading || editedAttendees.size === 0}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isLoading ? 'Saving...' : `Save Changes${editedAttendees.size > 0 ? ` (${editedAttendees.size})` : ''}`}
        </button>
        <button
          onClick={onClose}
          disabled={isLoading}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
