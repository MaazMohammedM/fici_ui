/**
 * Simple image validation utilities
 */

/**
 * Tests if an image URL is accessible
 * @param url The image URL to test
 * @returns Promise that resolves to true if the image loads successfully
 */
export const validateImageUrl = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!url) {
      resolve(false);
      return;
    }

    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
    
    // Timeout after 5 seconds
    setTimeout(() => resolve(false), 5000);
  });
};

/**
 * Gets the first working image URL from an array of URLs
 * @param urls Array of image URLs to test
 * @returns Promise that resolves to the first working URL or empty string
 */
export const getFirstWorkingImageUrl = async (urls: string[]): Promise<string> => {
  for (const url of urls) {
    if (await validateImageUrl(url)) {
      return url;
    }
  }
  return '';
};
