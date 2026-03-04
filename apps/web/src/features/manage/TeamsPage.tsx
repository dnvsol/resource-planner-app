import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Check, X, Users } from 'lucide-react';
import { useTeams, useCreateTeam, useUpdateTeam, useDeleteTeam, usePeople, useProjects } from '@/shared/api/hooks';
import type { Team, Person, Project } from '@/shared/api/hooks';
import { Button } from '@/shared/components/ui/Button';
import { PageHeader } from '@/shared/components/PageHeader';
import { ListCard } from '@/shared/components/ListCard';
import { DataTable, type Column } from '@/shared/components/DataTable';

export function TeamsPage() {
  const { data: teamsRes, isLoading } = useTeams();
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();
  const { data: peopleRes } = usePeople();
  const { data: projectsRes } = useProjects();
  const teams: Team[] = teamsRes?.data ?? [];
  const people: Person[] = peopleRes?.data ?? [];
  const projects: Project[] = projectsRes?.data ?? [];

  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const peopleCountMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of people) {
      if (p.teamId && !p.archived) m.set(p.teamId, (m.get(p.teamId) ?? 0) + 1);
    }
    return m;
  }, [people]);

  const projectCountMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of projects) {
      if (p.teamId && p.state === 'active') m.set(p.teamId, (m.get(p.teamId) ?? 0) + 1);
    }
    return m;
  }, [projects]);

  const filtered = teams.filter((t) =>
    !search.trim() || t.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await createTeam.mutateAsync({ name: newName.trim() });
    setNewName('');
    setAdding(false);
  };

  const handleSave = async (id: string) => {
    if (!editName.trim()) return;
    await updateTeam.mutateAsync({ id, name: editName.trim() });
    setEditingId(null);
  };

  const columns: Column<Team>[] = [
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
        return <span className="text-sm font-medium text-gray-900">{row.name}</span>;
      },
    },
    {
      key: 'people',
      header: 'ACTIVE PEOPLE',
      render: (row) => <span className="text-sm text-gray-600">{peopleCountMap.get(row.id) ?? 0}</span>,
    },
    {
      key: 'projects',
      header: 'ACTIVE PROJECTS',
      render: (row) => <span className="text-sm text-gray-600">{projectCountMap.get(row.id) ?? 0}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (row) => editingId === row.id ? null : (
        <div className="flex items-center justify-end gap-1">
          <button onClick={(e) => { e.stopPropagation(); setEditingId(row.id); setEditName(row.name); }} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><Pencil className="h-3.5 w-3.5" /></button>
          <button onClick={(e) => { e.stopPropagation(); deleteTeam.mutate(row.id); }} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader icon={<Users className="h-6 w-6" />} title="Teams" count={teams.length} actions={<Button onClick={() => { setAdding(true); setNewName(''); }}><Plus className="h-4 w-4" /> New Team</Button>} />
      <ListCard search={search} onSearchChange={setSearch} searchPlaceholder="Search teams...">
        <DataTable<Team> columns={columns} data={filtered} loading={isLoading} emptyMessage="No teams yet." />
        {adding && (
          <div className="flex items-center gap-2 border-t border-gray-100 px-5 py-3">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus placeholder="Team name" onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false); }} className="w-48 rounded-md border border-gray-300 px-2 py-1 text-sm" />
            <button onClick={handleAdd} className="rounded p-1 text-green-600 hover:bg-green-50"><Check className="h-4 w-4" /></button>
            <button onClick={() => setAdding(false)} className="rounded p-1 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
          </div>
        )}
      </ListCard>
    </div>
  );
}
