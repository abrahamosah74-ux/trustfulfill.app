import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // TODO: Fetch trust metric from Firebase
    const mockMetric = {
      currentTrustStreakHours: 12.5,
      lastInterventionAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      lastInterventionReason: 'Initial setup',
      totalInterventions: 1,
    };

    return NextResponse.json(mockMetric);
  } catch (error) {
    console.error('Error fetching trust metric:', error);
    return NextResponse.json({ error: 'Failed to fetch metric' }, { status: 500 });
  }
}
