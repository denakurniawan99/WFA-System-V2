import { HubstaffSettings } from '../types';

type ScriptCfg = Pick<HubstaffSettings, 'screenshotScriptUrl'>;

/** Apps Script menolak preflight CORS -> kirim sebagai text/plain (request "sederhana"). */
async function callScript<T>(url: string, payload: Record<string, unknown>): Promise<T> {
  const res = await fetch(url.trim(), {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as { ok: boolean; error?: string } & T;
  if (!json.ok) throw new Error(json.error || 'Ditolak oleh script');
  return json;
}

export const uploadScreenshot = async (
  cfg: ScriptCfg & Pick<HubstaffSettings, 'screenshotUploadKey' | 'screenshotRetentionDays'>,
  p: { userId: string; userName: string; date: string; ts: number; image: string }
): Promise<string> => {
  const r = await callScript<{ fileId: string }>(cfg.screenshotScriptUrl, {
    action: 'upload',
    key: cfg.screenshotUploadKey,
    retentionDays: cfg.screenshotRetentionDays,
    ...p,
  });
  return r.fileId;
};

export const pingScript = (cfg: ScriptCfg & Pick<HubstaffSettings, 'screenshotUploadKey'>) =>
  callScript<{ folder: string }>(cfg.screenshotScriptUrl, { action: 'ping', key: cfg.screenshotUploadKey });

// Membatasi unduhan gambar bersamaan (Apps Script punya batas permintaan simultan).
let running = 0;
const waiters: Array<() => void> = [];
const acquire = () =>
  new Promise<void>((resolve) => {
    if (running < 3) {
      running++;
      resolve();
    } else waiters.push(() => { running++; resolve(); });
  });
const release = () => {
  running--;
  waiters.shift()?.();
};

/** Ambil satu gambar dari Drive sebagai data URL. Butuh kunci LIHAT (tidak disimpan di Firebase). */
export const fetchScreenshot = async (cfg: ScriptCfg, viewKey: string, fileId: string): Promise<string> => {
  await acquire();
  try {
    const r = await callScript<{ image: string }>(cfg.screenshotScriptUrl, { action: 'get', key: viewKey, fileId });
    return `data:image/jpeg;base64,${r.image}`;
  } finally {
    release();
  }
};

export const VIEW_KEY_STORAGE = 'wfa_screenshot_view_key';
