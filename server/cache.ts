// In-memory cache to reduce database calls
class SimpleCache {
  private cache = new Map<string, { data: any; expires: number }>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any, ttl?: number): void {
    const expires = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { data, expires });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.cache.forEach((item, key) => {
      if (now > item.expires) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

export const cache = new SimpleCache();

// Clean up expired entries every 10 minutes
setInterval(() => {
  cache.cleanup();
}, 10 * 60 * 1000);

// Utility function to wait/delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry wrapper with exponential backoff
async function retryOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 ${operationName} - Attempt ${attempt}/${maxRetries}`);
      
      // Set a 10-second timeout for each operation
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Operation timeout')), 10000);
      });
      
      const result = await Promise.race([operation(), timeoutPromise]);
      console.log(`✅ ${operationName} - Success on attempt ${attempt}`);
      return result;
      
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (isLastAttempt) {
        console.error(`❌ ${operationName} - Failed after ${maxRetries} attempts:`, errorMessage);
        return null;
      } else {
        const waitTime = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.warn(`⚠️ ${operationName} - Attempt ${attempt} failed: ${errorMessage}. Retrying in ${waitTime}ms...`);
        await delay(waitTime);
      }
    }
  }
  return null;
}

// Load individual data types with error isolation
async function loadDataType<T>(
  operation: () => Promise<T>,
  cacheKey: string,
  ttl: number,
  operationName: string
): Promise<boolean> {
  const result = await retryOperation(operation, operationName);
  
  if (result !== null) {
    cache.set(cacheKey, result, ttl);
    return true;
  }
  return false;
}

// Preload critical data with robust error handling and retry logic
export async function preloadCriticalData() {
  console.log("🚀 Preloading critical data into cache...");
  
  try {
    // Import storage here to avoid circular dependency
    const { storage } = await import("./storage");
    
    const loadingTasks = [
      {
        name: "Schools",
        operation: () => storage.getSchools(),
        cacheKey: "schools",
        ttl: 5 * 60 * 1000
      },
      {
        name: "Books",
        operation: () => storage.getBooks(),
        cacheKey: "books:all", 
        ttl: 5 * 60 * 1000
      },
      {
        name: "Stats",
        operation: () => storage.getStats(),
        cacheKey: "stats",
        ttl: 3 * 60 * 1000
      },
      {
        name: "Culture Categories",
        operation: () => storage.getCultureCategories(),
        cacheKey: "culture-categories",
        ttl: 10 * 60 * 1000
      }
    ];
    
    // Load each data type independently with isolated error handling
    const results = await Promise.allSettled(
      loadingTasks.map(task => 
        loadDataType(task.operation, task.cacheKey, task.ttl, task.name)
      )
    );
    
    // Count successful and failed loads
    const successful = results.filter((result, index) => {
      if (result.status === 'fulfilled' && result.value === true) {
        return true;
      }
      if (result.status === 'rejected') {
        console.error(`❌ ${loadingTasks[index].name} loading completely failed:`, result.reason);
      }
      return false;
    }).length;
    
    const total = loadingTasks.length;
    
    if (successful === total) {
      console.log("✅ Critical data preloaded successfully - All data types loaded");
    } else if (successful > 0) {
      console.log(`⚠️ Partial preload success - ${successful}/${total} data types loaded. App can still function.`);
    } else {
      console.warn("❌ No data was preloaded, but app will continue running. Data will be loaded on-demand.");
    }
    
  } catch (error) {
    // Even if everything fails, the app should continue
    console.error("❌ Critical error in preload function, but app will continue:", 
      error instanceof Error ? error.message : String(error));
    console.log("🔄 App will function normally - data will be loaded on-demand");
  }
}