// Shared cache module for webhook requests
import type { WebhookRequest } from '@/types/webhook';

// Global cache instance
class WebhookCache {
  private cache = new Map<string, WebhookRequest[]>();
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes
  private readonly MAX_REQUESTS_PER_WEBHOOK = 100;

  // Clean up expired requests
  private cleanupExpiredRequests() {
    const now = Date.now();
    for (const [webhookId, requests] of this.cache.entries()) {
      const validRequests = requests.filter(req => 
        now - new Date(req.timestamp).getTime() < this.CACHE_TTL
      );
      
      if (validRequests.length === 0) {
        this.cache.delete(webhookId);
      } else if (validRequests.length !== requests.length) {
        this.cache.set(webhookId, validRequests);
      }
    }
  }

  // Add a request to the cache
  addRequest(webhookId: string, request: WebhookRequest) {
    const existingRequests = this.cache.get(webhookId) || [];
    existingRequests.unshift(request); // Add to beginning
    
    // Limit number of requests per webhook
    if (existingRequests.length > this.MAX_REQUESTS_PER_WEBHOOK) {
      existingRequests.splice(this.MAX_REQUESTS_PER_WEBHOOK);
    }
    
    this.cache.set(webhookId, existingRequests);
    
    // Clean up expired requests periodically (1 in 10 chance)
    if (Math.random() < 0.1) {
      this.cleanupExpiredRequests();
    }
  }

  // Get requests for a specific webhook
  getRequests(webhookId: string): WebhookRequest[] {
    this.cleanupExpiredRequests();
    return this.cache.get(webhookId) || [];
  }

  // Get all cache statistics
  getAllStats() {
    this.cleanupExpiredRequests();
    
    const stats = {
      totalWebhooks: this.cache.size,
      totalRequests: 0,
      webhookDistribution: [] as Array<{
        webhookId: string;
        requestCount: number;
        percentage: number;
        lastActivity: string;
      }>,
    };

    // Process each webhook in the cache
    for (const [webhookId, requests] of this.cache.entries()) {
      const requestCount = requests.length;
      stats.totalRequests += requestCount;
      
      // Find the most recent request for last activity
      const lastActivity = requests.length > 0 ? 
        requests[0].timestamp.toISOString() : // requests are sorted newest first
        new Date().toISOString();
      
      stats.webhookDistribution.push({
        webhookId: webhookId.length > 8 ? `${webhookId.substring(0, 8)}...` : webhookId,
        requestCount,
        percentage: 0, // Will calculate after getting total
        lastActivity,
      });
    }
    
    // Calculate percentages
    stats.webhookDistribution.forEach(item => {
      item.percentage = stats.totalRequests > 0 ? 
        Math.round((item.requestCount / stats.totalRequests) * 100 * 10) / 10 : 0;
    });
    
    // Sort by request count (descending)
    stats.webhookDistribution.sort((a, b) => b.requestCount - a.requestCount);

    return stats;
  }

  // Get cache size for debugging
  getSize() {
    return this.cache.size;
  }
}

// Export singleton instance with global fallback for development
declare global {
  // eslint-disable-next-line no-var
  var __webhookCache: WebhookCache | undefined;
}

export const webhookCache = globalThis.__webhookCache ?? new WebhookCache();

if (process.env.NODE_ENV === 'development') {
  globalThis.__webhookCache = webhookCache;
} 