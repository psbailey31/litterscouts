import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { LitterTypeDistribution } from '@/types';

interface LitterTypeChartProps {
  data: LitterTypeDistribution[];
  loading?: boolean;
}

const COLORS: Record<string, string> = {
  plastic: '#3b82f6',  // blue
  metal: '#6b7280',    // gray
  glass: '#10b981',    // green
  organic: '#84cc16',  // lime
  hazardous: '#ef4444', // red
  other: '#8b5cf6',    // purple
};

const LITTER_TYPE_LABELS: Record<string, string> = {
  plastic: 'Plastic',
  metal: 'Metal',
  glass: 'Glass',
  organic: 'Organic',
  hazardous: 'Hazardous',
  other: 'Other',
};

export function LitterTypeChart({ data, loading }: LitterTypeChartProps) {
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Litter Type Distribution</h3>
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
    name: LITTER_TYPE_LABELS[item.type] || item.type,
    value: item.count,
    percentage: total > 0 ? (item.count / total) * 100 : 0,
  }));

  const renderCustomLabel = (entry: { name: string; percentage: number }) => {
    return `${entry.name}: ${entry.percentage.toFixed(1)}%`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Litter Type Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => {
              const litterType = data[index].type;
              return (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[litterType] || '#8b5cf6'} 
                />
              );
            })}
          </Pie>
          <Tooltip 
            formatter={(value: number, name: string, props: { payload: { percentage: number } }) => [
              `${value} reports (${props.payload.percentage.toFixed(1)}%)`,
              name
            ]}
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              padding: '0.75rem'
            }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            wrapperStyle={{ paddingTop: '1rem' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
