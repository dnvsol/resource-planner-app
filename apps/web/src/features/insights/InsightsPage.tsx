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
import { PageHeader } from '@/shared/components/PageHeader';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BAND_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#6366f1', '#a855f7', '#ec4899',
];

function getUtilBand(pct: number): number {
  if (pct < 20) return 0;
  if (pct < 40) return 1;
  if (pct < 60) return 2;
  if (pct < 80) return 3;
  if (pct <= 100) return 4;
  if (pct <= 120) return 5;
  if (pct <= 160) return 6;
  return 7;
}

const BAND_LABELS = ['0-19%', '20-39%', '40-59%', '60-79%', '80-100%', '101-120%', '121-160%', '161%+'];

type RangePreset = 'this_quarter' | 'this_month' | 'next_quarter';

function useDateRange() {
  const [preset, setPreset] = useState<RangePreset>('this_quarter');

  const range = useMemo(() => {
    const now = new Date();
    switch (preset) {
      case 'this_month': {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) };
      }
      case 'next_quarter': {
        const nqStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 1);
        const nqEnd = new Date(nqStart.getFullYear(), nqStart.getMonth() + 3, 0);
        return { startDate: nqStart.toISOString().slice(0, 10), endDate: nqEnd.toISOString().slice(0, 10) };
      }
      case 'this_quarter':
      default: {
        const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        const qEnd = new Date(qStart.getFullYear(), qStart.getMonth() + 3, 0);
        return { startDate: qStart.toISOString().slice(0, 10), endDate: qEnd.toISOString().slice(0, 10) };
      }
    }
  }, [preset]);

  return { preset, setPreset, ...range };
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ---------------------------------------------------------------------------
// InsightsPage
// ---------------------------------------------------------------------------

export function InsightsPage() {
  const { preset, setPreset, startDate, endDate } = useDateRange();
  const { data: utilData, isLoading: utilLoading } = useUtilization(startDate, endDate);
  const { data: capacityData, isLoading: capLoading } = useCapacity(startDate, endDate, 'month');

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

  // Band distribution
  const bandData = useMemo(() => {
    const bands = Array(8).fill(0);
    utilData?.forEach((u) => { bands[getUtilBand(u.totalUtilizationPct)]++; });
    return bands.map((count, i) => ({ band: BAND_LABELS[i], count, color: BAND_COLORS[i] }));
  }, [utilData]);

  // Utilization summary bands
  const utilSummary = useMemo(() => {
    if (!utilData) return { over: 0, well: 0, under: 0 };
    let over = 0, well = 0, under = 0;
    utilData.forEach((u) => {
      if (u.totalUtilizationPct > 100) over++;
      else if (u.totalUtilizationPct >= 60) well++;
      else under++;
    });
    return { over, well, under };
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

  const dateRangeLabel = `${formatDateDisplay(startDate)} - ${formatDateDisplay(endDate)} by Months`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        icon={<BarChart3 className="h-6 w-6" />}
        title="Utilization"
        actions={
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{dateRangeLabel}</span>
            <div className="flex gap-1 rounded-lg bg-gray-100 p-0.5">
              {(['this_month', 'this_quarter', 'next_quarter'] as RangePreset[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPreset(p)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    preset === p
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {p.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </button>
              ))}
            </div>
          </div>
        }
      />

      {/* Section 1: Total Utilization — Gauge Charts */}
      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Total Utilization</h2>
          <span className="text-xs text-gray-500">People (All {utilData?.length ?? 0})</span>
        </div>
        <div className="flex items-center justify-around">
          <GaugeChart label="Total" value={aggUtil.total} />
          <GaugeChart label="Billable" value={aggUtil.billable} />
          <GaugeChart label="Non-Billable" value={aggUtil.nonBillable} />
        </div>
      </div>

      {/* Section 2: Utilization Bands */}
      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            Utilization Distribution ({utilData?.length ?? 0} people)
          </h2>
          <Download className="h-4 w-4 cursor-pointer text-gray-400 hover:text-gray-600" />
        </div>
        {utilLoading ? (
          <div className="h-48 animate-pulse rounded bg-gray-100" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={bandData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="band" tick={{ fontSize: 11 }} />
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
      </div>

      {/* Section 3: Utilization Summary */}
      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Utilization Summary</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard
            title="Over Utilized"
            subtitle="> 100%"
            count={utilSummary.over}
            color="text-red-600"
            bgColor="bg-red-50"
          />
          <SummaryCard
            title="Well Utilized"
            subtitle="60% - 100%"
            count={utilSummary.well}
            color="text-green-600"
            bgColor="bg-green-50"
          />
          <SummaryCard
            title="Under Utilized"
            subtitle="< 60%"
            count={utilSummary.under}
            color="text-amber-600"
            bgColor="bg-amber-50"
          />
        </div>
      </div>

      {/* Section 4: Capacity vs Demand */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Capacity vs Demand (hours)</h2>
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

function SummaryCard({
  title,
  subtitle,
  count,
  color,
  bgColor,
}: {
  title: string;
  subtitle: string;
  count: number;
  color: string;
  bgColor: string;
}) {
  return (
    <div className={`rounded-lg border p-4 ${bgColor}`}>
      <p className={`text-2xl font-bold ${color}`}>{count}</p>
      <p className="text-sm font-medium text-gray-900">{title}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );
}
