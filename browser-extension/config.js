/**
 * Ganti dua nilai ini sesuai project Firebase Anda (sama seperti di src/lib/firebase.ts
 * pada aplikasi utama). Setelah diubah, muat ulang ekstensi di chrome://extensions.
 */
const WFA_CONFIG = {
  DATABASE_URL: 'https://wfa-system-v3-default-rtdb.asia-southeast1.firebasedatabase.app',
  DB_ROOT: 'luzie-react',
  /**
   * Alamat web WFA System. Diisi SEKALI oleh admin/IT di file ini sebelum dibagikan ke
   * karyawan, supaya tiap karyawan yang memuat ekstensi ini TIDAK perlu mengisi apa pun lagi
   * di halaman Opsi — tinggal muat ekstensinya, langsung otomatis tersambung.
   * Kalau nanti pindah hosting, karyawan yang SUDAH terpasang tetap bisa diperbarui manual
   * lewat halaman Opsi (tidak perlu pasang ulang), tapi karyawan yang BELUM pasang akan
   * langsung dapat alamat baru ini kalau filenya diperbarui sebelum dibagikan.
   */
  DEFAULT_APP_ORIGIN: 'https://wfa-system-v2-nine.vercel.app',
};
