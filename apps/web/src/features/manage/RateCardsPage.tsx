import { useState } from 'react';
import { Plus, Trash2, Pencil, CreditCard } from 'lucide-react';
import {
  useRateCards,
  useRateCard,
  useCreateRateCard,
  useUpdateRateCard,
  useDeleteRateCard,
  useCreateRateCardEntry,
  useUpdateRateCardEntry,
  useDeleteRateCardEntry,
  useRoles,
} from '@/shared/api/hooks';
import type { RateCard, Role } from '@/shared/api/hooks';
import { Button } from '@/shared/components/ui/Button';
import { PageHeader } from '@/shared/components/PageHeader';
import { ListCard } from '@/shared/components/ListCard';
import { DataTable, type Column } from '@/shared/components/DataTable';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(v: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(v);
}

// ---------------------------------------------------------------------------
// Rate Card Form Modal
// ---------------------------------------------------------------------------

function RateCardModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: RateCard;
  onClose: () => void;
  onSave: (data: { name: string; cardType: string; rateMode: string; isDefault: boolean }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [cardType, setCardType] = useState<'standard' | 'internal' | 'custom'>(
    (initial?.cardType as 'standard' | 'internal' | 'custom') ?? 'standard',
  );
  const [rateMode, setRateMode] = useState<'per_role' | 'blended'>(
    (initial?.rateMode as 'per_role' | 'blended') ?? 'per_role',
  );
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {initial ? 'Edit Rate Card' : 'New Rate Card'}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="Rate card name"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
            <select
              value={cardType}
              onChange={(e) => setCardType(e.target.value as 'standard' | 'internal' | 'custom')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="standard">Standard</option>
              <option value="internal">Internal</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Rate Mode</label>
            <select
              value={rateMode}
              onChange={(e) => setRateMode(e.target.value as 'per_role' | 'blended')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="per_role">Per Role</option>
              <option value="blended">Blended</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded border-gray-300"
            />
            Default rate card
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={() => onSave({ name, cardType, rateMode, isDefault })}>
            {initial ? 'Save' : 'Create'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rate Card Detail (entries grid)
// ---------------------------------------------------------------------------

function RateCardDetail({
  rateCardId,
  roles,
  onClose,
}: {
  rateCardId: string;
  roles: Role[];
  onClose: () => void;
}) {
  const { data: rateCard, isLoading } = useRateCard(rateCardId);
  const createEntry = useCreateRateCardEntry();
  const updateEntry = useUpdateRateCardEntry();
  const deleteEntry = useDeleteRateCardEntry();

  const [newRoleId, setNewRoleId] = useState('');
  const [newHourly, setNewHourly] = useState('0');
  const [newDaily, setNewDaily] = useState('0');

  if (isLoading || !rateCard) {
    return <div className="animate-pulse py-8 text-center text-sm text-gray-400">Loading...</div>;
  }

  const entries = (rateCard as any).entries ?? [];
  const usedRoleIds = new Set(entries.map((e: any) => e.role_id));
  const availableRoles = roles.filter((r) => !usedRoleIds.has(r.id));

  const handleAdd = () => {
    if (!newRoleId) return;
    createEntry.mutate({ rateCardId, roleId: newRoleId, rateHourly: parseFloat(newHourly) || 0, rateDaily: parseFloat(newDaily) || 0 });
    setNewRoleId('');
    setNewHourly('0');
    setNewDaily('0');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{rateCard.name} &mdash; Entries</h2>
          <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs font-medium uppercase text-gray-500">
              <th className="pb-2">Role</th>
              <th className="pb-2 text-right">Hourly Rate</th>
              <th className="pb-2 text-right">Daily Rate</th>
              <th className="pb-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {entries.map((entry: any) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                rateCardId={rateCardId}
                onUpdate={(hourly, daily) => updateEntry.mutate({ rateCardId, entryId: entry.id, rateHourly: hourly, rateDaily: daily })}
                onDelete={() => deleteEntry.mutate({ rateCardId, entryId: entry.id })}
              />
            ))}
          </tbody>
        </table>
        {entries.length === 0 && <p className="py-6 text-center text-sm text-gray-400">No entries yet.</p>}
        {availableRoles.length > 0 && (
          <div className="mt-4 flex items-end gap-3 border-t pt-4">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-gray-500">Role</label>
              <select value={newRoleId} onChange={(e) => setNewRoleId(e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm">
                <option value="">Select role...</option>
                {availableRoles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="w-28">
              <label className="mb-1 block text-xs font-medium text-gray-500">Hourly</label>
              <input type="number" value={newHourly} onChange={(e) => setNewHourly(e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-right" />
            </div>
            <div className="w-28">
              <label className="mb-1 block text-xs font-medium text-gray-500">Daily</label>
              <input type="number" value={newDaily} onChange={(e) => setNewDaily(e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-right" />
            </div>
            <Button size="sm" onClick={handleAdd} disabled={!newRoleId}><Plus className="h-4 w-4" /></Button>
          </div>
        )}
      </div>
    </div>
  );
}

function EntryRow({ entry, onUpdate, onDelete }: { entry: any; rateCardId: string; onUpdate: (h: number, d: number) => void; onDelete: () => void }) {
  const [editing, setEditing] = useState(false);
  const [hourly, setHourly] = useState(String(entry.rate_hourly));
  const [daily, setDaily] = useState(String(entry.rate_daily));

  if (editing) {
    return (
      <tr>
        <td className="py-2">{entry.role_name}</td>
        <td className="py-2 text-right"><input type="number" value={hourly} onChange={(e) => setHourly(e.target.value)} className="w-24 rounded border px-2 py-1 text-right text-sm" /></td>
        <td className="py-2 text-right"><input type="number" value={daily} onChange={(e) => setDaily(e.target.value)} className="w-24 rounded border px-2 py-1 text-right text-sm" /></td>
        <td className="py-2 text-right"><button className="text-xs text-indigo-600 hover:underline" onClick={() => { onUpdate(parseFloat(hourly) || 0, parseFloat(daily) || 0); setEditing(false); }}>Save</button></td>
      </tr>
    );
  }

  return (
    <tr>
      <td className="py-2 text-gray-900">{entry.role_name}</td>
      <td className="py-2 text-right text-gray-700">{formatCurrency(entry.rate_hourly)}</td>
      <td className="py-2 text-right text-gray-700">{formatCurrency(entry.rate_daily)}</td>
      <td className="py-2 text-right">
        <button onClick={() => setEditing(true)} className="mr-2 text-gray-400 hover:text-gray-600"><Pencil className="inline h-3.5 w-3.5" /></button>
        <button onClick={onDelete} className="text-gray-400 hover:text-red-500"><Trash2 className="inline h-3.5 w-3.5" /></button>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// RateCardsPage
// ---------------------------------------------------------------------------

export function RateCardsPage() {
  const { data: rateCards, isLoading } = useRateCards();
  const { data: rolesData } = useRoles();
  const roles = rolesData?.data ?? [];
  const createRateCard = useCreateRateCard();
  const updateRateCard = useUpdateRateCard();
  const deleteRateCard = useDeleteRateCard();

  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState<RateCard | undefined>();
  const [detailId, setDetailId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'active' | 'archived' | 'all'>('active');

  const handleSave = (data: { name: string; cardType: string; rateMode: string; isDefault: boolean }) => {
    if (editingCard) {
      updateRateCard.mutate({ id: editingCard.id, ...data });
    } else {
      createRateCard.mutate(data);
    }
    setShowModal(false);
    setEditingCard(undefined);
  };

  const filtered = (rateCards ?? []).filter((rc) =>
    !search.trim() || rc.name.toLowerCase().includes(search.toLowerCase()),
  );

  const filterNode = (
    <select
      value={filter}
      onChange={(e) => setFilter(e.target.value as 'active' | 'archived' | 'all')}
      className="rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-700"
    >
      <option value="active">Active</option>
      <option value="archived">Archived</option>
      <option value="all">All</option>
    </select>
  );

  const columns: Column<RateCard>[] = [
    {
      key: 'name',
      header: 'NAME',
      render: (row) => (
        <div className="flex items-center gap-3">
          <CreditCard className="h-4 w-4 text-gray-400" />
          <button
            onClick={(e) => { e.stopPropagation(); setDetailId(row.id); }}
            className="font-medium text-gray-900 hover:text-indigo-600 hover:underline"
          >
            {row.name}
          </button>
          {row.isDefault && (
            <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">default</span>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'TYPE',
      render: (row) => (
        <span className="text-sm capitalize text-gray-600">{row.cardType}</span>
      ),
    },
    {
      key: 'mode',
      header: 'RATE MODE',
      render: (row) => (
        <span className="text-sm text-gray-600">{row.rateMode === 'per_role' ? 'Per Role' : 'Blended'}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button onClick={(e) => { e.stopPropagation(); setEditingCard(row); setShowModal(true); }} className="text-gray-400 hover:text-gray-600">
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); if (confirm('Delete this rate card?')) deleteRateCard.mutate(row.id); }}
            className="text-gray-400 hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        icon={<CreditCard className="h-6 w-6" />}
        title="Rate Cards"
        count={rateCards?.length}
        actions={
          <Button onClick={() => { setEditingCard(undefined); setShowModal(true); }}>
            <Plus className="h-4 w-4" /> New Rate Card
          </Button>
        }
      />

      <ListCard
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search rate cards..."
        filterNode={filterNode}
      >
        <DataTable<RateCard>
          columns={columns}
          data={filtered}
          loading={isLoading}
          onRowClick={(row) => setDetailId(row.id)}
          emptyMessage="No rate cards yet. Create one to define billing rates per role."
        />
      </ListCard>

      {showModal && (
        <RateCardModal
          initial={editingCard}
          onClose={() => { setShowModal(false); setEditingCard(undefined); }}
          onSave={handleSave}
        />
      )}
      {detailId && <RateCardDetail rateCardId={detailId} roles={roles} onClose={() => setDetailId(null)} />}
    </div>
  );
}
