// WFA System dibungkus jadi aplikasi desktop lewat Tauri. Seluruh fitur (absensi,
// to-do, zoom pagi, performa, teguran, dan time tracking Hubstaff) tetap berjalan
// sebagai satu aplikasi React yang sama — tidak ada logic terpisah di sini.
// Native code (Rust) dipakai untuk membaca idle time sistem (activity level). Screenshot
// belum ada.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

/// Berapa detik sistem operasi tidak menerima input keyboard/mouse dari aplikasi MANA PUN.
/// Dipakai menu Hubstaff untuk mengukur tingkat aktivitas & mendeteksi idle. Yang dibaca
/// hanya "sudah berapa lama tidak ada input" — bukan isi ketikan atau posisi kursor.
#[tauri::command]
fn system_idle_seconds() -> Result<u64, String> {
    user_idle::UserIdle::get_time()
        .map(|idle| idle.as_seconds())
        .map_err(|e| e.to_string())
}

/// Ambil gambar layar (monitor pertama), perkecil, (opsional) buramkan, lalu kembalikan JPEG
/// berformat base64. Dipanggil hanya oleh menu Hubstaff saat timer berjalan dan HRD
/// menyalakan fitur tangkap layar. Pengunggahan dilakukan di sisi JavaScript.
#[tauri::command]
async fn capture_screenshot(max_width: u32, quality: u8, blur: bool) -> Result<String, String> {
    use base64::Engine;
    use image::{codecs::jpeg::JpegEncoder, imageops, imageops::FilterType, DynamicImage};

    tauri::async_runtime::spawn_blocking(move || -> Result<String, String> {
        let monitors = xcap::Monitor::all().map_err(|e| e.to_string())?;
        let monitor = monitors
            .into_iter()
            .next()
            .ok_or_else(|| "Tidak ada layar terdeteksi".to_string())?;
        let mut img = monitor.capture_image().map_err(|e| e.to_string())?;

        if max_width > 0 && img.width() > max_width {
            let h = ((img.height() as u64 * max_width as u64) / img.width() as u64).max(1) as u32;
            img = imageops::resize(&img, max_width, h, FilterType::Triangle);
        }
        if blur {
            img = imageops::blur(&img, 6.0);
        }

        // JPEG tidak mendukung kanal alpha -> ubah ke RGB dulu.
        let rgb = DynamicImage::ImageRgba8(img).into_rgb8();
        let mut buf: Vec<u8> = Vec::new();
        let encoder = JpegEncoder::new_with_quality(&mut buf, quality.clamp(30, 90));
        DynamicImage::ImageRgb8(rgb)
            .write_with_encoder(encoder)
            .map_err(|e| e.to_string())?;
        Ok(base64::engine::general_purpose::STANDARD.encode(&buf))
    })
    .await
    .map_err(|e| e.to_string())?
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![system_idle_seconds, capture_screenshot])
        .run(tauri::generate_context!())
        .expect("error while running WFA System");
}
