// WFA System dibungkus jadi aplikasi desktop lewat Tauri. Seluruh fitur (absensi,
// to-do, zoom pagi, performa, teguran, dan time tracking Hubstaff) tetap berjalan
// sebagai satu aplikasi React yang sama — tidak ada logic terpisah di sini.
// Native code (Rust) baru dipakai serius nanti untuk fitur screenshot & activity
// level, karena itu butuh akses sistem yang tidak tersedia di webview biasa.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running WFA System");
}
