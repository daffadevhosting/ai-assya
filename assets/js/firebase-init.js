/**
 * Firebase Initialization Module
 * This module handles Firebase initialization with security best practices
 */

// Import configuration
import { FIREBASE_CONFIG, APP_CONFIG } from './config.js';

// Firebase SDK imports (using ES modules from CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getAuth,
  signInWithCustomToken,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Initialize Firebase app
let app;
let auth;
let db;

/**
 * Initialize Firebase with security checks
 */
function initializeFirebase() {
  try {
    // Validate configuration before initialization
    if (!FIREBASE_CONFIG.apiKey || !FIREBASE_CONFIG.projectId) {
      throw new Error('Firebase configuration is incomplete');
    }

    app = initializeApp(FIREBASE_CONFIG);
    auth = getAuth(app);
    db = getFirestore(app);

    console.log('Firebase initialized successfully');
    return { app, auth, db };
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    throw error;
  }
}

// Initialize immediately
try {
  const firebaseInstance = initializeFirebase();
  auth = firebaseInstance.auth;
  db = firebaseInstance.db;
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Fallback: show error message to user
  if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      const errorMsg = document.createElement('div');
      errorMsg.style.position = 'fixed';
      errorMsg.style.top = '0';
      errorMsg.style.left = '0';
      errorMsg.style.right = '0';
      errorMsg.style.background = '#ffebee';
      errorMsg.style.color = '#c62828';
      errorMsg.style.padding = '10px';
      errorMsg.style.textAlign = 'center';
      errorMsg.style.zIndex = '9999';
      errorMsg.textContent = 'Koneksi ke layanan otentikasi gagal. Silakan refresh halaman.';
      document.body.prepend(errorMsg);
    });
  }
}

// Authentication state
let currentUser = null;

/**
 * Initialize authentication
 */
async function initAuth() {
  try {
    // Check for custom token in URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token') || localStorage.getItem('auth_token');

    if (token) {
      try {
        await signInWithCustomToken(auth, token);
        localStorage.removeItem('auth_token'); // Clear token after use
        return;
      } catch (err) {
        console.warn("Custom token authentication failed:", err);
      }
    }

    // Fallback to anonymous login
    await signInAnonymously(auth);
  } catch (err) {
    console.error("Anonymous login failed:", err);
    throw err;
  }
}

// Initialize auth on load
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initAuth);
}

// Set up auth state listener
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (typeof window !== 'undefined') {
    window.currentUser = user;
    updateAuthUI(user);

    if (user && !user.isAnonymous) {
      listenUserPurchaseHistory(user.uid);
    }
  }
});

// Export functions for global access
if (typeof window !== 'undefined') {
  window.fbAuth = auth;
  window.fbDb = db;
  window.fbAppId = APP_CONFIG.appId;
  window.currentUser = currentUser;
  window.initializeFirebase = initializeFirebase;
  window.initAuth = initAuth;
}

/**
 * Login with Google
 */
async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    if (typeof showToast !== 'undefined') {
      showToast(`Selamat datang, ${result.user.displayName || 'Pengguna'}!`);
    }
    return result;
  } catch (error) {
    console.error("Error login Google:", error);
    if (typeof showToast !== 'undefined') {
      showToast("Proses login Google dibatalkan atau gagal.");
    }
    throw error;
  }
}

/**
 * Logout user
 */
async function logoutUser() {
  try {
    await signOut(auth);
    await signInAnonymously(auth);
    if (typeof showToast !== 'undefined') {
      showToast("Berhasil keluar dari akun.");
    }
    if (typeof closeProfileModal !== 'undefined') {
      closeProfileModal();
    }
  } catch (error) {
    console.error("Error logout:", error);
    throw error;
  }
}

/**
 * Save chat message to Firestore
 */
async function saveChatToFirestore(sender, messageText) {
  if (!auth.currentUser) return;
  const uid = auth.currentUser.uid;
  try {
    const chatCol = collection(db, 'artifacts', APP_CONFIG.appId, 'users', uid, 'chat_history');
    await addDoc(chatCol, {
      sender: sender,
      text: messageText,
      timestamp: serverTimestamp()
    });
  } catch (err) {
    console.error("Gagal menyimpan percakapan ke Firestore:", err);
    throw err;
  }
}

/**
 * Save purchase to Firestore
 */
async function savePurchaseToFirestore(cartItems, totalAmount) {
  if (!auth.currentUser) return;
  const uid = auth.currentUser.uid;
  try {
    const purchaseCol = collection(db, 'artifacts', APP_CONFIG.appId, 'users', uid, 'purchase_history');
    await addDoc(purchaseCol, {
      items: cartItems,
      total: totalAmount,
      status: "Menunggu Konfirmasi Admin",
      createdAt: serverTimestamp(),
      formattedDate: new Date().toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    });
    if (typeof showToast !== 'undefined') {
      showToast("Transaksi tersimpan di Riwayat Pembelian!");
    }
  } catch (err) {
    console.error("Gagal menyimpan transaksi ke Firestore:", err);
    throw err;
  }
}

/**
 * Listen to user purchase history
 */
function listenUserPurchaseHistory(uid) {
  try {
    const purchaseCol = collection(db, 'artifacts', APP_CONFIG.appId, 'users', uid, 'purchase_history');
    onSnapshot(purchaseCol, (snapshot) => {
      const purchases = [];
      snapshot.forEach((doc) => {
        purchases.push({ id: doc.id, ...doc.data() });
      });
      if (typeof renderPurchaseHistoryUI !== 'undefined') {
        renderPurchaseHistoryUI(purchases);
      }
    }, (error) => {
      console.error("Error listening purchase history:", error);
    });
  } catch (err) {
    console.error("Firestore Error:", err);
  }
}

/**
 * Update auth UI
 */
function updateAuthUI(user) {
  const chip = document.getElementById('user-auth-chip');
  const avatarContainer = document.getElementById('user-chip-avatar');
  const label = document.getElementById('user-chip-label');

  if (!chip || !avatarContainer || !label) return;

  if (user && !user.isAnonymous) {
    const photoUrl = user.photoURL || `https://placehold.co/80x80/075e54/white.png?text=${user.displayName ? user.displayName.charAt(0) : 'U'}`;
    const name = user.displayName ? user.displayName.split(' ')[0] : 'Profil';

    avatarContainer.innerHTML = `<img src="${photoUrl}" class="w-full h-full object-cover rounded-full" />`;
    label.innerText = name;
    chip.onclick = typeof openProfileModal !== 'undefined' ? openProfileModal : null;
    chip.className = "bg-emerald-700/80 hover:bg-emerald-700 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1.5 border border-emerald-400/40 cursor-pointer transition-all";
  } else {
    avatarContainer.innerHTML = `<ion-icon name="logo-google" class="text-white text-sm"></ion-icon>`;
    label.innerText = "Login Google";
    chip.onclick = loginWithGoogle;
    chip.className = "bg-emerald-800/60 hover:bg-emerald-800 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-emerald-500/30 cursor-pointer transition-all active:scale-95";
  }
}

// Export for module usage
export {
  auth,
  db,
  app,
  currentUser,
  APP_CONFIG,
  FIREBASE_CONFIG,
  loginWithGoogle,
  logoutUser,
  saveChatToFirestore,
  savePurchaseToFirestore,
  listenUserPurchaseHistory,
  updateAuthUI,
  initAuth
};