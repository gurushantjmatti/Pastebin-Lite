import { kv } from '@vercel/kv';

export interface Paste {
  content: string;
  ttl_seconds?: number;
  max_views?: number;
  created_at: number;
  view_count: number;
}

export interface PasteResponse {
  content: string;
  remaining_views: number | null;
  expires_at: string | null;
}

export const kvClient = kv;