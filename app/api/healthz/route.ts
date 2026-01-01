import { NextResponse } from 'next/server';
import { kvClient } from '@/lib/kv';

export async function GET() {
  try {
    // Test KV connection by doing a simple ping
    await kvClient.set('healthcheck', 'ok', { ex: 10 });
    await kvClient.get('healthcheck');
    
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}