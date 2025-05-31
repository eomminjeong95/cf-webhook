// Local storage operations for webhook data

import type { 
  WebhookConfig, 
  WebhookRequest, 
  StorageData, 
  AppSettings, 
  ExportData 
} from '@/types/webhook';
import { DEFAULT_SETTINGS } from '@/types/webhook';
import { config } from './config';
import { safeJsonParse, safeJsonStringify, generateId } from './utils';

// Storage keys
const STORAGE_KEYS = {
  WEBHOOKS: `${config.localStoragePrefix}:webhooks`,
  REQUESTS: `${config.localStoragePrefix}:requests`,
  SETTINGS: `${config.localStoragePrefix}:settings`,
  VERSION: `${config.localStoragePrefix}:version`,
} as const;

// Current storage version for migration purposes
const STORAGE_VERSION = '1.0.0';

// Storage interface
export interface WebhookStorage {
  // Webhook operations
  getWebhooks(): WebhookConfig[];
  saveWebhook(webhook: WebhookConfig): void;
  updateWebhook(id: string, updates: Partial<WebhookConfig>): boolean;
  deleteWebhook(id: string): boolean;
  getWebhook(id: string): WebhookConfig | null;
  
  // Request operations
  getRequests(webhookId: string): WebhookRequest[];
  saveRequest(request: WebhookRequest): void;
  deleteRequest(webhookId: string, requestId: string): boolean;
  clearRequests(webhookId: string): void;
  
  // Settings operations
  getSettings(): AppSettings;
  saveSettings(settings: AppSettings): void;
  resetSettings(): void;
  
  // Utility operations
  exportData(): ExportData;
  importData(data: ExportData): boolean;
  clearAllData(): void;
  getStorageSize(): number;
  cleanupExpiredData(): void;
}

// Check if localStorage is available
function isLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Get item from localStorage with fallback
 */
function getStorageItem<T>(key: string, fallback: T): T {
  if (!isLocalStorageAvailable()) {
    console.warn(`localStorage is not available, data will not be persisted`);
    return fallback;
  }
  
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error);
    return fallback;
  }
}

/**
 * Set item in localStorage with error handling
 */
function setStorageItem<T>(key: string, value: T): boolean {
  if (!isLocalStorageAvailable()) {
    console.warn(`localStorage is not available, data will not be persisted`);
    return false;
  }
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error writing to localStorage key "${key}":`, error);
    return false;
  }
}

/**
 * Remove item from localStorage
 */
function removeStorageItem(key: string): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }
  
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
    return false;
  }
}

// Create storage implementation
class LocalWebhookStorage implements WebhookStorage {
  private isStorageAvailable: boolean = false;

  constructor() {
    this.initializeStorage();
  }
  
  /**
   * Initialize storage system
   */
  private initializeStorage(): void {
    console.log('Initializing storage system...');
    
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      console.warn('localStorage is not available, using fallback data');
      this.isStorageAvailable = false;
      return;
    }

    this.isStorageAvailable = true;
    console.log('localStorage is available');
    
    // Migrate storage if needed
    this.migrateStorage();
    
    // Debug: Check existing data before initialization
    console.log('Existing webhooks:', localStorage.getItem(STORAGE_KEYS.WEBHOOKS));
    console.log('Existing requests:', localStorage.getItem(STORAGE_KEYS.REQUESTS));
    console.log('Existing settings:', localStorage.getItem(STORAGE_KEYS.SETTINGS));
    
    // Initialize with defaults if empty
    if (!localStorage.getItem(STORAGE_KEYS.WEBHOOKS)) {
      console.log('Initializing empty webhooks array');
      setStorageItem(STORAGE_KEYS.WEBHOOKS, []);
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.REQUESTS)) {
      console.log('Initializing empty requests object');
      setStorageItem(STORAGE_KEYS.REQUESTS, {});
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      console.log('Initializing default settings');
      setStorageItem(STORAGE_KEYS.SETTINGS, this.getDefaultSettings());
    }
    
    // Clean up expired data
    this.cleanup();
    
    console.log('Storage initialization completed');
  }
  
  // Handle storage migrations between versions
  private migrateStorage(): void {
    console.log(`Migrating storage from version ${STORAGE_VERSION}`);
    
    // Add migration logic here when needed
    // For now, we'll just clear old data if major version changes
    const fromMajor = parseInt(STORAGE_VERSION.split('.')[0], 10);
    const currentMajor = parseInt(STORAGE_VERSION.split('.')[0], 10);
    
    if (fromMajor < currentMajor) {
      console.log('Major version change detected, clearing old data');
      this.clearAllData();
    }
  }
  
  // Webhook operations
  getWebhooks(): WebhookConfig[] {
    return getStorageItem(STORAGE_KEYS.WEBHOOKS, []);
  }
  
  saveWebhook(webhook: WebhookConfig): void {
    const webhooks = this.getWebhooks();
    const existingIndex = webhooks.findIndex(w => w.id === webhook.id);
    
    if (existingIndex >= 0) {
      webhooks[existingIndex] = webhook;
    } else {
      webhooks.push(webhook);
    }
    
    setStorageItem(STORAGE_KEYS.WEBHOOKS, webhooks);
  }
  
  updateWebhook(id: string, updates: Partial<WebhookConfig>): boolean {
    const webhooks = this.getWebhooks();
    const index = webhooks.findIndex(w => w.id === id);
    
    if (index >= 0) {
      webhooks[index] = { ...webhooks[index], ...updates };
      setStorageItem(STORAGE_KEYS.WEBHOOKS, webhooks);
      return true;
    }
    
    return false;
  }
  
  deleteWebhook(id: string): boolean {
    const webhooks = this.getWebhooks();
    const filteredWebhooks = webhooks.filter(w => w.id !== id);
    
    if (filteredWebhooks.length !== webhooks.length) {
      setStorageItem(STORAGE_KEYS.WEBHOOKS, filteredWebhooks);
      // Also clean up associated requests
      this.clearRequests(id);
      return true;
    }
    
    return false;
  }
  
  getWebhook(id: string): WebhookConfig | null {
    const webhooks = this.getWebhooks();
    return webhooks.find(w => w.id === id) || null;
  }
  
  // Request operations
  getRequests(webhookId: string): WebhookRequest[] {
    const allRequests = getStorageItem<Record<string, WebhookRequest[]>>(STORAGE_KEYS.REQUESTS, {});
    return allRequests[webhookId] || [];
  }
  
  saveRequest(request: WebhookRequest): void {
    const allRequests = getStorageItem<Record<string, WebhookRequest[]>>(STORAGE_KEYS.REQUESTS, {});
    const webhookRequests = allRequests[request.webhookId] || [];
    
    // Add new request to the beginning
    webhookRequests.unshift(request);
    
    // Limit the number of requests per webhook
    const maxRequests = config.maxRequestsPerWebhook;
    if (webhookRequests.length > maxRequests) {
      webhookRequests.splice(maxRequests);
    }
    
    allRequests[request.webhookId] = webhookRequests;
    setStorageItem(STORAGE_KEYS.REQUESTS, allRequests);
    
    console.log(`Saved request for webhook ${request.webhookId}, total requests: ${webhookRequests.length}`);
    
    // Update webhook's last request time and count
    this.updateWebhook(request.webhookId, {
      lastRequestAt: request.timestamp,
      requestCount: webhookRequests.length,
    });
  }
  
  deleteRequest(webhookId: string, requestId: string): boolean {
    const allRequests = getStorageItem<Record<string, WebhookRequest[]>>(STORAGE_KEYS.REQUESTS, {});
    const webhookRequests = allRequests[webhookId] || [];
    
    const filteredRequests = webhookRequests.filter((r: WebhookRequest) => r.id !== requestId);
    
    if (filteredRequests.length !== webhookRequests.length) {
      allRequests[webhookId] = filteredRequests;
      setStorageItem(STORAGE_KEYS.REQUESTS, allRequests);
      
      // Update webhook request count
      this.updateWebhook(webhookId, {
        requestCount: filteredRequests.length,
      });
      
      return true;
    }
    
    return false;
  }
  
  clearRequests(webhookId: string): void {
    const allRequests = getStorageItem<Record<string, WebhookRequest[]>>(STORAGE_KEYS.REQUESTS, {});
    delete allRequests[webhookId];
    setStorageItem(STORAGE_KEYS.REQUESTS, allRequests);
    
    // Update webhook request count
    this.updateWebhook(webhookId, {
      requestCount: 0,
    });
  }
  
  // Settings operations
  getSettings(): AppSettings {
    return getStorageItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }
  
  saveSettings(settings: AppSettings): void {
    setStorageItem(STORAGE_KEYS.SETTINGS, settings);
  }
  
  resetSettings(): void {
    setStorageItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }
  
  // Utility operations
  exportData(): ExportData {
    const webhooks = this.getWebhooks();
    const requests = getStorageItem<Record<string, WebhookRequest[]>>(STORAGE_KEYS.REQUESTS, {});
    
    console.log('Exporting data - Webhooks:', webhooks.length, 'Requests:', Object.keys(requests).length);
    
    return {
      version: STORAGE_VERSION,
      exportedAt: new Date(),
      webhooks,
      requests,
    };
  }
  
  importData(data: ExportData): boolean {
    try {
      // Validate import data structure
      if (!data.webhooks || !Array.isArray(data.webhooks)) {
        throw new Error('Invalid webhook data format');
      }
      
      if (!data.requests || typeof data.requests !== 'object') {
        throw new Error('Invalid request data format');
      }
      
      // Import webhooks
      setStorageItem(STORAGE_KEYS.WEBHOOKS, data.webhooks);
      
      // Import requests
      setStorageItem(STORAGE_KEYS.REQUESTS, data.requests);
      
      console.log('Data imported successfully');
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }
  
  clearAllData(): void {
    removeStorageItem(STORAGE_KEYS.WEBHOOKS);
    removeStorageItem(STORAGE_KEYS.REQUESTS);
    removeStorageItem(STORAGE_KEYS.SETTINGS);
    removeStorageItem(STORAGE_KEYS.VERSION);
    
    // Reinitialize with defaults
    this.initializeStorage();
  }
  
  getStorageSize(): number {
    if (!this.isStorageAvailable) return 0;
    
    let totalSize = 0;
    
    try {
      for (const key in localStorage) {
        if (key.startsWith(config.localStoragePrefix)) {
          totalSize += localStorage[key].length;
        }
      }
    } catch (error) {
      console.error('Error calculating storage size:', error);
    }
    
    return totalSize;
  }
  
  cleanupExpiredData(): void {
    const settings = this.getSettings();
    const retentionMs = settings.retentionHours * 60 * 60 * 1000;
    const cutoffTime = new Date(Date.now() - retentionMs);
    
    const allRequests = getStorageItem<Record<string, WebhookRequest[]>>(STORAGE_KEYS.REQUESTS, {});
    let cleanedCount = 0;
    
    // Clean up expired requests
    for (const webhookId in allRequests) {
      const requests = allRequests[webhookId];
      const filteredRequests = requests.filter((request: WebhookRequest) => {
        const requestTime = new Date(request.timestamp);
        return requestTime > cutoffTime;
      });
      
      if (filteredRequests.length !== requests.length) {
        allRequests[webhookId] = filteredRequests;
        cleanedCount += requests.length - filteredRequests.length;
        
        // Update webhook request count
        this.updateWebhook(webhookId, {
          requestCount: filteredRequests.length,
        });
      }
    }
    
    if (cleanedCount > 0) {
      setStorageItem(STORAGE_KEYS.REQUESTS, allRequests);
      console.log(`Cleaned up ${cleanedCount} expired requests`);
    }
  }

  private getDefaultSettings(): AppSettings {
    // Implement the logic to determine the default settings based on your application's requirements
    return DEFAULT_SETTINGS;
  }

  private cleanup(): void {
    // Implement the logic to clean up expired data based on your application's requirements
  }
}

// Create a client-side only storage instance
let webhookStorage: LocalWebhookStorage | null = null;

// Function to get or create storage instance (client-side only)
export function getWebhookStorage(): WebhookStorage {
  if (typeof window === 'undefined') {
    // Server-side fallback that doesn't do anything
    return {
      getWebhooks: () => [],
      saveWebhook: () => {},
      updateWebhook: () => false,
      deleteWebhook: () => false,
      getWebhook: () => null,
      getRequests: () => [],
      saveRequest: () => {},
      deleteRequest: () => false,
      clearRequests: () => {},
      getSettings: () => DEFAULT_SETTINGS,
      saveSettings: () => {},
      resetSettings: () => {},
      exportData: () => ({
        version: STORAGE_VERSION,
        exportedAt: new Date(),
        webhooks: [],
        requests: {},
      }),
      importData: () => false,
      clearAllData: () => {},
      getStorageSize: () => 0,
      cleanupExpiredData: () => {},
    };
  }
  
  if (!webhookStorage) {
    webhookStorage = new LocalWebhookStorage();
  }
  
  return webhookStorage;
}

// Export for backward compatibility and testing
export { getWebhookStorage as webhookStorage, LocalWebhookStorage }; 