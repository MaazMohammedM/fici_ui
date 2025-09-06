import React from 'react';
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react';

interface DailyVisit {
  date: string;
  visits: number;
}

interface VisitsTrendChartProps {
  data: DailyVisit[];
  loading?: boolean;
}

const VisitsTrendChart: React.FC<VisitsTrendChartProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Daily Visits Trend</h3>
          <Calendar className="w-5 h-5 text-gray-400" />
        </div>
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const maxVisits = Math.max(...data.map(d => d.visits));
  const totalVisits = data.reduce((sum, d) => sum + d.visits, 0);
  const avgVisits = totalVisits / data.length;
  
  // Calculate trend
  const recentAvg = data.slice(-7).reduce((sum, d) => sum + d.visits, 0) / 7;
  const previousAvg = data.slice(-14, -7).reduce((sum, d) => sum + d.visits, 0) / 7;
  const trendPercentage = ((recentAvg - previousAvg) / previousAvg) * 100;
  const isPositiveTrend = trendPercentage > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Daily Visits Trend</h3>
          <div className="flex items-center space-x-4 mt-2">
            <span className="text-sm text-gray-600">
              Avg: {avgVisits.toFixed(0)} visits/day
            </span>
            <div className={`flex items-center space-x-1 ${isPositiveTrend ? 'text-green-600' : 'text-red-600'}`}>
              {isPositiveTrend ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                {Math.abs(trendPercentage).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
        <Calendar className="w-5 h-5 text-gray-400" />
      </div>
      
      <div className="relative h-64">
        <div className="absolute inset-0 flex items-end justify-between space-x-1">
          {data.map((day) => {
            const height = (day.visits / maxVisits) * 100;
            const date = new Date(day.date);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-full rounded-t transition-all duration-300 hover:opacity-80 ${
                    isWeekend ? 'bg-blue-400' : 'bg-blue-600'
                  }`}
                  style={{ height: `${height}%` }}
                  title={`${day.date}: ${day.visits} visits`}
                ></div>
                <div className="mt-2 text-xs text-gray-500 transform -rotate-45 origin-top-left">
                  {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="mt-8 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-gray-900">{totalVisits.toLocaleString()}</p>
          <p className="text-sm text-gray-600">Total Visits</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{Math.max(...data.map(d => d.visits))}</p>
          <p className="text-sm text-gray-600">Peak Day</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{avgVisits.toFixed(0)}</p>
          <p className="text-sm text-gray-600">Daily Average</p>
        </div>
      </div>
      
      {data.length === 0 && (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No visits data available</p>
        </div>
      )}
    </div>
  );
};

export default VisitsTrendChart;
