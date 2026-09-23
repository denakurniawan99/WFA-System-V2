import { ZoomMeetingInfo } from '../types';
import { getTodayDateString } from '../data/initialData';

/**
 * Memeriksa apakah sebuah Zoom Meeting sudah lewat waktunya atau sudah berganti hari.
 * Aturan:
 * 1. Jika tanggal meeting < tanggal hari ini (ganti hari / masa lalu) -> EXPIRED (true)
 * 2. Jika status meeting adalah 'selesai' atau 'dibatalkan' -> EXPIRED (true)
 * 3. Jika tanggal meeting == hari ini, cek apakah jam mulai + durasi + toleransi telah terlewat -> EXPIRED (true)
 */
export function isZoomMeetingExpired(
  meeting: ZoomMeetingInfo,
  todayStr: string = getTodayDateString()
): boolean {
  // 1. Ganti hari (tanggal sudah lewat)
  if (meeting.date < todayStr) {
    return true;
  }

  // 2. Status selesai atau dibatalkan oleh leader
  if (meeting.status === 'selesai' || meeting.status === 'dibatalkan') {
    return true;
  }

  // 3. Jika hari ini, periksa waktu meeting
  if (meeting.date === todayStr) {
    const now = new Date();
    const parts = meeting.time.split(':').map(Number);
    if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      const [startHour, startMin] = parts;
      const durationMinutes = meeting.duration || 60;
      
      // Waktu selesai meeting dalam total menit hari ini
      const endTotalMinutes = startHour * 60 + startMin + durationMinutes;
      const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

      // Toleransi 20 menit setelah durasi meeting selesai
      if (currentTotalMinutes > endTotalMinutes + 20) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Filter Zoom Meeting untuk tampilan Karyawan:
 * Menghapus/menyaring meeting yang sudah lewat waktunya atau sudah ganti hari,
 * DAN hanya meeting yang dibuat oleh koordinator/leader karyawan itu sendiri
 * (supaya notifikasi Zoom tim lain tidak bocor ke karyawan yang bukan anggotanya).
 */
export function getActiveZoomMeetingsForEmployee(
  meetings: ZoomMeetingInfo[],
  employeeLeaderId: string,
  todayStr: string = getTodayDateString()
): ZoomMeetingInfo[] {
  return meetings.filter((meeting) => {
    // Hanya meeting milik koordinator/leader karyawan ini
    if (!employeeLeaderId || meeting.leaderId !== employeeLeaderId) {
      return false;
    }
    // Jika sudah lewat waktunya atau ganti hari, hapus dari karyawan
    if (isZoomMeetingExpired(meeting, todayStr)) {
      return false;
    }
    // Hanya tampilkan meeting hari ini atau hari mendatang yang masih aktif
    return meeting.date >= todayStr && meeting.status === 'aktif';
  });
}

export interface SessionComplianceStatus {
  scheduled: boolean;
  hasPhotoProof: boolean;
  meeting: ZoomMeetingInfo | null;
}

export interface DailyMeetComplianceStatus {
  pagi: SessionComplianceStatus;
  siang: SessionComplianceStatus;
}

/**
 * Status kepatuhan laporan Meet harian seorang koordinator: apakah sesi Pagi & Siang/Sore
 * hari ini sudah dijadwalkan, dan apakah sudah ada bukti foto sebagai laporannya.
 * Dipakai untuk mengingatkan leader supaya konsisten bikin jadwal + upload bukti tiap hari.
 */
export function getDailyMeetCompliance(
  meetings: ZoomMeetingInfo[],
  leaderId: string,
  todayStr: string = getTodayDateString()
): DailyMeetComplianceStatus {
  const todaysMeetings = meetings.filter((m) => m.leaderId === leaderId && m.date === todayStr);

  const buildStatus = (session: 'pagi' | 'siang'): SessionComplianceStatus => {
    // Kalau ada lebih dari satu, ambil yang paling baru dibuat (id berisi timestamp)
    const found = todaysMeetings
      .filter((m) => m.session === session)
      .sort((a, b) => b.id.localeCompare(a.id))[0];
    return {
      scheduled: !!found,
      hasPhotoProof: !!found && found.photos.length > 0,
      meeting: found || null,
    };
  };

  return { pagi: buildStatus('pagi'), siang: buildStatus('siang') };
}
