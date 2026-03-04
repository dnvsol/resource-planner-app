import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Check, X, Tag } from 'lucide-react';
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from '@/shared/api/hooks';
import type { Tag as TagType } from '@/shared/api/hooks';
import { Button } from '@/shared/components/ui/Button';
import { PageHeader } from '@/shared/components/PageHeader';
import { ListCard } from '@/shared/components/ListCard';
import { DataTable, type Column } from '@/shared/components/DataTable';

type ActiveTab = 'people' | 'projects';

export function TagsPage() {
  const { data: tagsRes, isLoading } = useTags();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();
  const tags: TagType[] = tagsRes?.data ?? [];

  const [activeTab, setActiveTab] = useState<ActiveTab>('people');
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const filtered = useMemo(() => {
    let list = tags.filter((t) => t.entityType === (activeTab === 'people' ? 'person' : 'project'));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q));
    }
    return list;
  }, [tags, activeTab, search]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await createTag.mutateAsync({ name: newName.trim(), entityType: activeTab === 'people' ? 'person' : 'project' });
    setNewName('');
    setAdding(false);
  };

  const handleSave = async (id: string) => {
    if (!editName.trim()) return;
    await updateTag.mutateAsync({ id, name: editName.trim() });
    setEditingId(null);
  };

  const columns: Column<TagType>[] = [
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
          <button onClick={(e) => { e.stopPropagation(); deleteTag.mutate(row.id); }} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader icon={<Tag className="h-6 w-6" />} title="Tags" count={filtered.length} actions={<Button onClick={() => { setAdding(true); setNewName(''); }}><Plus className="h-4 w-4" /> New Tag</Button>} />

      {/* Tabs */}
      <div className="mb-4 border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {(['people', 'projects'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSearch(''); }}
              className={`border-b-2 pb-3 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {tab} Tags
            </button>
          ))}
        </nav>
      </div>

      <ListCard search={search} onSearchChange={setSearch} searchPlaceholder={`Search ${activeTab} tags...`}>
        <DataTable<TagType> columns={columns} data={filtered} loading={isLoading} emptyMessage={`No ${activeTab} tags yet.`} />
        {adding && (
          <div className="flex items-center gap-2 border-t border-gray-100 px-5 py-3">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus placeholder="Tag name" onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false); }} className="w-36 rounded-md border border-gray-300 px-2 py-1 text-sm" />
            <button onClick={handleAdd} className="rounded p-1 text-green-600 hover:bg-green-50"><Check className="h-4 w-4" /></button>
            <button onClick={() => setAdding(false)} className="rounded p-1 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
          </div>
        )}
      </ListCard>
    </div>
  );
}
