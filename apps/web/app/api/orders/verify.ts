import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId } = body;

    // TODO: Mark order as verified manually

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error verifying order:', error);
    return NextResponse.json({ error: 'Failed to verify' }, { status: 500 });
  }
}
