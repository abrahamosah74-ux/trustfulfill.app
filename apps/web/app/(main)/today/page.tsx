'use client';

import { useQuery } from '@tanstack/react-query';
import { TodayView } from '@/components/orders/TodayView';
import { TrustMetric } from '@/components/metrics/TrustMetric';
import { fetchOrders } from '@/lib/api/orders';

export default function TodayPage() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders,
    refetchInterval: 30000, // Every 30 seconds
  });

  if (isLoading) {
    return <div className="p-8">Loading today's orders...</div>;
  }

  return (
    <TodayView orders={orders || []} />
  );
}
