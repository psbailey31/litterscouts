import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { QuantityAggregation } from '@/types';

interface QuantityChartProps {
  data: QuantityAggregation[];
  loading?: boolean;
}

const QUANTITY_COLORS: Record<string, string> = {
  minimal: '#10b981',     // green
  moderate: '#f59e0b',    // amber
  significant: '#f97316', // orange
  severe: '#ef4444',      // red
};

const QUANTITY_LABELS: Record<string, string> = {
  minimal: 'Minimal',
  moderate: 'Moderate',
  significant: 'Significant',
  severe: 'Severe',
};

export function QuantityChart({ data, loading }: QuantityChartProps) {
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quantity Estimation</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No data available for the selected period
        </div>
      </div>
    );
  }

  // Calculate total for percentages
  const total = data.reduce((sum, item) => sum + item.count, 0);

  // Format data for the chart
  const chartData = data.map(item => ({
    name: QUANTITY_LABELS[item.level] || item.level,
    count: item.count,
    percentage: total > 0 ? (item.count / total) * 100 : 0,
    quantity: item.level,
  }));

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Litter Quantity Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="name" 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <Tooltip 
            formatter={(value: number, name: string, props: { payload: { percentage: number } }) => [
              `${value} reports (${props.payload.percentage.toFixed(1)}%)`,
              'Count'
            ]}
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              padding: '0.75rem'
            }}
          />
          <Bar dataKey="count" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={QUANTITY_COLORS[entry.quantity] || '#8b5cf6'} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
