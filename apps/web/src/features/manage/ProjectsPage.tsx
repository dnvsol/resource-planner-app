import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderKanban, Pencil } from 'lucide-react';
import {
  useProjects,
  useCreateProject,
  useClients,
  useTeams,
  useDeleteProject,
} from '@/shared/api/hooks';
import type { Project, Client, Team } from '@/shared/api/hooks';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { PageHeader } from '@/shared/components/PageHeader';
import { ListCard } from '@/shared/components/ListCard';
import { ThreeDotMenu } from '@/shared/components/ui/ThreeDotMenu';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type StateFilter = 'active' | 'tentative' | 'archived';

const PRICING_MODEL_LABELS: Record<string, string> = {
  time_and_materials: 'Time and Materials',
  fixed_price: 'Fixed Price',
  non_billable: 'Non-Billable',
};

// ---------------------------------------------------------------------------
// Add Project Modal
// ---------------------------------------------------------------------------

function AddProjectModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [pricingModel, setPricingModel] =
    useState<Project['pricingModel']>('time_and_materials');
  const [emoji, setEmoji] = useState('');
  const createProject = useCreateProject();
  const { data: clientsRes } = useClients();
  const clients: Client[] = clientsRes?.data ?? [];

  const reset = () => {
    setName('');
    setClientId('');
    setPricingModel('time_and_materials');
    setEmoji('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createProject.mutateAsync({
      name,
      clientId: clientId || null,
      pricingModel,
      emoji: emoji || null,
    });
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="New Project">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Project Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="New Project"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Client</label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">No client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Pricing Model</label>
          <select
            value={pricingModel}
            onChange={(e) => setPricingModel(e.target.value as Project['pricingModel'])}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="time_and_materials">Time &amp; Materials</option>
            <option value="fixed_price">Fixed Price</option>
            <option value="non_billable">Non-Billable</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Emoji (optional)</label>
          <input
            type="text"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="e.g. rocket"
            maxLength={32}
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={createProject.isPending}>Create Project</Button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Row type
// ---------------------------------------------------------------------------

interface ProjectRow extends Project {
  _clientName?: string;
  _teamName?: string;
}

// ---------------------------------------------------------------------------
// Color icon for project (matches Runn style)
// ---------------------------------------------------------------------------

function ProjectIcon({ project }: { project: ProjectRow }) {
  if (project.emoji) {
    return <span className="text-lg">{project.emoji}</span>;
  }
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];
  const hash = project.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const color = colors[hash % colors.length];
  return (
    <span
      className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
      style={{ backgroundColor: color }}
    >
      {project.name.charAt(0).toUpperCase()}
    </span>
  );
}

// ---------------------------------------------------------------------------
// ProjectsPage
// ---------------------------------------------------------------------------

export function ProjectsPage() {
  const navigate = useNavigate();
  const { data: projectsRes, isLoading } = useProjects();
  const { data: clientsRes } = useClients();
  const { data: teamsRes } = useTeams();
  const deleteProject = useDeleteProject();
  const [filter, setFilter] = useState<StateFilter>('active');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [sortCol, setSortCol] = useState('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const projects: Project[] = projectsRes?.data ?? [];
  const clients: Client[] = clientsRes?.data ?? [];
  const teams: Team[] = teamsRes?.data ?? [];

  const clientMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of clients) m.set(c.id, c.name);
    return m;
  }, [clients]);

  const teamMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of teams) m.set(t.id, t.name);
    return m;
  }, [teams]);

  const filteredProjects: ProjectRow[] = useMemo(() => {
    let enriched: ProjectRow[] = projects.map((p) => ({
      ...p,
      _clientName: p.clientId ? clientMap.get(p.clientId) : undefined,
      _teamName: p.teamId ? teamMap.get(p.teamId) : undefined,
    }));

    if (filter === 'archived') enriched = enriched.filter((p) => p.state === 'archived');
    else if (filter === 'tentative') enriched = enriched.filter((p) => p.state === 'active' && p.status === 'tentative');
    else enriched = enriched.filter((p) => p.state === 'active');

    if (search.trim()) {
      const q = search.toLowerCase();
      enriched = enriched.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        (p._clientName?.toLowerCase().includes(q) ?? false),
      );
    }

    enriched.sort((a, b) => {
      let cmp = 0;
      if (sortCol === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortCol === 'client') cmp = (a._clientName ?? '').localeCompare(b._clientName ?? '');
      else if (sortCol === 'team') cmp = (a._teamName ?? '').localeCompare(b._teamName ?? '');
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return enriched;
  }, [projects, clientMap, teamMap, filter, search, sortCol, sortDir]);

  const formatBudget = (row: ProjectRow) => {
    const val = (row as any).budgetTotal ?? row.budget;
    if (val === null || val === undefined || val === 0) {
      return <span className="text-gray-400">&mdash;</span>;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const columns: Column<ProjectRow>[] = [
    {
      key: 'name',
      header: 'NAME',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <ProjectIcon project={row} />
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/manage/projects/${row.id}`); }}
            className="font-medium text-gray-900 hover:text-indigo-600 hover:underline"
          >
            {row.name}
          </button>
        </div>
      ),
    },
    {
      key: 'client',
      header: 'CLIENT',
      sortable: true,
      render: (row) => row._clientName
        ? <span className="text-gray-700">{row._clientName}</span>
        : <span className="text-gray-400">&mdash;</span>,
    },
    {
      key: 'status',
      header: 'STATUS',
      render: (row) => {
        if (row.state === 'archived') return <span className="text-sm font-medium text-gray-500">Archived</span>;
        if (row.status === 'tentative') return <span className="text-sm font-medium text-amber-600">Tentative</span>;
        return <span className="text-sm font-medium text-green-600">Confirmed</span>;
      },
    },
    {
      key: 'pricingModel',
      header: 'PRICING MODEL',
      render: (row) =>
        row.pricingModel
          ? <span className="text-gray-700">{PRICING_MODEL_LABELS[row.pricingModel] ?? row.pricingModel}</span>
          : <span className="text-gray-400">&mdash;</span>,
    },
    {
      key: 'budget',
      header: 'BUDGET',
      render: (row) => <span className="font-medium text-gray-900">{formatBudget(row)}</span>,
    },
    {
      key: 'team',
      header: 'PRIMARY TEAM',
      render: (row) => row._teamName
        ? <span className="text-gray-700">{row._teamName}</span>
        : <span className="text-gray-400">&mdash;</span>,
    },
    {
      key: 'tags',
      header: 'TAGS',
      render: (row) => {
        const tags = (row as any).tags;
        if (!tags || tags.length === 0) return <span className="text-gray-400">&mdash;</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 2).map((t: any) => (
              <span key={t.id} className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                {t.name}
              </span>
            ))}
            {tags.length > 2 && <span className="text-xs text-gray-500">+{tags.length - 2}</span>}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <ThreeDotMenu
          items={[
            { label: 'Edit', icon: <Pencil className="h-3.5 w-3.5" />, onClick: () => navigate(`/manage/projects/${row.id}`) },
            { label: 'Open in Planner', onClick: () => navigate('/planner/projects') },
            { label: 'Archive', onClick: () => {} },
            { label: 'Delete', onClick: () => { if (confirm('Delete this project?')) deleteProject.mutate(row.id); }, danger: true },
          ]}
        />
      ),
    },
  ];

  // Filter dropdown (matches Runn style)
  const filterNode = (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">Filter</span>
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value as StateFilter)}
        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        <option value="active">Active</option>
        <option value="tentative">Tentative</option>
        <option value="archived">Archived</option>
      </select>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        icon={<FolderKanban className="h-6 w-6" />}
        title="Projects"
        count={filteredProjects.length}
        actions={
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => {}}>
              Bulk Edit
            </Button>
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </div>
        }
      />

      <ListCard
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search"
        filterNode={filterNode}
      >
        <DataTable<ProjectRow>
          columns={columns}
          data={filteredProjects}
          loading={isLoading}
          onRowClick={(row) => navigate(`/manage/projects/${row.id}`)}
          emptyMessage="No projects found."
          sortColumn={sortCol}
          sortDirection={sortDir}
          onSort={(key, dir) => { setSortCol(key); setSortDir(dir); }}
        />
      </ListCard>

      <AddProjectModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
