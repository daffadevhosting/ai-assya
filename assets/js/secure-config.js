/**
 * Secure Configuration Loader
 * This module loads sensitive configuration from a secure backend endpoint
 * instead of exposing it in the HTML source code.
 */

const CONFIG_CACHE_KEY = 'assya_ai_config_cache';
const CONFIG_CACHE_TTL = 3600000; // 1 hour in milliseconds

/**
 * Default fallback configuration (used only if backend is unavailable)
 * This is still exposed, but the production config should come from the backend
 */
const FALLBACK_CONFIG = {
  firebase: {
    apiKey: "AIzaSyCLqRflnb2__7D2QyEDsKE4eX42xi7mPTY",
    authDomain: "as-syariahputra.firebaseapp.com",
    databaseURL: "https://as-syariahputra.firebaseio.com",
    projectId: "as-syariahputra",
    storageBucket: "as-syariahputra.appspot.com",
    messagingSenderId: "623446867158",
    appId: "1:623446867158:web:fd4f2d077059589b1d5d77",
    measurementId: "G-T9YPV5SSQL"
  },
  app: {
    appId: 'as-syariahputra',
    apiEndpoint: 'https://assya-ai.workers.dev/api/chat'
  }
};

/**
 * Load configuration from backend API
 */
async function loadConfigFromBackend() {
  try {
    // Try to load from the workers backend first
    const response = await fetch('https://assya-ai.workers.dev/api/config', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      cache: 'no-cache'
    });

    if (response.ok) {
      const config = await response.json();
      // Validate the config
      if (config.firebase && config.firebase.apiKey) {
        return config;
      }
    }
  } catch (error) {
    console.warn('Failed to load config from backend:', error);
  }

  return null;
}

/**
 * Get cached configuration
 */
function getCachedConfig() {
  if (typeof localStorage !== 'undefined') {
    try {
      const cached = localStorage.getItem(CONFIG_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Check if cache is still valid
        if (parsed.timestamp && Date.now() - parsed.timestamp < CONFIG_CACHE_TTL) {
          return parsed.config;
        }
      }
    } catch (error) {
      console.warn('Failed to read cached config:', error);
    }
  }
  return null;
}

/**
 * Cache configuration
 */
function cacheConfig(config) {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify({
        config,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to cache config:', error);
    }
  }
}

/**
 * Load configuration with caching and fallback
 */
export async function loadSecureConfig() {
  // Try cached config first
  const cached = getCachedConfig();
  if (cached) {
    return cached;
  }

  // Try to load from backend
  const backendConfig = await loadConfigFromBackend();
  if (backendConfig) {
    cacheConfig(backendConfig);
    return backendConfig;
  }

  // Fallback to hardcoded config (less secure but functional)
  console.warn('Using fallback configuration. Consider deploying a config endpoint.');
  return FALLBACK_CONFIG;
}

/**
 * Initialize configuration on page load
 */
export async function initSecureConfig() {
  try {
    const config = await loadSecureConfig();

    // Set global variables for backward compatibility
    if (typeof window !== 'undefined') {
      window.__FIREBASE_API_KEY__ = config.firebase.apiKey;
      window.__FIREBASE_AUTH_DOMAIN__ = config.firebase.authDomain;
      window.__FIREBASE_DATABASE_URL__ = config.firebase.databaseURL;
      window.__FIREBASE_PROJECT_ID__ = config.firebase.projectId;
      window.__FIREBASE_STORAGE_BUCKET__ = config.firebase.storageBucket;
      window.__FIREBASE_MESSAGING_SENDER_ID__ = config.firebase.messagingSenderId;
      window.__FIREBASE_APP_ID__ = config.firebase.appId;
      window.__FIREBASE_MEASUREMENT_ID__ = config.firebase.measurementId;
      window.__API_ENDPOINT__ = config.app.apiEndpoint;
      window.__CONFIG_LOADED__ = true;
    }

    return config;
  } catch (error) {
    console.error('Failed to initialize secure config:', error);
    throw error;
  }
}

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSecureConfig);
  } else {
    initSecureConfig();
  }
}