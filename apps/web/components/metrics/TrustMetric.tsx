'use client';

import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { fetchTrustMetric } from '@/lib/api/metrics';

export function TrustMetric() {
  const { data: metric } = useQuery({
    queryKey: ['trust-metric'],
    queryFn: fetchTrustMetric,
    refetchInterval: 60000, // Every minute
  });

  if (!metric) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl p-6 mb-8 animate-pulse">
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const hours = metric.currentTrustStreakHours || 0;
  const displayHours = formatHours(hours);

  return (
    <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl p-6 mb-8">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">
            System Autonomy
          </h2>
          <p className="text-gray-600 mt-1">
            Time since the system required your intervention
          </p>
          
          {/* Last intervention reason */}
          {metric.lastInterventionReason && (
            <div className="mt-3 p-3 bg-white rounded-lg border">
              <p className="text-sm font-medium text-gray-700">
                Last intervention:
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {metric.lastInterventionReason}
              </p>
              {metric.lastInterventionAt && (
                <p className="text-xs text-gray-500 mt-1">
                  {formatDistanceToNow(new Date(metric.lastInterventionAt), { addSuffix: true })}
                </p>
              )}
            </div>
          )}
        </div>
        
        {/* Big number display */}
        <div className="text-right ml-6">
          <div className="text-5xl font-bold text-green-600">
            {displayHours}
          </div>
          <p className="text-gray-600 mt-2 text-sm">
            hours of autonomous<br />operation
          </p>
        </div>
      </div>
      
      {/* Progress bar (visual indicator) */}
      <div className="mt-6">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Today</span>
          <span>Goal: 24h</span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-1000"
            style={{ width: `${Math.min((hours / 24) * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function formatHours(hours: number): string {
  if (hours < 1) {
    return '< 1';
  }
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = Math.floor(hours % 24);
    return `${days}d ${remainingHours}h`;
  }
  return Math.floor(hours).toString();
}
