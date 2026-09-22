import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { AlertTriangle, Video, MapPin, CheckCheck, X, Clock, ArrowRight } from 'lucide-react';
import { SidebarMenuId } from './Sidebar';

interface StartupNotificationModalProps {
  onNavigate: (menu: SidebarMenuId) => void;
}

/**
 * Popup yang muncul di awal (begitu karyawan login / membuka aplikasi) untuk:
 * 1. Teguran yang belum dibaca -> wajib ditandai "Sudah Saya Baca" dulu (memastikan sudah dibaca).
 * 2. Jadwal Zoom hari ini yang jatuh sebelum karyawan absen pagi -> langsung diarahkan ke halaman Absen.
 *
 * Hanya berlaku untuk role karyawan, dan hanya tampil sekali per sesi login (per tanggal berjalan).
 */
export const StartupNotificationModal: React.FC<StartupNotificationModalProps> = ({ onNavigate }) => {
  const { currentUser, warnings, zoomMeetings, entries, selectedDate, markWarningRead } = useApp();

  const [step, setStep] = useState<'teguran' | 'zoom' | null>(null);
  const [dismissedKey, setDismissedKey] = useState<string>('');

  // Teguran yang dikirim ke karyawan ini dan belum ditandai dibaca
  const unreadWarnings = useMemo(
    () =>
      warnings.filter(
        (w) =>
          (w.recipientId === currentUser.id || w.recipientName === currentUser.name) && w.status === 'terkirim'
      ),
    [warnings, currentUser.id, currentUser.name]
  );

  // Entri absensi karyawan ini untuk hari ini
  const myTodayEntry = useMemo(
    () => entries.find((e) => e.userId === currentUser.id && e.date === selectedDate),
    [entries, currentUser.id, selectedDate]
  );
  const hasAbsenPagi = !!myTodayEntry?.absenPagi;

  // Zoom meeting aktif hari ini (belum selesai/dibatalkan)
  const todayZoomMeetings = useMemo(
    () => zoomMeetings.filter((z) => z.date === selectedDate && z.status === 'aktif'),
    [zoomMeetings, selectedDate]
  );
  const nextZoomMeeting = todayZoomMeetings[0];

  const storageKey = `wfa_startup_notif_seen_${currentUser.id}_${selectedDate}`;

  // Tentukan langkah awal: 1x per login/hari, hanya untuk karyawan
  useEffect(() => {
    if (currentUser.role !== 'karyawan') return;

    let alreadySeen = false;
    try {
      alreadySeen = sessionStorage.getItem(storageKey) === '1';
    } catch {
      alreadySeen = false;
    }

    if (unreadWarnings.length > 0) {
      setStep('teguran');
    } else if (!alreadySeen && nextZoomMeeting && !hasAbsenPagi) {
      setStep('zoom');
    } else {
      setStep(null);
    }
    // Sengaja hanya bergantung pada user & tanggal supaya modal tidak muncul berulang
    // setiap kali data lain (mis. toast) berubah selama sesi berjalan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.id, currentUser.role, selectedDate]);

  const markSessionSeen = () => {
    try {
      sessionStorage.setItem(storageKey, '1');
    } catch {
      // abaikan jika sessionStorage tidak tersedia
    }
  };

  const goToNextStepAfterTeguran = () => {
    let alreadySeenZoom = false;
    try {
      alreadySeenZoom = sessionStorage.getItem(storageKey) === '1';
    } catch {
      alreadySeenZoom = false;
    }

    if (!alreadySeenZoom && nextZoomMeeting && !hasAbsenPagi) {
      setStep('zoom');
    } else {
      setStep(null);
    }
  };

  const handleReadAllWarnings = () => {
    unreadWarnings.forEach((w) => markWarningRead(w.id));
    goToNextStepAfterTeguran();
  };

  const handleCloseZoom = () => {
    markSessionSeen();
    setStep(null);
  };

  const handleGoAbsen = () => {
    markSessionSeen();
    setStep(null);
    onNavigate('absensi-gps');
  };

  if (currentUser.role !== 'karyawan' || step === null) return null;

  return (
    <div
      id="startup-notification-backdrop"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      {step === 'teguran' && (
        <div className="relative max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-rose-200">
          <div className="bg-gradient-to-r from-rose-600 to-rose-500 px-5 py-4 text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm">
                {unreadWarnings.length} Teguran Baru Untuk Anda
              </h3>
              <p className="text-[11px] text-rose-100/90 mt-0.5">
                Mohon dibaca terlebih dahulu sebelum melanjutkan
              </p>
            </div>
          </div>

          <div className="p-5 space-y-3 max-h-[50vh] overflow-y-auto">
            {unreadWarnings.map((w) => (
              <div key={w.id} className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/60">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-rose-800">{w.title}</span>
                  <span className="text-[10px] text-rose-500 shrink-0">{w.date} &bull; {w.createdAt}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{w.message}</p>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Dari: <strong className="text-slate-600">{w.senderName}</strong>
                </p>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50/70">
            <button
              onClick={handleReadAllWarnings}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-sm"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Saya Sudah Membaca {unreadWarnings.length > 1 ? 'Semua Teguran' : 'Teguran Ini'}</span>
            </button>
          </div>
        </div>
      )}

      {step === 'zoom' && nextZoomMeeting && (
        <div className="relative max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-sky-200">
          <button
            onClick={handleCloseZoom}
            className="absolute top-3 right-3 p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 z-10"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="bg-gradient-to-r from-[#004080] to-[#0060b5] px-5 py-4 text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm">
                {nextZoomMeeting.isUrgent ? '🚨 Zoom Urgen Hari Ini' : 'Ada Jadwal Zoom Hari Ini'}
              </h3>
              <p className="text-[11px] text-sky-100/90 mt-0.5">{nextZoomMeeting.title}</p>
            </div>
          </div>

          <div className="p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Clock className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span>
                Pukul <strong className="text-slate-800">{nextZoomMeeting.time} WIB</strong> &bull; Host:{' '}
                <strong className="text-slate-800">{nextZoomMeeting.hostName || 'Koordinator Tim'}</strong>
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                Anda <strong>belum melakukan absen pagi</strong> hari ini. Lakukan absen dahulu sebelum bergabung ke
                meeting Zoom.
              </p>
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center gap-2">
            <button
              onClick={handleCloseZoom}
              className="px-4 py-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs transition-colors"
            >
              Nanti Saja
            </button>
            <button
              onClick={handleGoAbsen}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#004080] hover:bg-[#0060b5] text-white font-bold text-xs transition-colors shadow-sm"
            >
              <span>Absen Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
