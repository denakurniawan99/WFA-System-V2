import React, { useEffect, useRef, useState } from 'react';
import { Camera, KeyRound, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dbRef, get } from '../lib/firebase';
import { fetchScreenshot, VIEW_KEY_STORAGE } from '../lib/screenshotClient';
import { ScreenshotRecord, User } from '../types';

const safeKey = (s: string) => s.replace(/[.#$\[\]/]/g, '_');

const Thumb: React.FC<{ rec: ScreenshotRecord; viewKey: string; scriptUrl: string; onOpen: (src: string) => void; onAuthError: () => void }> = ({
  rec,
  viewKey,
  scriptUrl,
  onOpen,
  onAuthError,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => entries[0].isIntersecting && setVisible(true), { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || src || err) return;
    let cancelled = false;
    fetchScreenshot({ screenshotScriptUrl: scriptUrl }, viewKey, rec.fileId)
      .then((s) => !cancelled && setSrc(s))
      .catch((e: Error) => {
        if (cancelled) return;
        setErr(e.message);
        if (/kunci/i.test(e.message)) onAuthError();
      });
    return () => { cancelled = true; };
  }, [visible, src, err, viewKey, scriptUrl, rec.fileId, onAuthError]);

  const time = new Date(rec.ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  return (
    <div ref={ref} className="space-y-1">
      <button
        type="button"
        disabled={!src}
        onClick={() => src && onOpen(src)}
        className="block w-full aspect-video rounded-lg border border-slate-200 bg-slate-100 overflow-hidden text-[10px] text-slate-400 flex items-center justify-center"
      >
        {src ? <img src={src} alt={`Tangkap layar ${time}`} className="w-full h-full object-cover" /> : err ? (err === 'not_found' ? 'Sudah dihapus' : 'Gagal dimuat') : 'Memuat...'}
      </button>
      <div className="text-[10px] font-semibold text-slate-600 text-center">{time}{rec.blurred ? ' • buram' : ''}</div>
    </div>
  );
};

export const ScreenshotViewerModal: React.FC<{ member: User; date: string; onClose: () => void }> = ({ member, date, onClose }) => {
  const { hubstaffSettings } = useApp();
  const [records, setRecords] = useState<ScreenshotRecord[] | null>(null);
  const [viewKey, setViewKey] = useState(() => {
    try { return localStorage.getItem(VIEW_KEY_STORAGE) || ''; } catch { return ''; }
  });
  const [keyInput, setKeyInput] = useState('');
  const [big, setBig] = useState<string | null>(null);

  useEffect(() => {
    get(dbRef(`screenshots/${date}/${safeKey(member.id)}`))
      .then((snap) => {
        const val = (snap.val() || {}) as Record<string, ScreenshotRecord>;
        setRecords(Object.values(val).sort((a, b) => a.ts - b.ts));
      })
      .catch(() => setRecords([]));
  }, [date, member.id]);

  const saveKey = () => {
    const k = keyInput.trim();
    if (!k) return;
    try { localStorage.setItem(VIEW_KEY_STORAGE, k); } catch { /* abaikan */ }
    setViewKey(k);
  };
  const resetKey = React.useCallback(() => {
    try { localStorage.removeItem(VIEW_KEY_STORAGE); } catch { /* abaikan */ }
    setViewKey('');
  }, []);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <Camera className="w-4 h-4 text-blue-600" />
            <span>Tangkap Layar &mdash; {member.name} &bull; {date}</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Tutup"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {!viewKey ? (
            <div className="max-w-md mx-auto space-y-3 text-center py-6">
              <KeyRound className="w-8 h-8 text-blue-600 mx-auto" />
              <p className="text-xs text-slate-600 leading-relaxed">
                Masukkan <span className="font-bold">kunci lihat</span> dari script Google Drive. Kunci ini hanya disimpan di
                browser/aplikasi Anda, tidak di database. Tanyakan ke HRD bila belum punya.
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveKey()}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  placeholder="Kunci lihat"
                />
                <button onClick={saveKey} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold">Simpan</button>
              </div>
            </div>
          ) : records === null ? (
            <div className="text-center text-xs text-slate-400 py-12">Memuat daftar...</div>
          ) : records.length === 0 ? (
            <div className="text-center text-xs text-slate-400 py-12">Belum ada tangkap layar pada tanggal ini.</div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {records.map((r) => (
                  <Thumb key={r.ts} rec={r} viewKey={viewKey} scriptUrl={hubstaffSettings.screenshotScriptUrl} onOpen={setBig} onAuthError={resetKey} />
                ))}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>{records.length} tangkapan</span>
                <button onClick={resetKey} className="underline hover:text-slate-600">Ganti kunci lihat</button>
              </div>
            </>
          )}
        </div>
      </div>

      {big && (
        <div className="fixed inset-0 z-[80] bg-black/80 flex items-center justify-center p-4" onClick={() => setBig(null)}>
          <img src={big} alt="Tangkap layar" className="max-w-full max-h-full rounded-lg" />
        </div>
      )}
    </div>
  );
};
