import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  FileText,
  Laptop,
  Smartphone,
  HelpCircle,
  CheckCircle2,
  Lock,
  Clock,
  Check,
  History,
  Play,
  Pause,
  Square,
} from 'lucide-react';
import { SidebarMenuId } from './Sidebar';
import { useFirebaseCollection, useFirebaseValue } from '../lib/useFirebaseCollection';
import { getTodayDateString } from '../data/initialData';
import { startSession, heartbeat, stopSession, SessionStatus as AgentSessionStatus } from '../lib/hubstaffData';

interface HubstaffViewProps {
  onNavigate?: (menu: SidebarMenuId) => void;
}

type SessionStatus = AgentSessionStatus;

interface TrackingSession {
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

interface LiveStatus {
  userName: string;
  isTracking: boolean;
  currentSessionId: string | null;
  lastHeartbeatAt: number | null;
}

const LIVE_STATUS_DEFAULTS: LiveStatus = {
  userName: '',
  isTracking: false,
  currentSessionId: null,
  lastHeartbeatAt: null,
};

/** Kalau denyut terakhir lebih lama dari ini, anggap sesi terputus (mis. tab/aplikasi
 *  tertutup mendadak di perangkat lain) meski status Firebase masih 'running'. */
const STALE_THRESHOLD_MS = 60_000;
const HEARTBEAT_MS = 15_000;

const formatHMS = (totalSeconds: number): string => {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

const formatClock = (ms: number): string =>
  new Date(ms).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

export const HubstaffView: React.FC<HubstaffViewProps> = ({ onNavigate }) => {
  const { currentUser, getCurrentEntry, doAbsenPagi, showToast } = useApp();
  const entry = getCurrentEntry();

  const isAbsenPagiDone = !!entry.absenPagi;
  const isTodoListDone = entry.todos.length > 0;
  const isReadyForHubstaff = isAbsenPagiDone && isTodoListDone;

  const today = getTodayDateString();

  const { value: liveStatus, loaded: liveLoaded } = useFirebaseValue<LiveStatus>(
    `hubstaff/liveStatus/${currentUser.id}`,
    LIVE_STATUS_DEFAULTS
  );

  const { items: sessions, loaded: sessionsLoaded } = useFirebaseCollection<TrackingSession>({
    path: `hubstaff/sessions/${currentUser.id}`,
    normalize: (raw, id) => ({
      id: raw?.id || id,
      userId: raw?.userId || currentUser.id,
      userName: raw?.userName || currentUser.name,
      date: raw?.date || '',
      startedAt: raw?.startedAt || 0,
      endedAt: raw?.endedAt ?? null,
      durationSeconds: raw?.durationSeconds || 0,
      note: raw?.note || '',
      status: (raw?.status as SessionStatus) || 'stopped',
    }),
    sort: (a, b) => b.startedAt - a.startedAt,
  });

  const todaySessions = sessions.filter((s) => s.date === today);

  const heartbeatAge = liveStatus.lastHeartbeatAt ? Date.now() - liveStatus.lastHeartbeatAt : Infinity;
  const isStale = liveStatus.isTracking && heartbeatAge >= STALE_THRESHOLD_MS;

  // ---- Kontrol tracking (Mulai / Jeda / Selesai) langsung dari halaman ini ----
  const [localStatus, setLocalStatus] = useState<'idle' | SessionStatus>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [note, setNote] = useState('');
  const [syncing, setSyncing] = useState(false);
  const resumedRef = useRef(false);

  const tickRef = useRef<number | null>(null);
  const heartbeatRef = useRef<number | null>(null);

  const otherTodaySeconds = todaySessions
    .filter((s) => s.id !== sessionId)
    .reduce((sum, s) => sum + (s.durationSeconds || 0), 0);

  // Resume otomatis: kalau ada sesi 'running' milik user ini yang masih hidup (heartbeat
  // baru), lanjutkan tampilannya di sini — misal tab sempat ditutup lalu dibuka lagi.
  useEffect(() => {
    if (resumedRef.current || !sessionsLoaded || !liveLoaded) return;
    resumedRef.current = true;
    if (liveStatus.isTracking && liveStatus.currentSessionId && !isStale) {
      const active = sessions.find((s) => s.id === liveStatus.currentSessionId);
      if (active && active.status !== 'stopped') {
        setSessionId(active.id);
        setElapsed(active.durationSeconds || 0);
        setLocalStatus(active.status);
        setNote(active.note || '');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionsLoaded, liveLoaded]);

  useEffect(() => {
    if (localStatus !== 'running') return;
    tickRef.current = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    heartbeatRef.current = window.setInterval(() => {
      setElapsed((current) => {
        if (sessionId) heartbeat(currentUser.id, sessionId, current, 'running').catch(() => {});
        return current;
      });
    }, HEARTBEAT_MS);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
      if (heartbeatRef.current) window.clearInterval(heartbeatRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localStatus, sessionId]);

  const handleStart = async () => {
    if (!isReadyForHubstaff) {
      showToast('Selesaikan absen pagi dan to-do list terlebih dahulu!', 'warning');
      return;
    }
    setSyncing(true);
    try {
      const id = await startSession(currentUser.id, currentUser.name, note);
      setSessionId(id);
      setElapsed(0);
      setLocalStatus('running');
      showToast('Tracking dimulai.', 'success');
    } catch {
      showToast('Gagal memulai tracking. Periksa koneksi internet.', 'warning');
    } finally {
      setSyncing(false);
    }
  };

  const handlePause = async () => {
    setLocalStatus('paused');
    if (sessionId) await heartbeat(currentUser.id, sessionId, elapsed, 'paused').catch(() => {});
    showToast('Tracking dijeda.', 'info');
  };

  const handleResume = () => {
    setLocalStatus('running');
  };

  const handleStop = async () => {
    setSyncing(true);
    try {
      if (sessionId) await stopSession(currentUser.id, sessionId, elapsed);
      setLocalStatus('idle');
      setSessionId(null);
      setElapsed(0);
      setNote('');
      showToast('Sesi tracking disimpan.', 'success');
    } catch {
      showToast('Gagal menyimpan sesi. Coba lagi.', 'warning');
    } finally {
      setSyncing(false);
    }
  };

  const todayTotalSeconds = otherTodaySeconds + (localStatus !== 'idle' ? elapsed : 0);
  const isActuallyTracking = localStatus === 'running';

  const handleQuickAbsenPagi = () => {
    doAbsenPagi('Rumah (WFA)', 'Absen cepat via halaman persiapan Hubstaff');
    showToast('Absen pagi berhasil dicatat! Mengalihkan ke To-Do List...', 'success');
    setTimeout(() => {
      onNavigate?.('todo-saya');
    }, 1200);
  };

  const statusLabel = (s: SessionStatus) =>
    s === 'running' ? 'Berjalan' : s === 'paused' ? 'Dijeda' : 'Selesai';

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Hubstaff</h1>
        <p className="text-xs text-slate-500 mt-1">Aktifkan time tracking sebelum mulai bekerja</p>
      </div>

      {/* CARD 1: STATUS PERSIAPAN KERJA */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <FileText className="w-4 h-4 text-blue-600" />
          <span>Status Persiapan Kerja</span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:border-slate-200 transition-all">
            <div className="flex items-center gap-3.5">
              {isAbsenPagiDone ? (
                <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-500 flex items-center justify-center text-emerald-600 shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-slate-300 shrink-0" />
              )}
              <div>
                <div className="text-xs font-bold text-slate-900">
                  {isAbsenPagiDone ? 'Sudah Absen Pagi' : 'Belum Absen Pagi'}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {isAbsenPagiDone
                    ? `Tercatat pukul ${entry.absenPagi?.time} • ${entry.absenPagi?.location}`
                    : 'Absen dulu sebelum mulai'}
                </div>
              </div>
            </div>

            {isAbsenPagiDone ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Sudah Absen</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleQuickAbsenPagi}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
              >
                Absen Sekarang
              </button>
            )}
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:border-slate-200 transition-all">
            <div className="flex items-center gap-3.5">
              {isTodoListDone ? (
                <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-500 flex items-center justify-center text-emerald-600 shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-slate-300 shrink-0" />
              )}
              <div>
                <div className="text-xs font-bold text-slate-900">
                  {isTodoListDone ? 'Sudah Isi To-Do List' : 'Belum Isi To-Do List'}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {isTodoListDone
                    ? `${entry.todos.length} tugas hari ini telah dibuat dan siap dikerjakan`
                    : 'Isi to-do list terlebih dahulu'}
                </div>
              </div>
            </div>

            {isTodoListDone ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Sudah Diisi ({entry.todos.length})</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate?.('todo-saya')}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
              >
                Isi To-Do
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CARD 2: TRACKING (INTERAKTIF, LANGSUNG DARI SINI) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Time Tracking</span>
          </div>
          {isActuallyTracking && (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-700">Sedang Tracking</span>
            </div>
          )}
        </div>

        {!isReadyForHubstaff ? (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Selesaikan absen pagi dan to-do list terlebih dahulu untuk mengaktifkan Hubstaff.</span>
          </div>
        ) : isStale && localStatus === 'idle' ? (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs flex items-center gap-2.5">
            <span>
              Ada sesi yang tercatat terputus (perangkat lain tertutup saat masih tracking). Anda
              bisa mulai sesi baru sekarang.
            </span>
          </div>
        ) : null}

        <div className="p-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50/70 to-sky-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-white shadow-sm ${
                isActuallyTracking ? 'bg-blue-600' : 'bg-slate-400'
              }`}
            >
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  Luzie Group &bull; {currentUser.division}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    isActuallyTracking
                      ? 'bg-emerald-100 text-emerald-700'
                      : localStatus === 'paused'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isActuallyTracking ? '● Tracking Aktif' : localStatus === 'paused' ? 'Dijeda' : 'Tidak Aktif'}
                </span>
              </div>
              <div className="text-xl font-black font-mono text-slate-900 mt-0.5">
                {sessionsLoaded ? formatHMS(todayTotalSeconds) : '--:--:--'}
              </div>
              <p className="text-[11px] text-slate-500">Total tercatat hari ini</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {localStatus === 'idle' && (
              <>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Sedang mengerjakan apa? (opsional)"
                  className="flex-1 md:w-56 px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-400"
                />
                <button
                  onClick={handleStart}
                  disabled={!isReadyForHubstaff || syncing}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  <Play className="w-4 h-4" />
                  <span>Mulai</span>
                </button>
              </>
            )}
            {localStatus === 'running' && (
              <>
                <button
                  onClick={handlePause}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm bg-slate-600 hover:bg-slate-700 text-white"
                >
                  <Pause className="w-4 h-4" />
                  <span>Jeda</span>
                </button>
                <button
                  onClick={handleStop}
                  disabled={syncing}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Selesai</span>
                </button>
              </>
            )}
            {localStatus === 'paused' && (
              <>
                <button
                  onClick={handleResume}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Play className="w-4 h-4" />
                  <span>Lanjut</span>
                </button>
                <button
                  onClick={handleStop}
                  disabled={syncing}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Selesai</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Riwayat sesi hari ini */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-slate-700 font-bold text-xs">
            <History className="w-3.5 h-3.5" />
            <span>Riwayat Sesi Hari Ini</span>
          </div>
          {!sessionsLoaded ? (
            <p className="text-xs text-slate-400">Memuat riwayat...</p>
          ) : todaySessions.length === 0 && localStatus === 'idle' ? (
            <p className="text-xs text-slate-400">Belum ada sesi tracking hari ini.</p>
          ) : (
            <div className="space-y-2">
              {localStatus !== 'idle' && (
                <div className="flex items-center justify-between p-3 rounded-xl border border-blue-100 bg-blue-50/50 text-xs">
                  <div>
                    <div className="font-semibold text-slate-800">Sesi berjalan &ndash; sekarang</div>
                    {note && <div className="text-slate-500 mt-0.5">{note}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-700">{formatHMS(elapsed)}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        localStatus === 'running' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {statusLabel(localStatus)}
                    </span>
                  </div>
                </div>
              )}
              {todaySessions
                .filter((s) => s.id !== sessionId)
                .map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/40 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">
                        {formatClock(s.startedAt)} &ndash; {s.endedAt ? formatClock(s.endedAt) : 'sekarang'}
                      </div>
                      {s.note && <div className="text-slate-500 mt-0.5">{s.note}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-700">{formatHMS(s.durationSeconds)}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          s.status === 'running'
                            ? 'bg-emerald-100 text-emerald-700'
                            : s.status === 'paused'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {statusLabel(s.status)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <p className="text-[11px] text-slate-400 text-center pt-1">
          Tracking berjalan selama aplikasi WFA System ini terbuka (boleh di-minimize). Screenshot
          &amp; activity level otomatis akan menyusul di versi berikutnya.
        </p>
      </div>

      {/* CARD 3: APLIKASI DESKTOP */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <Laptop className="w-4 h-4 text-blue-600" />
          <span>Aplikasi Desktop</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-slate-200/80 rounded-2xl p-6 text-center space-y-3 bg-slate-50/40">
            <div className="w-12 h-12 mx-auto rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
              <Laptop className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Windows / Mac / Linux</h3>
            <p className="text-[11px] text-slate-500">
              Halaman ini bekerja sama persis di dalam aplikasi desktop WFA System — satu aplikasi
              untuk semuanya (absensi, to-do, dan tracking).
            </p>
          </div>
          <div className="border border-slate-200/80 rounded-2xl p-6 text-center space-y-3 bg-slate-50/40 opacity-70">
            <div className="w-12 h-12 mx-auto rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Aplikasi Mobile</h3>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs">
              <Lock className="w-3.5 h-3.5" />
              <span>Segera Hadir</span>
            </span>
          </div>
        </div>
      </div>

      {/* CARD 4: CARA MENGGUNAKAN */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <HelpCircle className="w-4 h-4 text-blue-600" />
          <span>Cara Menggunakan Hubstaff</span>
        </div>

        <ol className="space-y-3.5 text-xs text-slate-700">
          {[
            'Selesaikan absen pagi dan to-do list terlebih dahulu di halaman ini',
            'Tekan "Mulai" untuk memulai time tracking sebelum mengerjakan tugas',
            'Biarkan aplikasi WFA System tetap terbuka selama bekerja (boleh di-minimize)',
            'Tekan "Jeda" saat istirahat, "Lanjut" saat mulai kerja lagi',
            'Tekan "Selesai" saat benar-benar berhenti kerja untuk hari ini',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};
