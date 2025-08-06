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
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }
}

export const cache = new SimpleCache();

// Clean up expired entries every 10 minutes
setInterval(() => {
  cache.cleanup();
}, 10 * 60 * 1000);

// Preload critical data to avoid initial delays
export async function preloadCriticalData() {
  try {
    console.log("🚀 Preloading critical data into cache...");
    
    // Import storage here to avoid circular dependency
    const { storage } = await import("./storage");
    
    // Preload most frequently accessed data
    const [schools, books, stats, categories] = await Promise.all([
      storage.getSchools(),
      storage.getBooks(),
      storage.getStats(),
      storage.getCultureCategories()
    ]);
    
    cache.set("schools", schools, 5 * 60 * 1000);
    cache.set("books:all", books, 5 * 60 * 1000);
    cache.set("stats", stats, 3 * 60 * 1000);
    cache.set("culture-categories", categories, 10 * 60 * 1000);
    
    console.log("✅ Critical data preloaded successfully");
  } catch (error) {
    console.error("❌ Failed to preload critical data:", error);
  }
}