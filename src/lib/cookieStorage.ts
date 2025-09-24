// Cookie-based storage adapter for Supabase Auth
export const cookieStorage = {
  getItem: (key: string): string | null => {
    if (typeof document === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === key && value) {
        try {
          return decodeURIComponent(value);
        } catch {
          return null;
        }
      }
    }
    return null;
  },
  
  setItem: (key: string, value: string): void => {
    if (typeof document === 'undefined') return;
    
    // Set cookie with 7 days expiration, secure and same-site
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);
    
    const cookieValue = `${key}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
    document.cookie = cookieValue;
  },
  
  removeItem: (key: string): void => {
    if (typeof document === 'undefined') return;
    
    // Set cookie with past expiration date to remove it
    document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
  }
};