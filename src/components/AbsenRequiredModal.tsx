import React from 'react';
import { AlertTriangle, MapPin, X, Video, ArrowRight, ShieldAlert } from 'lucide-react';
import { ZoomMeetingInfo } from '../types';
import { SidebarMenuId } from './Sidebar';

interface AbsenRequiredModalProps {
  isOpen: boolean;
  meeting: ZoomMeetingInfo | null;
  userName: string;
  onClose: () => void;
  onNavigateToAbsensi: () => void;
}

export const AbsenRequiredModal: React.FC<AbsenRequiredModalProps> = ({
  isOpen,
  meeting,
  userName,
  onClose,
  onNavigateToAbsensi,
}) => {
  if (!isOpen || !meeting) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden p-6 space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header with Warning Icon */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 shadow-xs border border-amber-200">
              <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                Wajib Absen Pagi Terlebih Dahulu
              </h3>
              <p className="text-xs text-amber-700 font-semibold mt-0.5">
                Verifikasi kehadiran WFA sebelum gabung Zoom
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Body */}
        <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
          <p>
            Halo, <strong className="text-slate-800">{userName}</strong>! Anda belum tercatat melakukan <strong>Absen Pagi</strong> hari ini.
          </p>
          <p className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3.5 text-amber-900">
            Sesuai Standar Operasional Prosedur (SOP) WFA Luzie Group, setiap karyawan wajib melakukan <strong>Absen Pagi + Verifikasi GPS</strong> sebelum dapat bergabung ke ruang Zoom koordinasi tim.
          </p>

          {/* Meeting Summary Box */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
              <Video className="w-3.5 h-3.5 text-blue-600" />
              <span>{meeting.title}</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Jadwal: {meeting.date} &bull; {meeting.time} WIB &bull; Host: {meeting.hostName}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigateToAbsensi();
            }}
            className="px-5 py-2.5 rounded-xl bg-[#0066b2] hover:bg-[#005594] text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors"
          >
            <MapPin className="w-4 h-4" />
            <span>Absen Pagi Sekarang</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
