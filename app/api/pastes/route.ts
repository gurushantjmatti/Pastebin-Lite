import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { kvClient, Paste } from '@/lib/kv';

// Simple in-memory fallback for local development/testing when Vercel KV isn't available.
const inMemoryStore = new Map<string, string>();
const useInMemory = process.env.USE_IN_MEMORY_KV === '1';

export async function POST(request: NextRequest) {
  // Parse JSON body and return helpful error if parsing fails
  let body: any;
  try {
    body = await request.json();
  } catch (err: any) {
    return NextResponse.json({ error: 'Invalid JSON body', details: err?.message }, { status: 400 });
  }

  // Validate content
  if (!body.content || typeof body.content !== 'string' || body.content.trim() === '') {
    return NextResponse.json(
      { error: 'content is required and must be a non-empty string' },
      { status: 400 }
    );
  }

  // Validate ttl_seconds
  if (body.ttl_seconds !== undefined) {
    if (!Number.isInteger(body.ttl_seconds) || body.ttl_seconds < 1) {
      return NextResponse.json(
        { error: 'ttl_seconds must be an integer >= 1' },
        { status: 400 }
      );
    }
  }

  // Validate max_views
  if (body.max_views !== undefined) {
    if (!Number.isInteger(body.max_views) || body.max_views < 1) {
      return NextResponse.json(
        { error: 'max_views must be an integer >= 1' },
        { status: 400 }
      );
    }
  }

  // Generate unique ID
  const id = nanoid(10);

  // Create paste object
  const paste: Paste = {
    content: body.content,
    created_at: Date.now(),
    view_count: 0,
  };

  if (body.ttl_seconds !== undefined) {
    paste.ttl_seconds = body.ttl_seconds;
  }

  if (body.max_views !== undefined) {
    paste.max_views = body.max_views;
  }

  // Store in KV (or in-memory fallback for local dev)
  try {
    if (useInMemory) {
      inMemoryStore.set(`paste:${id}`, JSON.stringify(paste));
    } else {
      if (paste.ttl_seconds) {
        await kvClient.set(`paste:${id}`, JSON.stringify(paste), {
          ex: paste.ttl_seconds,
        });
      } else {
        await kvClient.set(`paste:${id}`, JSON.stringify(paste));
      }
    }
  } catch (err: any) {
    // Return a 500 with the error message in development, otherwise generic message
    const isDev = process.env.NODE_ENV !== 'production';
    return NextResponse.json(
      { error: isDev ? `Failed to store paste: ${err?.message}` : 'Failed to store paste' },
      { status: 500 }
    );
  }

  // Get the base URL
  const baseUrl = request.headers.get('host') || 'localhost:3000';
  const protocol = baseUrl.includes('localhost') ? 'http' : 'https';
  const url = `${protocol}://${baseUrl}/p/${id}`;

  return NextResponse.json({ id, url }, { status: 201 });
}