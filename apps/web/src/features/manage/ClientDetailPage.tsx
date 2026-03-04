import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import {
  useClients,
  useProjects,
  useDeleteClient,
  useProfitabilityReport,
} from '@/shared/api/hooks';
import type { Client, Project } from '@/shared/api/hooks';
import { ThreeDotMenu } from '@/shared/components/ui/ThreeDotMenu';
import { DataTable, type Column } from '@/shared/components/DataTable';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '\u2014';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

const PRICING_MODEL_LABELS: Record<string, string> = {
  time_and_materials: 'T&M',
  fixed_price: 'Fixed',
  non_billable: 'Non-Bill',
};

function ClientIcon({ name }: { name: string }) {
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const color = colors[hash % colors.length];
  return (
    <span
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold text-white"
      style={{ backgroundColor: color }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------

function KpiCard({ label, value, color = 'text-gray-900' }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="mb-1 text-xs font-medium uppercase text-gray-500">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ClientDetailPage
// ---------------------------------------------------------------------------

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: clientsRes, isLoading: clientsLoading } = useClients();
  const { data: projectsRes } = useProjects();
  const { data: profitReport } = useProfitabilityReport();
  const deleteClient = useDeleteClient();

  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

  const clients: Client[] = clientsRes?.data ?? [];
  const projects: Project[] = projectsRes?.data ?? [];
  const client = clients.find((c) => c.id === id);

  // Filter projects by client
  const clientProjects = useMemo(() => {
    return projects.filter((p) => p.clientId === id);
  }, [projects, id]);

  const activeProjects = clientProjects.filter((p) => p.state === 'active');
  const archivedProjects = clientProjects.filter((p) => p.state === 'archived');
  const displayProjects = activeTab === 'active' ? activeProjects : archivedProjects;

  // Financial KPIs from profitability report
  const clientFinancials = useMemo(() => {
    if (!profitReport) return null;
    return profitReport.find((r) => r.clientId === id) ?? null;
  }, [profitReport, id]);

  if (clientsLoading || !client) {
    return (
      <div className="mx-auto max-w-5xl animate-pulse px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-gray-200" />
          <div className="h-7 w-48 rounded bg-gray-200" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  const handleDelete = () => {
    if (confirm(`Delete client "${client.name}"?`)) {
      deleteClient.mutate(client.id);
      navigate('/manage/clients');
    }
  };

  const columns: Column<Project>[] = [
    {
      key: 'name',
      header: 'PROJECT',
      render: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/manage/projects/${row.id}`); }}
          className="font-medium text-gray-900 hover:text-indigo-600 hover:underline"
        >
          {row.name}
        </button>
      ),
    },
    {
      key: 'status',
      header: 'STATUS',
      render: (row) => {
        if (row.state === 'archived') return <span className="text-sm text-gray-500">Archived</span>;
        if (row.status === 'tentative') return <span className="text-sm text-amber-600">Tentative</span>;
        return <span className="text-sm text-green-600">Confirmed</span>;
      },
    },
    {
      key: 'pricingModel',
      header: 'PRICING',
      render: (row) => (
        <span className="text-sm text-gray-600">
          {row.pricingModel ? (PRICING_MODEL_LABELS[row.pricingModel] ?? row.pricingModel) : '\u2014'}
        </span>
      ),
    },
    {
      key: 'planner',
      header: '',
      render: () => (
        <button
          onClick={(e) => { e.stopPropagation(); navigate('/planner/projects'); }}
          className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
        >
          <ExternalLink className="h-3 w-3" />
          Planner
        </button>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <ClientIcon name={client.name} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
            <p className="text-sm text-gray-500">{activeProjects.length} active project{activeProjects.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <ThreeDotMenu
          items={[
            { label: 'Edit', onClick: () => {} },
            { label: 'Delete', onClick: handleDelete, danger: true },
          ]}
        />
      </div>

      {/* Financial KPIs */}
      <div className="mb-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
          This Week &amp; Next 3 Weeks
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <KpiCard label="Revenue" value={formatCurrency(clientFinancials?.totalRevenue ?? 0)} color="text-green-600" />
          <KpiCard label="Costs" value={formatCurrency(clientFinancials?.totalCost ?? 0)} />
          <KpiCard label="Profit" value={formatCurrency(clientFinancials?.totalProfit ?? 0)} color={((clientFinancials?.totalProfit ?? 0) >= 0) ? 'text-green-600' : 'text-red-600'} />
          <KpiCard label="Margin" value={clientFinancials ? `${Math.round(clientFinancials.margin)}%` : '\u2014'} color={((clientFinancials?.margin ?? 0) >= 20) ? 'text-green-600' : 'text-orange-600'} />
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveTab('active')}
            className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
              activeTab === 'active'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Active Projects ({activeProjects.length})
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
              activeTab === 'archived'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Archived Projects ({archivedProjects.length})
          </button>
        </nav>
      </div>

      {/* Projects table */}
      <DataTable<Project>
        columns={columns}
        data={displayProjects}
        onRowClick={(row) => navigate(`/manage/projects/${row.id}`)}
        emptyMessage={`No ${activeTab} projects for this client.`}
      />
    </div>
  );
}
