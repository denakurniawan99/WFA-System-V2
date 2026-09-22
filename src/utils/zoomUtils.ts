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
 * Menghapus/menyaring meeting yang sudah lewat waktunya atau sudah ganti hari.
 * Hanya menampilkan meeting hari ini yang masih aktif atau meeting mendatang.
 */
export function getActiveZoomMeetingsForEmployee(
  meetings: ZoomMeetingInfo[],
  todayStr: string = getTodayDateString()
): ZoomMeetingInfo[] {
  return meetings.filter((meeting) => {
    // Jika sudah lewat waktunya atau ganti hari, hapus dari karyawan
    if (isZoomMeetingExpired(meeting, todayStr)) {
      return false;
    }
    // Hanya tampilkan meeting hari ini atau hari mendatang yang masih aktif
    return meeting.date >= todayStr && meeting.status === 'aktif';
  });
}
