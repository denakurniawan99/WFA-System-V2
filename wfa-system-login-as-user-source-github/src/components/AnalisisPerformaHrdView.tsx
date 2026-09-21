import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  TrendingUp,
  Award,
  Users,
  Building2,
  CheckCircle2,
  BarChart3,
  PieChart as PieChartIcon,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

export const AnalisisPerformaHrdView: React.FC = () => {
  const { entries, allUsers } = useApp();

  const employees = useMemo(() => allUsers.filter((u) => u.role === 'karyawan'), [allUsers]);
  const divisions = useMemo(() => Array.from(new Set(allUsers.map((u) => u.division))), [allUsers]);

  // Statistik per Divisi
  const divisionStats = useMemo(() => {
    return divisions.map((div) => {
      const divEntries = entries.filter((e) => e.division === div);
      const totalEntries = divEntries.length;

      let sumTodo = 0;
      let sumLeader = 0;
      let leaderCount = 0;
      let onTimeCount = 0;

      divEntries.forEach((e) => {
        sumTodo += e.employeeScorePercent;
        if (e.leaderScore !== null) {
          sumLeader += e.leaderScore;
          leaderCount++;
        }
        if (e.absenPagi?.status === 'tepat_waktu') onTimeCount++;
      });

      const avgTodo = totalEntries > 0 ? Math.round(sumTodo / totalEntries) : 0;
      const avgLeader = leaderCount > 0 ? Math.round(sumLeader / leaderCount) : avgTodo;
      const onTimePercent = totalEntries > 0 ? Math.round((onTimeCount / totalEntries) * 100) : 0;

      return {
        division: div,
        totalEntries,
        avgTodo,
        avgLeader,
        onTimePercent,
      };
    });
  }, [divisions, entries]);

  // Statistik per Karyawan (Top Performers)
  const employeePerformances = useMemo(() => {
    const list = employees.map((emp) => {
      const empEntries = entries.filter((e) => e.userId === emp.id);
      const count = empEntries.length;
      let sumTodo = 0;
      let sumLeader = 0;
      let leaderCount = 0;

      empEntries.forEach((e) => {
        sumTodo += e.employeeScorePercent;
        if (e.leaderScore !== null) {
          sumLeader += e.leaderScore;
          leaderCount++;
        }
      });

      const avgTodo = count > 0 ? Math.round(sumTodo / count) : 0;
      const avgLeader = leaderCount > 0 ? Math.round(sumLeader / leaderCount) : avgTodo;

      return {
        employee: emp,
        avgTodo,
        avgLeader,
        count,
      };
    });

    list.sort((a, b) => b.avgLeader - a.avgLeader);
    return list;
  }, [employees, entries]);

  // 1. Data Grafik Bar Perbandingan Antar Divisi
  const divisionBarData = useMemo(() => {
    return divisionStats.map((ds) => ({
      name: ds.division.replace('& Engineering', 'Tech').replace('& UI/UX', 'Desain').replace('& Growth', 'Mktg').replace('& Culture (HRD)', 'HRD'),
      fullName: ds.division,
      'Rata-rata Centang To-Do (%)': ds.avgTodo,
      'Rata-rata Reviu Leader': ds.avgLeader,
    }));
  }, [divisionStats]);

  // 2. Data Grafik Area Tren Performa Perusahaan Harian
  const companyTrendData = useMemo(() => {
    const map: { [date: string]: { todoSum: number; leaderSum: number; count: number; leaderCount: number } } = {};

    entries.forEach((e) => {
      if (!map[e.date]) {
        map[e.date] = { todoSum: 0, leaderSum: 0, count: 0, leaderCount: 0 };
      }
      map[e.date].todoSum += e.employeeScorePercent;
      map[e.date].count++;
      if (e.leaderScore !== null) {
        map[e.date].leaderSum += e.leaderScore;
        map[e.date].leaderCount++;
      }
    });

    return Object.keys(map).sort().map((date) => {
      const item = map[date];
      const avgTodo = item.count > 0 ? Math.round(item.todoSum / item.count) : 0;
      const avgLeader = item.leaderCount > 0 ? Math.round(item.leaderSum / item.leaderCount) : avgTodo;
      const parts = date.split('-');
      const shortDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : date;

      return {
        date: shortDate,
        fullDate: date,
        'Rata-rata Perusahaan (%)': avgTodo,
        'Evaluasi Leader': avgLeader,
      };
    });
  }, [entries]);

  // 3. Data Pie Chart Distribusi Kehadiran
  const attendancePieData = useMemo(() => {
    let tepatPagi = 0;
    let telatPagi = 0;
    let tepatSiang = 0;

    entries.forEach((e) => {
      if (e.absenPagi?.status === 'tepat_waktu') tepatPagi++;
      if (e.absenPagi?.status === 'terlambat') telatPagi++;
      if (e.absenSiang) tepatSiang++;
    });

    return [
      { name: 'Tepat Waktu Pagi', value: tepatPagi, color: '#10b981' },
      { name: 'Selesai Siang', value: tepatSiang, color: '#0ea5e9' },
      { name: 'Terlambat Masuk', value: telatPagi, color: '#f43f5e' },
    ];
  }, [entries]);

  // Global Averages
  const totalEntries = entries.length;
  const companyAvgScore = totalEntries > 0
    ? Math.round(entries.reduce((acc, e) => acc + e.employeeScorePercent, 0) / totalEntries)
    : 0;

  const topDivision = divisionStats.reduce(
    (max, d) => (d.avgLeader > max.avgLeader ? d : max),
    divisionStats[0] || { division: '-', avgLeader: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Header Banner HRD */}
      <div className="bg-gradient-to-r from-[#004080] to-[#0060b5] rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sky-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>Executive Analytics &bull; Luzie Group Corporate</span>
          </div>
          <h1 className="text-2xl font-bold mt-1 tracking-tight">
            Grafik &amp; Analisis Performa Perusahaan
          </h1>
          <p className="text-xs text-sky-100/90 mt-1 max-w-xl">
            Laporan visual komparatif kinerja antar departemen, tren produktivitas to-do list centang, dan konsistensi reviu leader seluruh divisi.
          </p>
        </div>

        <div className="px-5 py-3 rounded-xl bg-white/10 border border-white/20 text-center shrink-0">
          <div className="text-[10px] uppercase font-bold text-sky-200">Indeks Produktivitas</div>
          <div className="text-3xl font-extrabold text-white mt-0.5">{companyAvgScore}%</div>
          <div className="text-[10px] text-sky-300 mt-0.5 font-medium">Rata-rata Seluruh Divisi</div>
        </div>
      </div>

      {/* Grid 4 Kartu Metrik HRD */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Divisi Terbaik</span>
            <Building2 className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-lg font-extrabold text-slate-900 mt-2 truncate">
            {topDivision.division}
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
            Skor: {topDivision.avgLeader} / 100
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Rata-rata Skor To-Do</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-blue-600 mt-2">{companyAvgScore}%</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Persentase centang tugas</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Karyawan Lulus KPI</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-2">
            {employeePerformances.filter((e) => e.avgLeader >= 70).length} / {employeePerformances.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Mencapai target passing grade</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Total Anggota WFA</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">{employees.length} Orang</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Di {divisions.length} departemen</p>
        </div>
      </div>

      {/* GRAFIK 1 & GRAFIK 2: DUA KOLOM RECHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GRAFIK 1: Perbandingan Performa Antar Divisi (Bar Chart) - 2 Kolom */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-sky-600" />
                <span>Perbandingan Skor Kinerja Antar Divisi</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Perbandingan to-do list centang vs reviu evaluasi leader masing-masing departemen
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-semibold">
              <span className="flex items-center gap-1.5 text-sky-600">
                <span className="w-3 h-3 rounded-md bg-sky-500 inline-block" /> To-Do Centang %
              </span>
              <span className="flex items-center gap-1.5 text-blue-600">
                <span className="w-3 h-3 rounded-md bg-blue-500 inline-block" /> Nilai Leader
              </span>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={divisionBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#475569' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="Rata-rata Centang To-Do (%)" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Rata-rata Reviu Leader" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRAFIK 2: Distribusi Kehadiran Perusahaan (Donut Chart) - 1 Kolom */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-sky-600" />
              <span>Distribusi Status Kehadiran WFA</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Proporsi ketepatan absen masuk dan selesai kerja
            </p>
          </div>

          <div className="h-56 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendancePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {attendancePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-extrabold text-slate-900">
                {totalEntries}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Sesi</span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            {attendancePieData.map((d) => (
              <div key={d.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600 font-medium">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                  {d.name}
                </span>
                <span className="font-bold text-slate-900">{d.value} Catatan</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GRAFIK 3: Tren Produktivitas Harian Perusahaan (Area Chart) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Tren Rata-rata Kinerja Perusahaan (Lintas Waktu)</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Pergerakan kurva performa to-do centang dan evaluasi leader harian
            </p>
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          {companyTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={companyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCompany" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorLeaderHrd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="Rata-rata Perusahaan (%)"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorCompany)"
                />
                <Area
                  type="monotone"
                  dataKey="Evaluasi Leader"
                  stroke="#059669"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorLeaderHrd)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              Belum ada data historis yang cukup.
            </div>
          )}
        </div>
      </div>

      {/* TOP PERFORMERS WFA BULAN INI */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Karyawan Berprestasi WFA Bulan Ini (Top Performers)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Berdasarkan akumulasi ketepatan to-do list centang, bukti pekerjaan lengkap, dan reviu leader
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {employeePerformances.slice(0, 3).map((ep, idx) => (
            <div
              key={ep.employee.id}
              className={`p-4 rounded-2xl border transition-all ${
                idx === 0
                  ? 'bg-amber-50/60 border-amber-200 shadow-xs'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={ep.employee.avatar}
                    alt={ep.employee.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs"
                  />
                  <span
                    className={`absolute -top-1 -left-1 w-5 h-5 rounded-full text-[10px] font-extrabold flex items-center justify-center text-white ${
                      idx === 0
                        ? 'bg-amber-500'
                        : idx === 1
                        ? 'bg-slate-500'
                        : 'bg-orange-500'
                    }`}
                  >
                    #{idx + 1}
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">{ep.employee.name}</h4>
                  <p className="text-[11px] text-sky-700 font-medium">{ep.employee.division}</p>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Skor: <b className="text-emerald-700">{ep.avgLeader} / 100</b>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
