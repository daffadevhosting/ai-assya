/**
 * Configuration file for Assya AI
 * This file contains environment-specific configuration
 * In production, these values should be injected via environment variables or a secure backend
 */

// In production, you should:
// 1. Create a backend API endpoint that returns the Firebase config
// 2. Or use environment variables (for Node.js/build tools)
// 3. Or use a secure config service

// For now, we'll use a placeholder that will be replaced at build time
// or fetched from a secure endpoint

const FIREBASE_CONFIG = {
  apiKey: window.__FIREBASE_API_KEY__ || "AIzaSyCLqRflnb2__7D2QyEDsKE4eX42xi7mPTY",
  authDomain: window.__FIREBASE_AUTH_DOMAIN__ || "as-syariahputra.firebaseapp.com",
  databaseURL: window.__FIREBASE_DATABASE_URL__ || "https://as-syariahputra.firebaseio.com",
  projectId: window.__FIREBASE_PROJECT_ID__ || "as-syariahputra",
  storageBucket: window.__FIREBASE_STORAGE_BUCKET__ || "as-syariahputra.appspot.com",
  messagingSenderId: window.__FIREBASE_MESSAGING_SENDER_ID__ || "623446867158",
  appId: window.__FIREBASE_APP_ID__ || "1:623446867158:web:fd4f2d077059589b1d5d77",
  measurementId: window.__FIREBASE_MEASUREMENT_ID__ || "G-T9YPV5SSQL"
};

// App configuration
const APP_CONFIG = {
  appId: 'as-syariahputra',
  apiEndpoint: window.__API_ENDPOINT__ || 'https://assya-ai.sendaljepit.workers.dev/api/chat',
  storeLocation: {
    address: "As-Syariah Bordir, Konveksi & Produsen Bordir",
    mapsUrl: "https://maps.app.goo.gl/yoPqRJYF17LJV8Wd9?g_st=ac"
  }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.FIREBASE_CONFIG = FIREBASE_CONFIG;
  window.APP_CONFIG = APP_CONFIG;
}

// Security: Validate config before use
function validateConfig(config) {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missingFields = requiredFields.filter(field => !config[field]);

  if (missingFields.length > 0) {
    console.warn('Firebase configuration is incomplete. Missing fields:', missingFields);
    return false;
  }

  // Check if API key looks valid (should be ~40 characters)
  if (config.apiKey && config.apiKey.length < 30) {
    console.warn('Firebase API key appears to be invalid');
    return false;
  }

  return true;
}

// Validate on load
if (!validateConfig(FIREBASE_CONFIG)) {
  console.error('Invalid Firebase configuration. Please check your configuration.');
}