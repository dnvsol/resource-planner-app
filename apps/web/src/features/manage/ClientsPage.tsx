import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Check, X, Building2 } from 'lucide-react';
import { useClients, useCreateClient, useUpdateClient, useDeleteClient, useProjects } from '@/shared/api/hooks';
import type { Client, Project } from '@/shared/api/hooks';
import { Button } from '@/shared/components/ui/Button';
import { PageHeader } from '@/shared/components/PageHeader';
import { ListCard } from '@/shared/components/ListCard';
import { DataTable, type Column } from '@/shared/components/DataTable';

function ClientIcon({ name }: { name: string }) {
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const color = colors[hash % colors.length];
  return (
    <span
      className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
      style={{ backgroundColor: color }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

export function ClientsPage() {
  const navigate = useNavigate();
  const { data: clientsRes, isLoading } = useClients();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const { data: projectsRes } = useProjects();
  const clients: Client[] = clientsRes?.data ?? [];
  const projects: Project[] = projectsRes?.data ?? [];

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'active' | 'archived' | 'all'>('active');
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const projectCountMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of projects) {
      if (p.clientId && p.state === 'active') {
        m.set(p.clientId, (m.get(p.clientId) ?? 0) + 1);
      }
    }
    return m;
  }, [projects]);

  const filtered = useMemo(() => {
    let list = clients;
    if (filter === 'active') list = list.filter((c) => !(c as any).archived);
    else if (filter === 'archived') list = list.filter((c) => (c as any).archived);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q));
    }
    return list;
  }, [clients, search, filter]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await createClient.mutateAsync({ name: newName.trim() });
    setNewName('');
    setAdding(false);
  };

  const handleSave = async (id: string) => {
    if (!editName.trim()) return;
    await updateClient.mutateAsync({ id, name: editName.trim() });
    setEditingId(null);
  };

  const columns: Column<Client>[] = [
    {
      key: 'name',
      header: 'NAME',
      sortable: true,
      render: (row) => {
        if (editingId === row.id) {
          return (
            <div className="flex items-center gap-2">
              <input value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleSave(row.id); if (e.key === 'Escape') setEditingId(null); }} className="w-48 rounded-md border border-gray-300 px-2 py-1 text-sm" />
              <button onClick={() => handleSave(row.id)} className="rounded p-1 text-green-600 hover:bg-green-50"><Check className="h-4 w-4" /></button>
              <button onClick={() => setEditingId(null)} className="rounded p-1 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-3">
            <ClientIcon name={row.name} />
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/manage/clients/${row.id}`); }}
              className="font-medium text-gray-900 hover:text-indigo-600 hover:underline"
            >
              {row.name}
            </button>
          </div>
        );
      },
    },
    {
      key: 'projects',
      header: 'ACTIVE PROJECTS',
      render: (row) => {
        const count = projectCountMap.get(row.id) ?? 0;
        return <span className="text-sm text-gray-600">{count}</span>;
      },
    },
    {
      key: 'actions',
      header: '',
      render: (row) => editingId === row.id ? null : (
        <div className="flex items-center justify-end gap-1">
          <button onClick={(e) => { e.stopPropagation(); setEditingId(row.id); setEditName(row.name); }} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><Pencil className="h-3.5 w-3.5" /></button>
          <button onClick={(e) => { e.stopPropagation(); deleteClient.mutate(row.id); }} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      ),
    },
  ];

  const filterNode = (
    <select
      value={filter}
      onChange={(e) => setFilter(e.target.value as 'active' | 'archived' | 'all')}
      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
    >
      <option value="active">Active</option>
      <option value="archived">Archived</option>
      <option value="all">All</option>
    </select>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        icon={<Building2 className="h-6 w-6" />}
        title="Clients"
        count={clients.length}
        actions={<Button onClick={() => { setAdding(true); setNewName(''); }}><Plus className="h-4 w-4" /> New Client</Button>}
      />

      <ListCard search={search} onSearchChange={setSearch} searchPlaceholder="Search clients..." filterNode={filterNode}>
        <DataTable<Client>
          columns={columns}
          data={filtered}
          loading={isLoading}
          onRowClick={(row) => navigate(`/manage/clients/${row.id}`)}
          emptyMessage="No clients yet."
        />
        {adding && (
          <div className="flex items-center gap-2 border-t border-gray-100 px-5 py-3">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus placeholder="Client name" onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false); }} className="w-48 rounded-md border border-gray-300 px-2 py-1 text-sm" />
            <button onClick={handleAdd} className="rounded p-1 text-green-600 hover:bg-green-50"><Check className="h-4 w-4" /></button>
            <button onClick={() => setAdding(false)} className="rounded p-1 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
          </div>
        )}
      </ListCard>
    </div>
  );
}
