import { Redis } from '@upstash/redis';

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

// Initialize Upstash Redis client
export const kvClient = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});