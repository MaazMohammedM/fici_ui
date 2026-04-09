const BASE_URLS = [
  "https://api.ficishoes.com"
];

export async function fetchWithFallback(path: string, options?: RequestInit): Promise<Response> {
  let lastError: Error | null = null;
  
  for (const base of BASE_URLS) {
    try {
      const res = await fetch(`${base}${path}`, options);
      if (res.ok) {
        return res;
      }
      
      // If response is not ok, try next base URL
      console.warn(`API returned ${res.status} on: ${base}${path}`);
    } catch (err) {
      lastError = err as Error;
      console.warn("API failed on:", base, err);
    }
  }
  
  // If we get here, all attempts failed
  if (lastError) {
    throw new Error(`All API endpoints failed. Last error: ${lastError.message}`);
  }
  
  throw new Error("All API endpoints failed");
}
