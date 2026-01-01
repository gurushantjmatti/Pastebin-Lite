import { NextRequest, NextResponse } from 'next/server';
import { kvClient, Paste, PasteResponse } from '@/lib/kv';
import { getCurrentTime } from '@/lib/time';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const currentTime = getCurrentTime();
    
    // Fetch paste from KV
    const pasteData = await kvClient.get(`paste:${id}`);
    
    if (!pasteData) {
      return NextResponse.json(
        { error: 'Paste not found' },
        { status: 404 }
      );
    }
    
    const paste: Paste = typeof pasteData === 'string' 
      ? JSON.parse(pasteData) 
      : pasteData as Paste;
    
    // Check TTL expiry
    if (paste.ttl_seconds) {
      const expiryTime = paste.created_at + (paste.ttl_seconds * 1000);
      if (currentTime >= expiryTime) {
        // Delete expired paste
        await kvClient.del(`paste:${id}`);
        return NextResponse.json(
          { error: 'Paste has expired' },
          { status: 404 }
        );
      }
    }
    
    // Check view limit
    if (paste.max_views !== undefined) {
      if (paste.view_count >= paste.max_views) {
        // Delete paste that exceeded view limit
        await kvClient.del(`paste:${id}`);
        return NextResponse.json(
          { error: 'Paste view limit exceeded' },
          { status: 404 }
        );
      }
    }
    
    // Increment view count
    paste.view_count += 1;
    
    // Update paste in KV
    if (paste.ttl_seconds) {
      const remainingTtl = Math.max(
        1,
        Math.ceil((paste.created_at + paste.ttl_seconds * 1000 - currentTime) / 1000)
      );
      await kvClient.set(`paste:${id}`, JSON.stringify(paste), {
        ex: remainingTtl,
      });
    } else {
      await kvClient.set(`paste:${id}`, JSON.stringify(paste));
    }
    
    // Prepare response
    const response: PasteResponse = {
      content: paste.content,
      remaining_views: paste.max_views !== undefined 
        ? Math.max(0, paste.max_views - paste.view_count)
        : null,
      expires_at: paste.ttl_seconds
        ? new Date(paste.created_at + paste.ttl_seconds * 1000).toISOString()
        : null,
    };
    
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Paste not found' },
      { status: 404 }
    );
  }
}