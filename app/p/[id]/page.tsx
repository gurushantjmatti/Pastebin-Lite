import { notFound } from 'next/navigation';
import { kvClient, Paste } from '@/lib/kv';
import { getCurrentTime } from '@/lib/time';

async function getPaste(id: string) {
  const currentTime = getCurrentTime();
  
  try {
    const pasteData = await kvClient.get(`paste:${id}`);
    
    if (!pasteData) {
      return null;
    }
    
    const paste: Paste = typeof pasteData === 'string' 
      ? JSON.parse(pasteData) 
      : pasteData as Paste;
    
    // Check TTL expiry
    if (paste.ttl_seconds) {
      const expiryTime = paste.created_at + (paste.ttl_seconds * 1000);
      if (currentTime >= expiryTime) {
        await kvClient.del(`paste:${id}`);
        return null;
      }
    }
    
    // Check view limit
    if (paste.max_views !== undefined && paste.view_count >= paste.max_views) {
      await kvClient.del(`paste:${id}`);
      return null;
    }
    
    // Increment view count
    paste.view_count += 1;
    
    // Update paste
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
    
    return paste;
  } catch (error) {
    return null;
  }
}

export default async function PastePage({ params }: { params: { id: string } }) {
  const paste = await getPaste(params.id);
  
  if (!paste) {
    notFound();
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-4 text-gray-800">Paste Content</h1>
          
          <div className="bg-gray-100 rounded p-4 mb-4">
            <pre className="whitespace-pre-wrap text-sm text-gray-800">
              {paste.content}
            </pre>
          </div>
          
          <div className="text-sm text-gray-600">
            {paste.max_views && (
              <p>Remaining views: {Math.max(0, paste.max_views - paste.view_count)}</p>
            )}
            {paste.ttl_seconds && (
              <p>Expires at: {new Date(paste.created_at + paste.ttl_seconds * 1000).toLocaleString()}</p>
            )}
          </div>
          
          <div className="mt-4">
            <a href="/" className="text-blue-600 hover:text-blue-800 underline">
              Create a new paste
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}