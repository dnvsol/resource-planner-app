import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { BarChart3, Download } from 'lucide-react';
import { useUtilization, useCapacity } from '@/shared/api/hooks';
import { GaugeChart } from '@/shared/components/charts/GaugeChart';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BAND_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e',
  '#3b82f6', '#6366f1', '#a855f7', '#ec4899',
];

const BAND_LABELS = [
  '0-19%', '20-39%', '40-59%', '60-79%', '80-89%',
  '90-100%', '101-120%', '121-160%', '161%+',
];

function getUtilBand(pct: number): number {
  if (pct < 20) return 0;
  if (pct < 40) return 1;
  if (pct < 60) return 2;
  if (pct < 80) return 3;
  if (pct < 90) return 4;
  if (pct <= 100) return 5;
  if (pct <= 120) return 6;
  if (pct <= 160) return 7;
  return 8;
}

type PeriodUnit = 'week' | 'month';

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateInput(dateStr: string): string {
  return dateStr; // Already YYYY-MM-DD
}

// ---------------------------------------------------------------------------
// InsightsPage
// ---------------------------------------------------------------------------

export function InsightsPage() {
  // Date range state with custom start/end
  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const defaultEnd = new Date(defaultStart.getFullYear(), defaultStart.getMonth() + 3, 0);

  const [startDate, setStartDate] = useState(defaultStart.toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(defaultEnd.toISOString().slice(0, 10));
  const [periodUnit, setPeriodUnit] = useState<PeriodUnit>('month');

  const { data: utilData, isLoading: utilLoading } = useUtilization(startDate, endDate);
  const { data: capacityData, isLoading: capLoading } = useCapacity(startDate, endDate, periodUnit);

  // Preset helpers
  const applyPreset = (preset: string) => {
    const n = new Date();
    switch (preset) {
      case 'this_month': {
        const s = new Date(n.getFullYear(), n.getMonth(), 1);
        const e = new Date(n.getFullYear(), n.getMonth() + 1, 0);
        setStartDate(s.toISOString().slice(0, 10));
        setEndDate(e.toISOString().slice(0, 10));
        break;
      }
      case 'this_quarter': {
        const s = new Date(n.getFullYear(), Math.floor(n.getMonth() / 3) * 3, 1);
        const e = new Date(s.getFullYear(), s.getMonth() + 3, 0);
        setStartDate(s.toISOString().slice(0, 10));
        setEndDate(e.toISOString().slice(0, 10));
        break;
      }
      case 'next_quarter': {
        const s = new Date(n.getFullYear(), Math.floor(n.getMonth() / 3) * 3 + 3, 1);
        const e = new Date(s.getFullYear(), s.getMonth() + 3, 0);
        setStartDate(s.toISOString().slice(0, 10));
        setEndDate(e.toISOString().slice(0, 10));
        break;
      }
    }
  };

  // Aggregate utilization
  const aggUtil = useMemo(() => {
    if (!utilData || utilData.length === 0) return { total: 0, billable: 0, nonBillable: 0 };
    const totalCap = utilData.reduce((s, u) => s + u.capacityMinutes, 0);
    const totalSched = utilData.reduce((s, u) => s + u.scheduledMinutes, 0);
    const totalBill = utilData.reduce((s, u) => s + u.billableMinutes, 0);
    const totalNonBill = utilData.reduce((s, u) => s + u.nonBillableMinutes, 0);
    return {
      total: totalCap > 0 ? (totalSched / totalCap) * 100 : 0,
      billable: totalCap > 0 ? (totalBill / totalCap) * 100 : 0,
      nonBillable: totalCap > 0 ? (totalNonBill / totalCap) * 100 : 0,
    };
  }, [utilData]);

  // Band distribution (9 bands)
  const bandData = useMemo(() => {
    const bands = Array(9).fill(0);
    utilData?.forEach((u) => { bands[getUtilBand(u.totalUtilizationPct)]++; });
    return bands.map((count, i) => ({ band: BAND_LABELS[i], count, color: BAND_COLORS[i] }));
  }, [utilData]);

  // Utilization summary — detailed sub-bands
  const utilSummary = useMemo(() => {
    if (!utilData) return {
      over161: 0, over141: 0, over121: 0, over101: 0,
      well90: 0, well80: 0,
      under60: 0, under40: 0, under20: 0, under0: 0,
    };
    let over161 = 0, over141 = 0, over121 = 0, over101 = 0;
    let well90 = 0, well80 = 0;
    let under60 = 0, under40 = 0, under20 = 0, under0 = 0;
    utilData.forEach((u) => {
      const p = u.totalUtilizationPct;
      if (p > 160) over161++;
      else if (p > 140) over141++;
      else if (p > 120) over121++;
      else if (p > 100) over101++;
      else if (p >= 90) well90++;
      else if (p >= 80) well80++;
      else if (p >= 60) under60++;
      else if (p >= 40) under40++;
      else if (p >= 20) under20++;
      else under0++;
    });
    return { over161, over141, over121, over101, well90, well80, under60, under40, under20, under0 };
  }, [utilData]);

  // Capacity chart data
  const capChartData = useMemo(() => {
    return (capacityData ?? []).map((c) => ({
      period: c.periodStart.slice(0, 7),
      capacity: Math.round(c.totalCapacityMinutes / 60),
      demand: Math.round(c.totalDemandMinutes / 60),
      surplus: Math.round(c.surplusMinutes / 60),
    }));
  }, [capacityData]);

  // Utilization over time (billable/non-billable %) from capacity data
  const utilOverTime = useMemo(() => {
    return (capacityData ?? []).map((c) => {
      const capH = c.totalCapacityMinutes / 60;
      const demandH = c.totalDemandMinutes / 60;
      const totalPct = capH > 0 ? Math.round((demandH / capH) * 100) : 0;
      return {
        period: c.periodStart.slice(0, 7),
        total: totalPct,
      };
    });
  }, [capacityData]);

  const dateRangeLabel = `${formatDateDisplay(startDate)} – ${formatDateDisplay(endDate)} by ${periodUnit === 'week' ? 'Weeks' : 'Months'}`;

  const overTotal = utilSummary.over161 + utilSummary.over141 + utilSummary.over121 + utilSummary.over101;
  const wellTotal = utilSummary.well90 + utilSummary.well80;
  const underTotal = utilSummary.under60 + utilSummary.under40 + utilSummary.under20 + utilSummary.under0;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 -mx-4 mb-6 border-b border-gray-200 bg-white px-4 pb-4 pt-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-indigo-600" />
            <h1 className="text-xl font-bold text-gray-900">Utilization</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-gray-500">{dateRangeLabel}</span>

            {/* Period toggle */}
            <div className="flex gap-0.5 rounded-lg bg-gray-100 p-0.5">
              {(['week', 'month'] as PeriodUnit[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriodUnit(p)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    periodUnit === p
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {p === 'week' ? 'Weeks' : 'Months'}
                </button>
              ))}
            </div>

            {/* Date range inputs */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={formatDateInput(startDate)}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-md border border-gray-300 px-2 py-1 text-xs"
              />
              <span className="text-xs text-gray-400">–</span>
              <input
                type="date"
                value={formatDateInput(endDate)}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-md border border-gray-300 px-2 py-1 text-xs"
              />
            </div>

            {/* Preset buttons */}
            <div className="flex gap-0.5 rounded-lg bg-gray-100 p-0.5">
              {[
                { key: 'this_month', label: 'This Month' },
                { key: 'this_quarter', label: 'This Quarter' },
                { key: 'next_quarter', label: 'Next Quarter' },
              ].map((p) => (
                <button
                  key={p.key}
                  onClick={() => applyPreset(p.key)}
                  className="rounded-md px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:text-gray-900"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Total Utilization — Gauge Charts */}
      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Total Utilization</h2>
          <span className="text-xs text-gray-500">People (All {utilData?.length ?? 0})</span>
        </div>
        <p className="mb-4 text-xs text-gray-400">
          Aggregate workforce utilization for the selected date range
        </p>
        <div className="flex items-center justify-around">
          <GaugeChart label="Total" value={aggUtil.total} />
          <GaugeChart label="Billable" value={aggUtil.billable} />
          <GaugeChart label="Non-Billable" value={aggUtil.nonBillable} />
        </div>
      </div>

      {/* Section 2: Utilization Bands */}
      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            Utilization Bands ({utilData?.length ?? 0} people)
          </h2>
          <Download className="h-4 w-4 cursor-pointer text-gray-400 hover:text-gray-600" />
        </div>
        <p className="mb-4 text-xs text-gray-400">
          Distribution of people across utilization bands
        </p>
        {utilLoading ? (
          <div className="h-48 animate-pulse rounded bg-gray-100" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={bandData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="band" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" name="People" radius={[4, 4, 0, 0]}>
                {bandData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* Utilization Summary — integrated below bands */}
        <div className="mt-6 border-t border-gray-100 pt-4">
          <h3 className="mb-1 text-sm font-semibold text-gray-900">Utilization Summary</h3>
          <p className="mb-4 text-xs text-gray-400">
            People in each utilization band for the selected date range
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Over Utilized */}
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-2xl font-bold text-red-600">{overTotal}</p>
              <p className="mb-2 text-sm font-medium text-gray-900">Over Utilized</p>
              <div className="space-y-1 text-xs text-gray-600">
                <SubBandRow label="Over 161%" count={utilSummary.over161} color="#ec4899" />
                <SubBandRow label="141–160%" count={utilSummary.over141} color="#a855f7" />
                <SubBandRow label="121–140%" count={utilSummary.over121} color="#6366f1" />
                <SubBandRow label="101–120%" count={utilSummary.over101} color="#3b82f6" />
              </div>
            </div>

            {/* Well Utilized */}
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-2xl font-bold text-green-600">{wellTotal}</p>
              <p className="mb-2 text-sm font-medium text-gray-900">Well Utilized</p>
              <div className="space-y-1 text-xs text-gray-600">
                <SubBandRow label="90–100%" count={utilSummary.well90} color="#22c55e" />
                <SubBandRow label="80–89%" count={utilSummary.well80} color="#84cc16" />
              </div>
            </div>

            {/* Under Utilized */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-2xl font-bold text-amber-600">{underTotal}</p>
              <p className="mb-2 text-sm font-medium text-gray-900">Under Utilized</p>
              <div className="space-y-1 text-xs text-gray-600">
                <SubBandRow label="60–79%" count={utilSummary.under60} color="#eab308" />
                <SubBandRow label="40–59%" count={utilSummary.under40} color="#f97316" />
                <SubBandRow label="20–39%" count={utilSummary.under20} color="#f97316" />
                <SubBandRow label="0–19%" count={utilSummary.under0} color="#ef4444" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Utilization Over Time */}
      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold text-gray-900">Utilization Over Time</h2>
        <p className="mb-4 text-xs text-gray-400">
          Total utilization percentage over time
        </p>
        {capLoading ? (
          <div className="h-64 animate-pulse rounded bg-gray-100" />
        ) : utilOverTime.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">No data for this period.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={utilOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit="%" />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Legend />
              <Area type="monotone" dataKey="total" name="Total Utilization" stroke="#6366f1" fill="#e0e7ff" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Section 4: Capacity vs Demand */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold text-gray-900">Capacity vs Demand</h2>
        <p className="mb-4 text-xs text-gray-400">
          Total capacity and demand in hours for the selected date range
        </p>
        {capLoading ? (
          <div className="h-64 animate-pulse rounded bg-gray-100" />
        ) : capChartData.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">No capacity data for this period.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={capChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="capacity" name="Capacity" stackId="1" stroke="#6366f1" fill="#e0e7ff" />
              <Area type="monotone" dataKey="demand" name="Demand" stackId="2" stroke="#f59e0b" fill="#fef3c7" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SubBandRow({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        <span>{label}</span>
      </div>
      <span className="font-medium">{count}</span>
    </div>
  );
}
