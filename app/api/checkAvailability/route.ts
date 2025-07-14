import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  return NextResponse.json({ status: 'POST working' });
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ status: 'GET working' });
}
