import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, Tag } from 'lucide-react';
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from '@/shared/api/hooks';
import type { Tag as TagType } from '@/shared/api/hooks';
import { Button } from '@/shared/components/ui/Button';
import { PageHeader } from '@/shared/components/PageHeader';
import { ListCard } from '@/shared/components/ListCard';
import { DataTable, type Column } from '@/shared/components/DataTable';

export function TagsPage() {
  const { data: tagsRes, isLoading } = useTags();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();
  const tags: TagType[] = tagsRes?.data ?? [];

  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEntityType, setNewEntityType] = useState<'person' | 'project'>('person');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const filtered = tags.filter((t) =>
    !search.trim() || t.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await createTag.mutateAsync({ name: newName.trim(), entityType: newEntityType });
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
      key: 'entityType',
      header: 'TYPE',
      render: (row) => editingId === row.id ? null : (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-600">{row.entityType}</span>
      ),
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
      <PageHeader icon={<Tag className="h-6 w-6" />} title="Tags" count={tags.length} actions={<Button onClick={() => { setAdding(true); setNewName(''); setNewEntityType('person'); }}><Plus className="h-4 w-4" /> New Tag</Button>} />
      <ListCard search={search} onSearchChange={setSearch} searchPlaceholder="Search tags...">
        <DataTable<TagType> columns={columns} data={filtered} loading={isLoading} emptyMessage="No tags yet." />
        {adding && (
          <div className="flex items-center gap-2 border-t border-gray-100 px-5 py-3">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus placeholder="Tag name" onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false); }} className="w-36 rounded-md border border-gray-300 px-2 py-1 text-sm" />
            <select value={newEntityType} onChange={(e) => setNewEntityType(e.target.value as 'person' | 'project')} className="rounded-md border border-gray-300 px-2 py-1 text-sm">
              <option value="person">Person</option>
              <option value="project">Project</option>
            </select>
            <button onClick={handleAdd} className="rounded p-1 text-green-600 hover:bg-green-50"><Check className="h-4 w-4" /></button>
            <button onClick={() => setAdding(false)} className="rounded p-1 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
          </div>
        )}
      </ListCard>
    </div>
  );
}
