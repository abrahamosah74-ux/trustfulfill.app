'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    console.log('[TrustFulfill] Root page loaded, redirecting to /today');
    router.push('/today');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">Loading TrustFulfill...</h1>
        <p className="text-gray-600 mb-6">Initializing order tracking system</p>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
      </div>
    </div>
  );
}
