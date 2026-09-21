/**
 * Konfigurasi Firebase Realtime Database.
 *
 * Nilai default disamakan dengan project referensi (WFA-System-V2 → wfa-system-v3)
 * sehingga aplikasi langsung tersambung tanpa setup tambahan. Untuk memakai project
 * Firebase lain cukup isi variabel VITE_FIREBASE_* di file .env (lihat .env.example).
 *
 * Catatan: apiKey Firebase untuk aplikasi web memang bersifat publik. Keamanan data
 * diatur lewat Realtime Database Rules (lihat database.rules.json), bukan dengan
 * menyembunyikan apiKey.
 */
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, update, set, get, type DatabaseReference } from 'firebase/database';

const env = import.meta.env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyAxPObCVrd2adpivs2iNGluozqtY1seoqA',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'wfa-system-v3.firebaseapp.com',
  databaseURL:
    env.VITE_FIREBASE_DATABASE_URL ||
    'https://wfa-system-v3-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'wfa-system-v3',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'wfa-system-v3.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '315254355578',
  appId: env.VITE_FIREBASE_APP_ID || '1:315254355578:web:9a4b4a01055ecd0ddd2dc3',
};

const app = initializeApp(firebaseConfig);
export const rtdb = getDatabase(app);

/**
 * Semua data aplikasi disimpan di bawah satu "root". Default-nya BEDA dari root
 * aplikasi V2 ("luzie") karena struktur datanya berbeda — supaya tidak saling menimpa
 * kalau keduanya memakai project Firebase yang sama.
 */
export const DB_ROOT = (env.VITE_DB_ROOT || 'luzie-react').replace(/^\/+|\/+$/g, '');

export const dbRef = (path: string): DatabaseReference => ref(rtdb, `${DB_ROOT}/${path}`);
export const rootRef = (): DatabaseReference => ref(rtdb, DB_ROOT);

export { onValue, update, set, get, ref };

/** Firebase menolak `undefined` — buang dari object, ubah jadi null di dalam array. */
export function cleanForFirebase<T>(value: T): T | null {
  if (value === undefined || value === null) return null;
  if (Array.isArray(value)) {
    return value.map((v) => (v === undefined ? null : cleanForFirebase(v))) as unknown as T;
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([k, v]) => {
      if (v !== undefined) out[k] = cleanForFirebase(v);
    });
    return out as T;
  }
  return value;
}

/** Pantau status koneksi ke Firebase (untuk badge Online/Offline di header). */
export function watchConnection(cb: (online: boolean) => void): () => void {
  return onValue(ref(rtdb, '.info/connected'), (snap) => cb(!!snap.val()));
}
