/**
 * Struktur data di Firebase (di bawah luzie-react/hubstaff/):
 *
 *   sessions/{userId}/{sessionId}
 *     - userId, userName, date (YYYY-MM-DD)
 *     - startedAt (ms epoch), endedAt (ms epoch | null)
 *     - durationSeconds (akumulasi, di-update tiap heartbeat)
 *     - note (nama tugas/proyek, opsional teks bebas untuk versi awal)
 *     - status: 'running' | 'paused' | 'stopped'
 *
 *   liveStatus/{userId}
 *     - userName, isTracking, currentSessionId, lastHeartbeatAt, todaySeconds
 *     → dipakai web dashboard (HubstaffView / view HRD) untuk lihat siapa aktif sekarang
 *       tanpa perlu scan seluruh riwayat sesi.
 *
 * CATATAN: screenshot & activity level BELUM ada di versi ini (menyusul di tahap
 * berikutnya). Struktur di atas sengaja dibuat supaya field baru (screenshots,
 * activityPercent, dst.) tinggal ditambahkan tanpa mengubah yang sudah ada.
 */
import { hubstaffRef, push, set, update, get, serverTimestamp } from './firebase';

export type SessionStatus = 'running' | 'paused' | 'stopped';

export interface TrackingSession {
  id: string;
  userId: string;
  userName: string;
  date: string;
  startedAt: number;
  endedAt: number | null;
  durationSeconds: number;
  note: string;
  status: SessionStatus;
}

const todayStr = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Mulai sesi tracking baru untuk user ini. Return id sesi. */
export async function startSession(userId: string, userName: string, note: string): Promise<string> {
  const listRef = hubstaffRef(`sessions/${userId}`);
  const newRef = push(listRef);
  const id = newRef.key as string;
  const session: TrackingSession = {
    id,
    userId,
    userName,
    date: todayStr(),
    startedAt: Date.now(),
    endedAt: null,
    durationSeconds: 0,
    note: note.trim(),
    status: 'running',
  };
  await set(newRef, session);
  await update(hubstaffRef(`liveStatus/${userId}`), {
    userName,
    isTracking: true,
    currentSessionId: id,
    lastHeartbeatAt: serverTimestamp(),
  });
  return id;
}

/** Kirim "denyut" berkala: update total durasi & tandai agent masih hidup.
 *  Kalau lastHeartbeatAt berhenti update > beberapa menit, dashboard bisa anggap
 *  sesi terputus (misal laptop mati mendadak) meski status masih 'running'. */
export async function heartbeat(
  userId: string,
  sessionId: string,
  durationSeconds: number,
  status: SessionStatus
): Promise<void> {
  await update(hubstaffRef(`sessions/${userId}/${sessionId}`), {
    durationSeconds,
    status,
  });
  await update(hubstaffRef(`liveStatus/${userId}`), {
    isTracking: status === 'running',
    lastHeartbeatAt: serverTimestamp(),
  });
}

/** Hentikan sesi (final). */
export async function stopSession(userId: string, sessionId: string, durationSeconds: number): Promise<void> {
  await update(hubstaffRef(`sessions/${userId}/${sessionId}`), {
    durationSeconds,
    status: 'stopped' as SessionStatus,
    endedAt: Date.now(),
  });
  await update(hubstaffRef(`liveStatus/${userId}`), {
    isTracking: false,
    lastHeartbeatAt: serverTimestamp(),
  });
}

/** Total detik yang sudah ditrack user ini hari ini (dipanggil saat agent dibuka,
 *  supaya angka "Hari ini" tidak reset ke 0 kalau agent sempat ditutup). */
export async function getTodaySeconds(userId: string): Promise<number> {
  const snap = await get(hubstaffRef(`sessions/${userId}`));
  const raw = (snap.val() || {}) as Record<string, TrackingSession>;
  const today = todayStr();
  return Object.values(raw)
    .filter((s) => s.date === today)
    .reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
}
