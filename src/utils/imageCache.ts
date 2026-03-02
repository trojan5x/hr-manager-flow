/**
 * Image Caching and Preloading Utility
 * Prevents re-downloading images and provides smooth loading experience
 */

interface ImageCacheEntry {
  url: string;
  image: HTMLImageElement;
  timestamp: number;
  loaded: boolean;
}

class ImageCache {
  private cache = new Map<string, ImageCacheEntry>();
  private loadingPromises = new Map<string, Promise<HTMLImageElement>>();
  private maxAge = 30 * 60 * 1000; // 30 minutes cache

  /**
   * Preload an image and store it in cache
   */
  preloadImage(url: string): Promise<HTMLImageElement> {
    // Return existing loading promise if image is currently being loaded
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!;
    }

    // Return cached image if available and not expired
    const cachedEntry = this.cache.get(url);
    if (cachedEntry && cachedEntry.loaded && !this.isExpired(cachedEntry)) {
      return Promise.resolve(cachedEntry.image);
    }

    // Create loading promise
    const loadingPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      
      // Set up cache entry
      const cacheEntry: ImageCacheEntry = {
        url,
        image: img,
        timestamp: Date.now(),
        loaded: false
      };
      
      img.onload = () => {
        cacheEntry.loaded = true;
        this.cache.set(url, cacheEntry);
        this.loadingPromises.delete(url);
        resolve(img);
      };
      
      img.onerror = () => {
        this.loadingPromises.delete(url);
        this.cache.delete(url);
        reject(new Error(`Failed to load image: ${url}`));
      };
      
      // Try to set crossOrigin only for external URLs
      try {
        if (url.startsWith('http') && !url.includes(window.location.hostname)) {
          img.crossOrigin = 'anonymous';
        }
      } catch (e) {
        // Ignore crossOrigin errors
      }
      
      // Start loading
      img.src = url;
    });

    // Store loading promise
    this.loadingPromises.set(url, loadingPromise);
    
    return loadingPromise;
  }

  /**
   * Preload multiple images with fallback handling
   */
  async preloadImages(urls: string[], fallbackUrl?: string): Promise<{
    loaded: HTMLImageElement[];
    failed: string[];
  }> {
    const results = await Promise.allSettled(
      urls.map(url => this.preloadImage(url))
    );

    const loaded: HTMLImageElement[] = [];
    const failed: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        loaded.push(result.value);
      } else {
        failed.push(urls[index]);
        console.warn(`Failed to load image: ${urls[index]}`, result.reason);
      }
    });

    // Load fallback for failed images if provided
    if (failed.length > 0 && fallbackUrl) {
      try {
        const fallbackImg = await this.preloadImage(fallbackUrl);
        // Add fallback images to loaded array for each failed image
        for (let i = 0; i < failed.length; i++) {
          loaded.push(fallbackImg);
        }
      } catch (error) {
        console.warn(`Failed to load fallback image: ${fallbackUrl}`, error);
      }
    }

    return { loaded, failed };
  }

  /**
   * Get cached image if available
   */
  getCachedImage(url: string): HTMLImageElement | null {
    const cachedEntry = this.cache.get(url);
    if (cachedEntry && cachedEntry.loaded && !this.isExpired(cachedEntry)) {
      return cachedEntry.image;
    }
    return null;
  }

  /**
   * Check if an image is cached and loaded
   */
  isImageCached(url: string): boolean {
    const cachedEntry = this.cache.get(url);
    return !!(cachedEntry && cachedEntry.loaded && !this.isExpired(cachedEntry));
  }

  /**
   * Clear expired entries from cache
   */
  clearExpired(): void {
    for (const [url, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(url);
      }
    }
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    this.cache.clear();
    this.loadingPromises.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalImages: number;
    loadedImages: number;
    loadingImages: number;
    expiredImages: number;
  } {
    let loadedImages = 0;
    let expiredImages = 0;

    for (const entry of this.cache.values()) {
      if (entry.loaded) {
        if (this.isExpired(entry)) {
          expiredImages++;
        } else {
          loadedImages++;
        }
      }
    }

    return {
      totalImages: this.cache.size,
      loadedImages,
      loadingImages: this.loadingPromises.size,
      expiredImages
    };
  }

  private isExpired(entry: ImageCacheEntry): boolean {
    return Date.now() - entry.timestamp > this.maxAge;
  }
}

// Global image cache instance
export const imageCache = new ImageCache();

// Clean up expired cache entries every 5 minutes
setInterval(() => {
  imageCache.clearExpired();
}, 5 * 60 * 1000);

/**
 * Hook for preloading images in React components
 */
export const useImagePreloader = () => {
  return {
    preloadImage: imageCache.preloadImage.bind(imageCache),
    preloadImages: imageCache.preloadImages.bind(imageCache),
    getCachedImage: imageCache.getCachedImage.bind(imageCache),
    isImageCached: imageCache.isImageCached.bind(imageCache),
    getCacheStats: imageCache.getCacheStats.bind(imageCache)
  };
};