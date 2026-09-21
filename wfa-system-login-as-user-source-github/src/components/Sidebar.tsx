import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutGrid,
  Video,
  Eye,
  BarChart2,
  TrendingUp,
  Bell,
  FileSpreadsheet,
  UserCheck,
  CheckSquare,
  Clock,
  CalendarCheck,
  ShieldCheck,
  Briefcase,
  Users,
  Settings,
  Home,
  Check,
  X,
  Play,
  MapPin,
  ListChecks,
  History,
  AlertTriangle
} from 'lucide-react';

export type SidebarMenuId =
  | 'dashboard-tim'
  | 'zoom-pagi'
  | 'monitor-todo'
  | 'rekap-absensi-tim'
  | 'performa-tim'
  | 'kirim-teguran'
  | 'laporan-tim'
  | 'akun-saya'
  // Menu Karyawan (Sesuai Persis Screenshot User)
  | 'beranda-saya'
  | 'absensi-gps'
  | 'todo-saya'
  | 'hubstaff'
  | 'notifikasi'
  | 'performa-saya'
  | 'riwayat-absen'
  | 'pelanggaran-saya'
  | 'absen-harian'
  // Menu HRD
  | 'dashboard-hrd'
  | 'rekap-global'
  | 'analisis-performa'
  | 'pengaturan-wfa'
  | 'manajemen-akun';

interface SidebarProps {
  activeMenu: SidebarMenuId;
  onSelectMenu: (menuId: SidebarMenuId) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeMenu,
  onSelectMenu,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { currentUser, entries, selectedDate, warnings } = useApp();

  // Menghitung badge untuk Monitor To-Do List
  const dayEntries = entries.filter((e) => e.date === selectedDate);
  const pendingReviewCount = dayEntries.filter((e) => e.status === 'siang_selesai').length;
  const activeWarningsCount = warnings.length;

  const handleItemClick = (menuId: SidebarMenuId) => {
    onSelectMenu(menuId);
    if (isOpenMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out select-none ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Brand Header (Mirip persis dengan screenshot pengguna!) */}
        <div className="bg-[#004080] px-4 py-3.5 flex items-center justify-between text-white shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            {/* White rounded square logo with blue home check icon */}
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
              <div className="relative flex items-center justify-center">
                <Home className="w-5 h-5 text-[#0060b5]" />
                <span className="absolute -bottom-1 -right-1 bg-sky-500 text-white rounded-full p-0.5 ring-1 ring-white">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
              </div>
            </div>
            <div>
              <h1 className="font-extrabold text-white text-base tracking-tight leading-tight">
                WFA System
              </h1>
              <p className="text-xs font-semibold text-sky-400 tracking-normal leading-none mt-0.5">
                Luzie Group
              </p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-slate-200"
            title="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-5 text-sm">
          {/* ============================================================ */}
          {/* LEADER / KOORDINATOR MENU (PERSIS SEPERTI SCREENSHOT USER!) */}
          {/* ============================================================ */}
          {currentUser.role === 'leader' && (
            <>
              {/* SECTION: MENU UTAMA */}
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
                  MENU UTAMA
                </div>
                <div className="space-y-1">
                  {/* 1. Dashboard Tim */}
                  <button
                    id="menu-dashboard-tim"
                    onClick={() => handleItemClick('dashboard-tim')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all text-left ${
                      activeMenu === 'dashboard-tim'
                        ? 'bg-[#e0f2fe] text-[#0369a1] font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <LayoutGrid
                      className={`w-4 h-4 shrink-0 ${
                        activeMenu === 'dashboard-tim' ? 'text-[#0284c7]' : 'text-slate-500'
                      }`}
                    />
                    <span className="flex-1">Dashboard Tim</span>
                  </button>

                  {/* 2. Zoom Pagi */}
                  <button
                    id="menu-zoom-pagi"
                    onClick={() => handleItemClick('zoom-pagi')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all text-left ${
                      activeMenu === 'zoom-pagi'
                        ? 'bg-[#e0f2fe] text-[#0369a1] font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <Video
                      className={`w-4 h-4 shrink-0 ${
                        activeMenu === 'zoom-pagi' ? 'text-[#0284c7]' : 'text-slate-500'
                      }`}
                    />
                    <span className="flex-1">Zoom Pagi</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </button>

                  {/* 3. Monitor To-Do List (ACTIVE SEPERTI DI GAMBAR USER!) */}
                  <button
                    id="menu-monitor-todo"
                    onClick={() => handleItemClick('monitor-todo')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-all text-left ${
                      activeMenu === 'monitor-todo'
                        ? 'bg-[#e0f2fe] text-[#0369a1] font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-semibold'
                    }`}
                  >
                    <Eye
                      className={`w-4 h-4 shrink-0 ${
                        activeMenu === 'monitor-todo' ? 'text-[#0284c7]' : 'text-slate-500'
                      }`}
                    />
                    <span className="flex-1">Monitor To-Do List</span>
                    {pendingReviewCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full">
                        {pendingReviewCount}
                      </span>
                    )}
                  </button>

                  {/* 4. Rekap Absensi Tim */}
                  <button
                    id="menu-rekap-absensi-tim"
                    onClick={() => handleItemClick('rekap-absensi-tim')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all text-left ${
                      activeMenu === 'rekap-absensi-tim'
                        ? 'bg-[#e0f2fe] text-[#0369a1] font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <BarChart2
                      className={`w-4 h-4 shrink-0 ${
                        activeMenu === 'rekap-absensi-tim' ? 'text-[#0284c7]' : 'text-slate-500'
                      }`}
                    />
                    <span className="flex-1">Rekap Absensi Tim</span>
                  </button>

                  {/* 5. Performa Tim */}
                  <button
                    id="menu-performa-tim"
                    onClick={() => handleItemClick('performa-tim')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all text-left ${
                      activeMenu === 'performa-tim'
                        ? 'bg-[#e0f2fe] text-[#0369a1] font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <TrendingUp
                      className={`w-4 h-4 shrink-0 ${
                        activeMenu === 'performa-tim' ? 'text-[#0284c7]' : 'text-slate-500'
                      }`}
                    />
                    <span className="flex-1">Performa Tim</span>
                  </button>
                </div>
              </div>

              {/* SECTION: TINDAKAN */}
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
                  TINDAKAN
                </div>
                <div className="space-y-1">
                  {/* 6. Kirim Teguran */}
                  <button
                    id="menu-kirim-teguran"
                    onClick={() => handleItemClick('kirim-teguran')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all text-left ${
                      activeMenu === 'kirim-teguran'
                        ? 'bg-[#e0f2fe] text-[#0369a1] font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <Bell
                      className={`w-4 h-4 shrink-0 ${
                        activeMenu === 'kirim-teguran' ? 'text-[#0284c7]' : 'text-slate-500'
                      }`}
                    />
                    <span className="flex-1">Kirim Teguran</span>
                    {activeWarningsCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded-full">
                        {activeWarningsCount}
                      </span>
                    )}
                  </button>

                  {/* 7. Laporan Tim */}
                  <button
                    id="menu-laporan-tim"
                    onClick={() => handleItemClick('laporan-tim')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all text-left ${
                      activeMenu === 'laporan-tim'
                        ? 'bg-[#e0f2fe] text-[#0369a1] font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <FileSpreadsheet
                      className={`w-4 h-4 shrink-0 ${
                        activeMenu === 'laporan-tim' ? 'text-[#0284c7]' : 'text-slate-500'
                      }`}
                    />
                    <span className="flex-1">Laporan Tim</span>
                  </button>
                </div>
              </div>

              {/* SECTION: AKUN */}
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
                  AKUN
                </div>
                <div className="space-y-1">
                  {/* 8. Akun Saya */}
                  <button
                    id="menu-akun-saya"
                    onClick={() => handleItemClick('akun-saya')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all text-left ${
                      activeMenu === 'akun-saya'
                        ? 'bg-[#e0f2fe] text-[#0369a1] font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <UserCheck
                      className={`w-4 h-4 shrink-0 ${
                        activeMenu === 'akun-saya' ? 'text-[#0284c7]' : 'text-slate-500'
                      }`}
                    />
                    <span className="flex-1">Akun Saya</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ============================================================ */}
          {/* KARYAWAN MENU (PERSIS SEPERTI SCREENSHOT USER!) */}
          {/* ============================================================ */}
          {currentUser.role === 'karyawan' && (
            <>
              {/* SECTION: MENU UTAMA */}
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
                  MENU UTAMA
                </div>
                <div className="space-y-1">
                  {/* 1. Beranda Saya */}
                  <button
                    id="menu-kary-beranda"
                    onClick={() => handleItemClick('beranda-saya')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all text-left ${
                      activeMenu === 'beranda-saya'
                        ? 'bg-[#e0f2fe] text-[#0369a1] font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <Home
                      className={`w-4 h-4 shrink-0 ${
                        activeMenu === 'beranda-saya' ? 'text-[#0284c7]' : 'text-slate-500'
                      }`}
                    />
                    <span className="flex-1">Beranda Saya</span>
                  </button>

                  {/* 2. Absensi + GPS */}
                  <button
                    id="menu-kary-absensi-gps"
                    onClick={() => handleItemClick('absensi-gps')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all text-left ${
                      activeMenu === 'absensi-gps' || activeMenu === 'absen-harian'
                        ? 'bg-[#e0f2fe] text-[#0369a1] font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <MapPin
                      className={`w-4 h-4 shrink-0 ${
                        activeMenu === 'absensi-gps' || activeMenu === 'absen-harian'
                          ? 'text-[#0284c7]'
                          : 'text-slate-500'
                      }`}
                    />
                    <span className="flex-1">Absensi + GPS</span>
                  </button>

                  {/* 3. To-Do List */}
                  <button
                    id="menu-kary-todo"
                    onClick={() => handleItemClick('todo-saya')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all text-left ${
                      activeMenu === 'todo-saya'
                        ? 'bg-[#e0f2fe] text-[#0369a1] font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <ListChecks
                      className={`w-4 h-4 shrink-0 ${
                        activeMenu === 'todo-saya' ? 'text-[#0284c7]' : 'text-slate-500'
                      }`}
                    />
                    <span className="flex-1">To-Do List</span>
                  </button>

                  {/* 4. Hubstaff (SESUAI LOGO PLAY PADA GAMBAR) */}
                  <button
                    id="menu-kary-hubstaff"
                    onClick={() => handleItemClick('hubstaff')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all text-left ${
                      activeMenu === 'hubstaff'
                        ? 'bg-[#e0f2fe] text-[#0369a1] font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <Play
                      className={`w-4 h-4 shrink-0 fill-current ${
                        activeMenu === 'hubstaff' ? 'text-[#0284c7]' : 'text-slate-500'
                      }`}
                    />
                    <span className="flex-1">Hubstaff</span>
                  </button>
                </div>
              </div>

              {/* SECTION: INFORMASI */}
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
                  INFORMASI
                </div>
                <div className="space-y-1">
                  {/* 5. Notifikasi */}
                  <button
                    id="menu-kary-notifikasi"
                    onClick={() => handleItemClick('notifikasi')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all text-left ${
                      activeMenu === 'notifikasi'
                        ? 'bg-[#e0f2fe] text-[#0369a1] font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <Bell
                      className={`w-4 h-4 shrink-0 ${
                        activeMenu === 'notifikasi' ? 'text-[#0284c7]' : 'text-slate-500'
                      }`}
                    />
                    <span className="flex-1">Notifikasi</span>
                  </button>

                  {/* 6. Performa Saya */}
                  <button
                    id="menu-kary-performa"
                    onClick={() => handleItemClick('performa-saya')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all text-left ${
                      activeMenu === 'performa-saya'
                        ? 'bg-[#e0f2fe] text-[#0369a1] font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <TrendingUp
                      className={`w-4 h-4 shrink-0 ${
                        activeMenu === 'performa-saya' ? 'text-[#0284c7]' : 'text-slate-500'
                      }`}
                    />
                    <span className="flex-1">Performa Saya</span>
                  </button>

                  {/* 7. Riwayat Absen */}
                  <button
                    id="menu-kary-riwayat"
                    onClick={() => handleItemClick('riwayat-absen')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all text-left ${
                      activeMenu === 'riwayat-absen'
                        ? 'bg-[#e0f2fe] text-[#0369a1] font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <History
                      className={`w-4 h-4 shrink-0 ${
                        activeMenu === 'riwayat-absen' ? 'text-[#0284c7]' : 'text-slate-500'
                      }`}
                    />
                    <span className="flex-1">Riwayat Absen</span>
                  </button>

                  {/* 8. Pelanggaran Saya */}
                  <button
                    id="menu-kary-pelanggaran"
                    onClick={() => handleItemClick('pelanggaran-saya')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all text-left ${
                      activeMenu === 'pelanggaran-saya'
                        ? 'bg-[#e0f2fe] text-[#0369a1] font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <AlertTriangle
                      className={`w-4 h-4 shrink-0 ${
                        activeMenu === 'pelanggaran-saya' ? 'text-[#0284c7]' : 'text-slate-500'
                      }`}
                    />
                    <span className="flex-1">Pelanggaran Saya</span>
                  </button>
                </div>
              </div>

              {/* SECTION: AKUN */}
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
                  AKUN
                </div>
                <div className="space-y-1">
                  {/* 9. Akun Saya */}
                  <button
                    id="menu-kary-akun"
                    onClick={() => handleItemClick('akun-saya')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all text-left ${
                      activeMenu === 'akun-saya'
                        ? 'bg-[#e0f2fe] text-[#0369a1] font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <UserCheck
                      className={`w-4 h-4 shrink-0 ${
                        activeMenu === 'akun-saya' ? 'text-[#0284c7]' : 'text-slate-500'
                      }`}
                    />
                    <span className="flex-1">Akun Saya</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ============================================================ */}
          {/* HRD MENU */}
          {/* ============================================================ */}
          {currentUser.role === 'hrd' && (
            <>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
                  MENU UTAMA
                </div>
                <div className="space-y-1">
                  <button
                    id="menu-hrd-dash"
                    onClick={() => handleItemClick('dashboard-hrd')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all text-left ${
                      activeMenu === 'dashboard-hrd'
                        ? 'bg-[#e0f2fe] text-[#0369a1] font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4 text-sky-600 shrink-0" />
                    <span className="flex-1">Dashboard HRD</span>
                  </button>

                  <button
                    id="menu-hrd-rekap"
                    onClick={() => handleItemClick('rekap-global')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all text-left ${
                      activeMenu === 'rekap-global'
                        ? 'bg-[#e0f2fe] text-[#0369a1] font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <BarChart2 className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="flex-1">Rekap Absensi Global</span>
                  </button>

                  <button
                    id="menu-hrd-analisis"
                    onClick={() => handleItemClick('analisis-performa')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all text-left ${
                      activeMenu === 'analisis-performa'
                        ? 'bg-[#e0f2fe] text-[#0369a1] font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="flex-1">Analisis Performa Tim</span>
                  </button>
                </div>
              </div>

              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
                  PENGATURAN
                </div>
                <div className="space-y-1">
                  <button
                    id="menu-hrd-pengaturan"
                    onClick={() => handleItemClick('pengaturan-wfa')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all text-left ${
                      activeMenu === 'pengaturan-wfa'
                        ? 'bg-[#e0f2fe] text-[#0369a1] font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <Settings className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="flex-1">Pengaturan WFA</span>
                  </button>

                  <button
                    id="menu-hrd-manajemen"
                    onClick={() => handleItemClick('manajemen-akun')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all text-left ${
                      activeMenu === 'manajemen-akun'
                        ? 'bg-[#e0f2fe] text-[#0369a1] font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <Users className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="flex-1">Manajemen Akun</span>
                  </button>
                </div>
              </div>

              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
                  AKUN
                </div>
                <div className="space-y-1">
                  <button
                    id="menu-hrd-akun"
                    onClick={() => handleItemClick('akun-saya')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all text-left ${
                      activeMenu === 'akun-saya'
                        ? 'bg-[#e0f2fe] text-[#0369a1] font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="flex-1">Akun Saya</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Bottom User Card in Sidebar */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-9 h-9 rounded-full object-cover border border-slate-300 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 truncate leading-tight">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-slate-500 truncate leading-tight mt-0.5">
                {currentUser.division}
              </p>
            </div>
            <span
              className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                currentUser.role === 'leader'
                  ? 'bg-amber-100 text-amber-800'
                  : currentUser.role === 'hrd'
                  ? 'bg-sky-100 text-sky-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {currentUser.role}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
