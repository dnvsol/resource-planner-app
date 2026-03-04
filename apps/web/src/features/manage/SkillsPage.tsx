import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Check, X, Zap } from 'lucide-react';
import { useSkills, useCreateSkill, useUpdateSkill, useDeleteSkill, usePeople } from '@/shared/api/hooks';
import type { Skill, Person } from '@/shared/api/hooks';
import { Button } from '@/shared/components/ui/Button';
import { PageHeader } from '@/shared/components/PageHeader';
import { ListCard } from '@/shared/components/ListCard';
import { DataTable, type Column } from '@/shared/components/DataTable';

type ActiveTab = 'skills' | 'people';

export function SkillsPage() {
  const { data: skillsRes, isLoading } = useSkills();
  const createSkill = useCreateSkill();
  const updateSkill = useUpdateSkill();
  const deleteSkill = useDeleteSkill();
  const { data: peopleRes } = usePeople();
  const skills: Skill[] = skillsRes?.data ?? [];
  const people: Person[] = peopleRes?.data ?? [];

  const [activeTab, setActiveTab] = useState<ActiveTab>('skills');
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const filteredSkills = useMemo(() => {
    let list = skills;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q));
    }
    return list;
  }, [skills, search]);

  // People with skills
  const peopleWithSkills = useMemo(() => {
    let list = people.filter((p) => {
      const ps = (p as any).skills;
      return ps && ps.length > 0;
    });
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => `${p.firstName} ${p.lastName}`.toLowerCase().includes(q));
    }
    return list;
  }, [people, search]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await createSkill.mutateAsync({ name: newName.trim() });
    setNewName('');
    setAdding(false);
  };

  const handleSave = async (id: string) => {
    if (!editName.trim()) return;
    await updateSkill.mutateAsync({ id, name: editName.trim() });
    setEditingId(null);
  };

  const skillColumns: Column<Skill>[] = [
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
      key: 'actions',
      header: '',
      render: (row) => editingId === row.id ? null : (
        <div className="flex items-center justify-end gap-1">
          <button onClick={(e) => { e.stopPropagation(); setEditingId(row.id); setEditName(row.name); }} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><Pencil className="h-3.5 w-3.5" /></button>
          <button onClick={(e) => { e.stopPropagation(); deleteSkill.mutate(row.id); }} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      ),
    },
  ];

  const peopleColumns: Column<Person>[] = [
    {
      key: 'name',
      header: 'NAME',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">
            {row.firstName.charAt(0)}{row.lastName.charAt(0)}
          </div>
          <span className="text-sm font-medium text-gray-900">{row.firstName} {row.lastName}</span>
        </div>
      ),
    },
    {
      key: 'skills',
      header: 'SKILLS',
      render: (row) => {
        const ps = (row as any).skills ?? [];
        return (
          <div className="flex flex-wrap gap-1.5">
            {ps.map((s: any) => (
              <span key={s.id} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                {s.name}
                <span className="text-yellow-500">{'★'.repeat(s.level)}</span>
              </span>
            ))}
          </div>
        );
      },
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        icon={<Zap className="h-6 w-6" />}
        title="Skills"
        count={activeTab === 'skills' ? filteredSkills.length : peopleWithSkills.length}
        actions={activeTab === 'skills' ? <Button onClick={() => { setAdding(true); setNewName(''); }}><Plus className="h-4 w-4" /> New Skill</Button> : undefined}
      />

      {/* Tabs */}
      <div className="mb-4 border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {(['skills', 'people'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSearch(''); }}
              className={`border-b-2 pb-3 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'skills' ? (
        <ListCard search={search} onSearchChange={setSearch} searchPlaceholder="Search skills...">
          <DataTable<Skill> columns={skillColumns} data={filteredSkills} loading={isLoading} emptyMessage="No skills yet." />
          {adding && (
            <div className="flex items-center gap-2 border-t border-gray-100 px-5 py-3">
              <input value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus placeholder="Skill name" onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false); }} className="w-48 rounded-md border border-gray-300 px-2 py-1 text-sm" />
              <button onClick={handleAdd} className="rounded p-1 text-green-600 hover:bg-green-50"><Check className="h-4 w-4" /></button>
              <button onClick={() => setAdding(false)} className="rounded p-1 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
            </div>
          )}
        </ListCard>
      ) : (
        <ListCard search={search} onSearchChange={setSearch} searchPlaceholder="Search people...">
          <DataTable<Person> columns={peopleColumns} data={peopleWithSkills} emptyMessage="No people with skills." />
        </ListCard>
      )}
    </div>
  );
}
