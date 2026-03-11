/**
 * Client-side CSRF Utilities
 * 
 * Handles CSRF token retrieval and inclusion in requests
 */

// Cache for CSRF token
let csrfTokenCache: string | null = null;
let tokenPromise: Promise<string> | null = null;

/**
 * Get CSRF token (cached)
 */
export async function getCsrfToken(): Promise<string> {
  // Return cached token if available
  if (csrfTokenCache) {
    return csrfTokenCache;
  }
  
  // If a request is already in progress, wait for it
  if (tokenPromise) {
    return tokenPromise;
  }
  
  // Fetch new token
  tokenPromise = fetch('/api/csrf-token', {
    credentials: 'include',
    headers: {
      'Cache-Control': 'no-cache',
    },
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch CSRF token: ${response.status}`);
      }
      
      const data = await response.json();
      csrfTokenCache = data.token;
      return data.token;
    })
    .catch((error) => {
      console.error('CSRF token fetch error:', error);
      // Return empty string as fallback
      return '';
    })
    .finally(() => {
      tokenPromise = null;
    });
  
  return tokenPromise;
}

/**
 * Clear CSRF token cache
 */
export function clearCsrfTokenCache(): void {
  csrfTokenCache = null;
  tokenPromise = null;
}

/**
 * Create headers with CSRF token for fetch requests
 */
export async function getCsrfHeaders(): Promise<HeadersInit> {
  const token = await getCsrfToken();
  
  return {
    'X-CSRF-Token': token,
  };
}

/**
 * Enhanced fetch with CSRF protection
 */
export async function csrfFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const csrfHeaders = await getCsrfHeaders();
  
  const mergedOptions: RequestInit = {
    ...options,
    headers: {
      ...csrfHeaders,
      ...options.headers,
    },
    credentials: 'include', // Always include cookies
  };
  
  return fetch(url, mergedOptions);
}

/**
 * Add CSRF token to FormData
 */
export async function addCsrfToFormData(formData: FormData): Promise<FormData> {
  const token = await getCsrfToken();
  formData.append('csrf_token', token);
  return formData;
}

/**
 * Add CSRF token to JSON request body
 */
export async function addCsrfToJsonBody(body: any): Promise<any> {
  const token = await getCsrfToken();
  return {
    ...body,
    csrf_token: token,
  };
}

/**
 * Initialize CSRF token on page load
 * Call this in your main layout or app initialization
 */
export function initializeCsrfToken(): void {
  // Pre-fetch CSRF token on page load
  if (typeof window !== 'undefined') {
    getCsrfToken().catch(() => {
      // Silent fail - token will be fetched when needed
    });
  }
}