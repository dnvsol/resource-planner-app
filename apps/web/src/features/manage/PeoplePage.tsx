import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Pencil } from 'lucide-react';
import {
  usePeople,
  useCreatePerson,
  useUpdatePerson,
  useDeletePerson,
  useTeams,
  useRoles,
} from '@/shared/api/hooks';
import type { Person, Team, Role } from '@/shared/api/hooks';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { PageHeader } from '@/shared/components/PageHeader';
import { ListCard } from '@/shared/components/ListCard';
import { ThreeDotMenu } from '@/shared/components/ui/ThreeDotMenu';

// ---------------------------------------------------------------------------
// Add Person Modal
// ---------------------------------------------------------------------------

function AddPersonModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [teamId, setTeamId] = useState('');
  const createPerson = useCreatePerson();
  const { data: teamsRes } = useTeams();
  const teams: Team[] = teamsRes?.data ?? [];

  const reset = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setTeamId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createPerson.mutateAsync({
      firstName,
      lastName,
      email: email || null,
      teamId: teamId || null,
    });
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="New Person">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">First Name</label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Jane"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Last Name</label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Doe"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="jane@company.com"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Team</label>
          <select
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">No team</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={createPerson.isPending}>Add Person</Button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Row type
// ---------------------------------------------------------------------------

interface PeopleRow extends Person {
  _teamName?: string;
  _roleName?: string;
}

// ---------------------------------------------------------------------------
// PeoplePage
// ---------------------------------------------------------------------------

export function PeoplePage() {
  const navigate = useNavigate();
  const { data: peopleRes, isLoading: peopleLoading } = usePeople();
  const { data: teamsRes } = useTeams();
  const { data: rolesRes } = useRoles();
  const updatePerson = useUpdatePerson();
  const deletePerson = useDeletePerson();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'active' | 'archived' | 'all'>('active');
  const [modalOpen, setModalOpen] = useState(false);
  const [sortCol, setSortCol] = useState('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const people: Person[] = peopleRes?.data ?? [];
  const teams: Team[] = teamsRes?.data ?? [];
  const roles: Role[] = rolesRes?.data ?? [];

  const teamMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of teams) m.set(t.id, t.name);
    return m;
  }, [teams]);

  const roleMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of roles) m.set(r.id, r.name);
    return m;
  }, [roles]);

  const filteredPeople: PeopleRow[] = useMemo(() => {
    let list = people.map((p) => ({
      ...p,
      _teamName: p.teamId ? teamMap.get(p.teamId) : undefined,
      _roleName: (p as any).activeContract?.roleId
        ? roleMap.get((p as any).activeContract.roleId)
        : undefined,
    }));

    if (filter === 'active') list = list.filter((p) => !p.archived);
    else if (filter === 'archived') list = list.filter((p) => p.archived);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => {
        const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
        return fullName.includes(q) || (p.email?.toLowerCase().includes(q) ?? false);
      });
    }

    list.sort((a, b) => {
      let cmp = 0;
      if (sortCol === 'name') {
        cmp = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      } else if (sortCol === 'role') {
        cmp = (a._roleName ?? '').localeCompare(b._roleName ?? '');
      } else if (sortCol === 'team') {
        cmp = (a._teamName ?? '').localeCompare(b._teamName ?? '');
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [people, teamMap, roleMap, search, filter, sortCol, sortDir]);

  const columns: Column<PeopleRow>[] = [
    {
      key: 'name',
      header: 'NAME',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">
            {row.firstName.charAt(0)}{row.lastName.charAt(0)}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/manage/people/${row.id}`); }}
            className="font-medium text-gray-900 hover:text-indigo-600 hover:underline"
          >
            {row.firstName} {row.lastName}
          </button>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'DEFAULT ROLE',
      sortable: true,
      render: (row) => row._roleName ?? <span className="text-gray-400">&mdash;</span>,
    },
    {
      key: 'employment',
      header: 'EMPLOYMENT TYPE',
      render: (row) => {
        const empType = (row as any).activeContract?.employmentType;
        if (!empType) return <span className="text-gray-400">&mdash;</span>;
        return (
          <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium capitalize text-purple-700 ring-1 ring-inset ring-purple-700/10">
            {empType.replace(/_/g, ' ')}
          </span>
        );
      },
    },
    {
      key: 'team',
      header: 'TEAM',
      sortable: true,
      render: (row) =>
        row._teamName ? (
          <span className="text-sm text-gray-600">{row._teamName}</span>
        ) : (
          <span className="text-gray-400">&mdash;</span>
        ),
    },
    {
      key: 'tags',
      header: 'TAGS',
      render: (row) => {
        const tags = (row as any).tags;
        if (!tags || tags.length === 0) return <span className="text-gray-400">&mdash;</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((t: any) => (
              <span key={t.id} className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                {t.name}
              </span>
            ))}
            {tags.length > 3 && <span className="text-xs text-gray-500">+{tags.length - 3}</span>}
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
            { label: 'Edit', icon: <Pencil className="h-3.5 w-3.5" />, onClick: () => navigate(`/manage/people/${row.id}`) },
            { label: row.archived ? 'Unarchive' : 'Archive', onClick: () => updatePerson.mutate({ id: row.id, archived: !row.archived }) },
            { label: 'Delete', onClick: () => { if (confirm(`Delete ${row.firstName} ${row.lastName}?`)) deletePerson.mutate(row.id); }, danger: true },
          ]}
        />
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        icon={<Users className="h-6 w-6" />}
        title="People"
        count={filteredPeople.length}
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            New Person
          </Button>
        }
      />

      <ListCard
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search people..."
        filterNode={filterNode}
      >
        <DataTable<PeopleRow>
          columns={columns}
          data={filteredPeople}
          loading={peopleLoading}
          onRowClick={(row) => navigate(`/manage/people/${row.id}`)}
          emptyMessage="No people found."
          sortColumn={sortCol}
          sortDirection={sortDir}
          onSort={(key, dir) => { setSortCol(key); setSortDir(dir); }}
        />
      </ListCard>

      <AddPersonModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
