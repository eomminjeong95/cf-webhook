// Storage provider abstraction for CF-Webhook
// Supports different storage backends like R2, KV, D1, etc.

import type { WebhookRequest, WebhookConfig } from './webhook';

// Base storage provider interface
export interface StorageProvider {
  // Provider identification (for debugging)
  getProviderInfo(): ProviderInfo;
  
  // Request operations
  saveRequest(webhookId: string, request: WebhookRequest): Promise<void>;
  getRequests(webhookId: string, limit?: number, offset?: number): Promise<WebhookRequest[]>;
  deleteRequest(webhookId: string, requestId: string): Promise<boolean>;
  clearRequests(webhookId: string): Promise<void>;
  
  // Webhook configuration operations
  saveWebhookConfig(config: WebhookConfig): Promise<void>;
  getWebhookConfig(webhookId: string): Promise<WebhookConfig | null>;
  getAllWebhookConfigs(): Promise<WebhookConfig[]>;
  deleteWebhookConfig(webhookId: string): Promise<boolean>;
  
  // Cleanup operations
  cleanupExpiredRequests(retentionHours: number): Promise<number>;
  
  // Health check
  isHealthy(): Promise<boolean>;
  
  // Statistics
  getStats(): Promise<StorageStats> | StorageStats;
}

// Provider identification information for debugging
export interface ProviderInfo {
  type: 'r2' | 'kv' | 'd1' | 'memory';
  name: string;
  instance: string; // unique instance identifier
  details?: ProviderDetails; // provider-specific details
}

// Provider-specific details for monitoring and debugging
export interface ProviderDetails {
  // Common fields
  retentionHours?: number;
  maxRequestsPerWebhook?: number;
  
  // Performance metrics
  totalOperations?: number;
  uptime?: number;
  
  // Provider-specific fields
  [key: string]: any;
  
  // D1 specific
  databaseBinding?: string;
  tablePrefix?: string;
  initialized?: boolean;
  
  // R2 specific
  bucketBinding?: string;
  pathPrefix?: string;
  
  // Memory specific
  currentWebhooks?: number;
  totalRequests?: number;
  memoryUsage?: {
    webhooks: number;
    requests: number;
    totalKB: number;
  };
}

// Storage configuration
export interface StorageConfig {
  provider: 'r2' | 'kv' | 'd1' | 'memory';
  retentionHours: number;
  maxRequestsPerWebhook: number;
}

// R2 specific configuration
export interface R2StorageConfig extends StorageConfig {
  provider: 'r2';
  bucketBinding: string;
  pathPrefix?: string;
}

// KV specific configuration
export interface KVStorageConfig extends StorageConfig {
  provider: 'kv';
  namespaceBinding: string;
}

// D1 specific configuration
export interface D1StorageConfig extends StorageConfig {
  provider: 'd1';
  databaseBinding: string;
  tablePrefix?: string;
}

// Storage operation metrics
export interface StorageMetrics {
  operationType: 'save' | 'get' | 'delete' | 'clear' | 'health';
  duration: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

// Storage statistics for distribution analysis
export interface StorageStats {
  totalWebhooks: number;
  totalRequests: number;
  webhooksWithRequests: number;
  webhookDistribution: WebhookDistribution[];
  requestMethodDistribution: MethodDistribution[];
  requestSizeDistribution: SizeDistribution[];
  timeDistribution: TimeDistribution[];
  storageUsage: {
    totalSizeBytes: number;
    averageRequestSize: number;
    largestRequestSize: number;
  };
  performance: {
    totalOperations: number;
    uptime: number;
  };
}

// Webhook distribution stats
export interface WebhookDistribution {
  webhookId: string;
  webhookName?: string;
  requestCount: number;
  totalSize: number;
  averageSize: number;
  lastRequestAt?: Date;
  isActive: boolean;
  percentage: number;
}

// HTTP method distribution
export interface MethodDistribution {
  method: string;
  count: number;
  percentage: number;
  totalSize: number;
}

// Request size distribution
export interface SizeDistribution {
  sizeRange: string;
  count: number;
  percentage: number;
  minSize: number;
  maxSize: number;
}

// Time-based distribution
export interface TimeDistribution {
  period: string;
  count: number;
  percentage: number;
  timeRange: string;
}

// Enhanced error class with provider context
export class StorageError extends Error {
  public readonly timestamp: Date;
  public readonly operation?: string;
  
  constructor(
    message: string, 
    public readonly provider: string,
    operation?: string
  ) {
    super(message);
    this.name = 'StorageError';
    this.timestamp = new Date();
    this.operation = operation;
  }
  
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      provider: this.provider,
      operation: this.operation,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack
    };
  }
} 