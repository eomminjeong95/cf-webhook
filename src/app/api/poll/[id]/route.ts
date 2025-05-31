// Polling API to get webhook requests from memory cache

import { NextRequest, NextResponse } from 'next/server';
import { getCachedRequests } from '@/app/api/webhook/[id]/route';

// Rate limiting: minimum 1 second interval per webhook
const lastPollTime = new Map<string, number>();
const MIN_POLL_INTERVAL = 1000; // 1 second in milliseconds

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: webhookId } = await context.params;
  
  // Validate webhook ID format
  if (!/^[a-zA-Z0-9]{6,12}$/.test(webhookId)) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Invalid webhook ID format',
        requests: []
      },
      { status: 400 }
    );
  }

  // Rate limiting check
  const now = Date.now();
  const lastPoll = lastPollTime.get(webhookId) || 0;
  const timeSinceLastPoll = now - lastPoll;

  if (timeSinceLastPoll < MIN_POLL_INTERVAL) {
    // Return cached result with rate limit info
    const requests = getCachedRequests(webhookId);
    
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-RateLimit-Limit': '1',
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': String(Math.ceil((MIN_POLL_INTERVAL - timeSinceLastPoll) / 1000)),
    };

    return NextResponse.json(
      {
        success: true,
        webhookId,
        count: requests.length,
        requests,
        timestamp: new Date().toISOString(),
        rateLimited: true,
        retryAfter: Math.ceil((MIN_POLL_INTERVAL - timeSinceLastPoll) / 1000),
      },
      { 
        status: 200, // Return 200 but with cached data
        headers 
      }
    );
  }

  // Update last poll time
  lastPollTime.set(webhookId, now);

  try {
    // Get cached requests
    const requests = getCachedRequests(webhookId);
    
    // Add CORS headers for cross-origin requests
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-RateLimit-Limit': '1',
      'X-RateLimit-Remaining': String(Math.floor((MIN_POLL_INTERVAL - (Date.now() - now)) / MIN_POLL_INTERVAL)),
      'X-RateLimit-Reset': String(Math.ceil(MIN_POLL_INTERVAL / 1000)),
    };

    return NextResponse.json(
      {
        success: true,
        webhookId,
        count: requests.length,
        requests,
        timestamp: new Date().toISOString(),
        rateLimited: false,
      },
      { 
        status: 200,
        headers 
      }
    );

  } catch (error) {
    console.error('Error fetching webhook requests:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch webhook requests',
        webhookId,
        requests: [],
        timestamp: new Date().toISOString(),
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
} 