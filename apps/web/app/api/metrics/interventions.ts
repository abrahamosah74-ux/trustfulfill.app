import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // TODO: Fetch interventions from Firebase
    const mockInterventions = [];

    return NextResponse.json(mockInterventions);
  } catch (error) {
    console.error('Error fetching interventions:', error);
    return NextResponse.json({ error: 'Failed to fetch interventions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // TODO: Log intervention to Firebase

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging intervention:', error);
    return NextResponse.json({ error: 'Failed to log intervention' }, { status: 500 });
  }
}
