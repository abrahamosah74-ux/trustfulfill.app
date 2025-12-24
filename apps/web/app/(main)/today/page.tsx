'use client';

import { useQuery } from '@tanstack/react-query';
import { TodayView } from '@/components/orders/TodayView';
import { TrustMetric } from '@/components/metrics/TrustMetric';
import { fetchOrders } from '@/lib/api/orders';

export default function TodayPage() {
  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      try {
        console.log('[fetchOrders] Starting fetch...');
        const response = await fetch('/api/orders', {
          cache: 'no-store',
          method: 'GET',
        });
        
        console.log('[fetchOrders] Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('[fetchOrders] Got data:', data);
        return data;
      } catch (err) {
        console.error('[fetchOrders] Error:', err);
        throw err;
      }
    },
    refetchInterval: 30000,
  });

  console.log('[TodayPage] State:', { isLoading, error: error?.message, ordersCount: orders?.length });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Loading orders...</h2>
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error loading orders</h2>
          <p className="text-gray-700 mb-4 font-mono text-sm">{(error as Error).message}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <TodayView orders={orders || []} />
  );
}
