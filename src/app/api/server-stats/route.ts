// Server statistics API route - provides global cache distribution data

import { NextRequest, NextResponse } from 'next/server';
import { webhookCache } from '@/lib/cache';

// Calculate global cache statistics
function getGlobalCacheStats() {
  const cacheStats = webhookCache.getAllStats();
  
  const stats = {
    totalWebhooks: cacheStats.totalWebhooks,
    totalRequests: cacheStats.totalRequests,
    webhookDistribution: cacheStats.webhookDistribution.slice(0, 10), // Top 10
    serverStatus: {
      uptime: process.uptime ? Math.floor(process.uptime()) : 0,
      memoryUsage: process.memoryUsage ? process.memoryUsage() : null,
      nodeVersion: process.version || 'unknown',
      cacheSize: cacheStats.totalWebhooks,
    },
  };
  
  return stats;
}

export async function GET(request: NextRequest) {
  try {
    const stats = getGlobalCacheStats();
    
    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        data: {
          globalStats: {
            totalWebhooks: stats.totalWebhooks,
            totalRequests: stats.totalRequests,
            serverUptime: `${stats.serverStatus.uptime}s`,
            nodeVersion: stats.serverStatus.nodeVersion,
            memoryUsage: stats.serverStatus.memoryUsage ? {
              rss: Math.round(stats.serverStatus.memoryUsage.rss / 1024 / 1024),
              heapUsed: Math.round(stats.serverStatus.memoryUsage.heapUsed / 1024 / 1024),
              heapTotal: Math.round(stats.serverStatus.memoryUsage.heapTotal / 1024 / 1024),
            } : null,
          },
          distribution: stats.webhookDistribution,
        },
      },
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    );

  } catch (error) {
    console.error('Error getting server stats:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve server statistics',
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

export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 