import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { TimeSeriesDataPoint } from '@/types';

interface TimeSeriesChartProps {
  data: TimeSeriesDataPoint[];
  loading?: boolean;
}

export function TimeSeriesChart({ data, loading }: TimeSeriesChartProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Trends</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No data available for the selected period
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Trends Over Time</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              padding: '0.75rem'
            }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '1rem' }}
          />
          <Line 
            type="monotone" 
            dataKey="reportCount" 
            stroke="#3b82f6" 
            strokeWidth={2}
            name="Reports"
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
          />
          {data.some(d => d.eventCount !== undefined) && (
            <Line 
              type="monotone" 
              dataKey="eventCount" 
              stroke="#10b981" 
              strokeWidth={2}
              name="Events"
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
            />
          )}
          {data.some(d => d.litterCollected > 0) && (
            <Line 
              type="monotone" 
              dataKey="litterCollected" 
              stroke="#f59e0b" 
              strokeWidth={2}
              name="Litter Collected (kg)"
              dot={{ fill: '#f59e0b', r: 4 }}
              activeDot={{ r: 6 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
