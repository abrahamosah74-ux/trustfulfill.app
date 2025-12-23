import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId } = body;

    // TODO: Retry fulfillment

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error retrying fulfillment:', error);
    return NextResponse.json({ error: 'Failed to retry' }, { status: 500 });
  }
}
