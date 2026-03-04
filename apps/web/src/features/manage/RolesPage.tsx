import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Check, X, Briefcase } from 'lucide-react';
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole, usePeople } from '@/shared/api/hooks';
import type { Role, Person } from '@/shared/api/hooks';
import { Button } from '@/shared/components/ui/Button';
import { PageHeader } from '@/shared/components/PageHeader';
import { ListCard } from '@/shared/components/ListCard';
import { DataTable, type Column } from '@/shared/components/DataTable';

function formatMoney(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v);
}

export function RolesPage() {
  const { data: rolesRes, isLoading } = useRoles();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();
  const { data: peopleRes } = usePeople();
  const roles: Role[] = rolesRes?.data ?? [];
  const people: Person[] = peopleRes?.data ?? [];

  const roleCountMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of people) {
      const roleId = (p as any).activeContract?.roleId;
      if (roleId && !p.archived) m.set(roleId, (m.get(roleId) ?? 0) + 1);
    }
    return m;
  }, [people]);

  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRate, setNewRate] = useState('');
  const [newCost, setNewCost] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRate, setEditRate] = useState('');
  const [editCost, setEditCost] = useState('');

  const filtered = useMemo(() => {
    let list = roles.filter((r) =>
      !search.trim() || r.name.toLowerCase().includes(search.toLowerCase()),
    );
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortCol === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortCol === 'rate') cmp = a.defaultHourlyRate - b.defaultHourlyRate;
      else if (sortCol === 'cost') cmp = a.defaultHourlyCost - b.defaultHourlyCost;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [roles, search, sortCol, sortDir]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await createRole.mutateAsync({
      name: newName.trim(),
      defaultHourlyRate: parseFloat(newRate) || 0,
      defaultHourlyCost: parseFloat(newCost) || 0,
    });
    setNewName('');
    setNewRate('');
    setNewCost('');
    setAdding(false);
  };

  const handleSave = async (id: string) => {
    if (!editName.trim()) return;
    await updateRole.mutateAsync({
      id,
      name: editName.trim(),
      defaultHourlyRate: parseFloat(editRate) || 0,
      defaultHourlyCost: parseFloat(editCost) || 0,
    });
    setEditingId(null);
  };

  const columns: Column<Role>[] = [
    {
      key: 'name',
      header: 'NAME',
      sortable: true,
      render: (row) => {
        if (editingId === row.id) {
          return (
            <div className="flex items-center gap-2">
              <input value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus className="w-36 rounded-md border border-gray-300 px-2 py-1 text-sm" />
              <input type="number" value={editRate} onChange={(e) => setEditRate(e.target.value)} placeholder="Rate/hr" className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm" />
              <input type="number" value={editCost} onChange={(e) => setEditCost(e.target.value)} placeholder="Cost/hr" className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm" />
              <button onClick={() => handleSave(row.id)} className="rounded p-1 text-green-600 hover:bg-green-50"><Check className="h-4 w-4" /></button>
              <button onClick={() => setEditingId(null)} className="rounded p-1 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
            </div>
          );
        }
        return <span className="text-sm font-medium text-gray-900">{row.name}</span>;
      },
    },
    {
      key: 'rate',
      header: 'DEFAULT HOURLY RATE',
      sortable: true,
      render: (row) => editingId === row.id ? null : <span className="text-sm text-gray-600">{formatMoney(row.defaultHourlyRate)}</span>,
    },
    {
      key: 'cost',
      header: 'DEFAULT COST',
      render: (row) => editingId === row.id ? null : <span className="text-sm text-gray-600">{formatMoney(row.defaultHourlyCost)}</span>,
    },
    {
      key: 'people',
      header: 'PEOPLE',
      render: (row) => editingId === row.id ? null : <span className="text-sm text-gray-600">{roleCountMap.get(row.id) ?? 0}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (row) => editingId === row.id ? null : (
        <div className="flex items-center justify-end gap-1">
          <button onClick={(e) => { e.stopPropagation(); setEditingId(row.id); setEditName(row.name); setEditRate(String(row.defaultHourlyRate)); setEditCost(String(row.defaultHourlyCost)); }} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><Pencil className="h-3.5 w-3.5" /></button>
          <button onClick={(e) => { e.stopPropagation(); deleteRole.mutate(row.id); }} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        icon={<Briefcase className="h-6 w-6" />}
        title="Roles"
        count={roles.length}
        actions={
          <Button onClick={() => { setAdding(true); setNewName(''); setNewRate(''); setNewCost(''); }}>
            <Plus className="h-4 w-4" /> New Role
          </Button>
        }
      />

      <ListCard search={search} onSearchChange={setSearch} searchPlaceholder="Search roles...">
        <DataTable<Role>
          columns={columns}
          data={filtered}
          loading={isLoading}
          emptyMessage="No roles yet."
          sortColumn={sortCol}
          sortDirection={sortDir}
          onSort={(key, dir) => { setSortCol(key); setSortDir(dir); }}
        />

        {adding && (
          <div className="flex items-center gap-2 border-t border-gray-100 px-5 py-3">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus placeholder="Role name" onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false); }} className="w-36 rounded-md border border-gray-300 px-2 py-1 text-sm" />
            <input type="number" value={newRate} onChange={(e) => setNewRate(e.target.value)} placeholder="Rate/hr" className="w-28 rounded-md border border-gray-300 px-2 py-1 text-sm" />
            <input type="number" value={newCost} onChange={(e) => setNewCost(e.target.value)} placeholder="Cost/hr" className="w-28 rounded-md border border-gray-300 px-2 py-1 text-sm" />
            <button onClick={handleAdd} className="rounded p-1 text-green-600 hover:bg-green-50"><Check className="h-4 w-4" /></button>
            <button onClick={() => setAdding(false)} className="rounded p-1 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
          </div>
        )}
      </ListCard>
    </div>
  );
}
