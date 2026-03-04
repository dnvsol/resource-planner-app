import { Settings } from 'lucide-react';
import { PageHeader } from '@/shared/components/PageHeader';

export function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        icon={<Settings className="h-6 w-6" />}
        title="Settings"
      />

      {/* Account section (read-only) */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-gray-900">Account</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 px-5 py-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium uppercase text-gray-500">Account Name</dt>
            <dd className="mt-1 text-sm text-gray-900">DNV Solutions</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-gray-500">Currency</dt>
            <dd className="mt-1 text-sm text-gray-900">USD ($)</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-gray-500">Timezone</dt>
            <dd className="mt-1 text-sm text-gray-900">America/New_York (UTC-5)</dd>
          </div>
        </div>
      </div>
    </div>
  );
}
