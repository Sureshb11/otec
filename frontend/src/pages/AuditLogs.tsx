import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient, AuditLogEntry } from '../api/apiClient';

const PAGE_SIZE = 50;

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-GB', { timeZone: 'Asia/Kuwait' });
  } catch {
    return iso;
  }
}

const actionColor = (action: string): string => {
  if (action.includes('delete') || action.includes('deactivate')) return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300';
  if (action.includes('create')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300';
  if (action.includes('password')) return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300';
  if (action.includes('role')) return 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300';
  return 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300';
};

const AuditLogs = () => {
  const [page, setPage] = useState(0);
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['audit-logs', page, actionFilter, resourceFilter],
    queryFn: () =>
      apiClient.audit.list({
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        action: actionFilter || undefined,
        resource: resourceFilter || undefined,
      }),
    keepPreviousData: true,
  });

  const items = (data?.items ?? []) as AuditLogEntry[];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 tracking-tight">
            Audit Log
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Sensitive actions recorded by the system (Admin only).
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-bold shadow-md disabled:opacity-50"
          disabled={isFetching}
        >
          {isFetching ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="glass-premium dark:bg-boxdark/90 rounded-2xl shadow-xl p-4 mb-4 border border-white/20 dark:border-white/5">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            value={actionFilter}
            onChange={(e) => {
              setPage(0);
              setActionFilter(e.target.value);
            }}
            placeholder="Filter by action (e.g. user.create)"
            className="flex-1 px-3 py-2 border border-slate-200 dark:border-strokedark rounded-xl bg-white/70 dark:bg-boxdark text-sm dark:text-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
          />
          <input
            value={resourceFilter}
            onChange={(e) => {
              setPage(0);
              setResourceFilter(e.target.value);
            }}
            placeholder="Filter by resource (e.g. user)"
            className="md:w-64 px-3 py-2 border border-slate-200 dark:border-strokedark rounded-xl bg-white/70 dark:bg-boxdark text-sm dark:text-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="glass-premium dark:bg-boxdark/90 rounded-2xl shadow-xl border border-white/20 dark:border-white/5 overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-slate-500">Loading…</div>
        ) : error ? (
          <div className="p-10 text-center text-rose-500 font-semibold">
            {((error as any)?.response?.data?.message as string) || 'Failed to load audit logs'}
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-slate-500">No entries match the current filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50/80 dark:bg-boxdark-2/60 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">When</th>
                  <th className="px-4 py-3 text-left">Action</th>
                  <th className="px-4 py-3 text-left">Resource</th>
                  <th className="px-4 py-3 text-left">Resource ID</th>
                  <th className="px-4 py-3 text-left">Actor</th>
                  <th className="px-4 py-3 text-left">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/70 dark:divide-white/5">
                {items.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/40 dark:hover:bg-boxdark-2/40">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {formatDate(entry.createdAt)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-[11px] font-bold ${actionColor(entry.action)}`}>
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{entry.resource}</td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-500">{entry.resourceId ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{entry.actorEmail ?? entry.actorId ?? '—'}</td>
                    <td className="px-4 py-3">
                      {entry.metadata ? (
                        <details className="text-xs text-slate-500 dark:text-slate-400">
                          <summary className="cursor-pointer">view</summary>
                          <pre className="mt-1 p-2 bg-slate-100/60 dark:bg-boxdark-2/80 rounded-md overflow-auto max-w-md">{JSON.stringify(entry.metadata, null, 2)}</pre>
                        </details>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 text-sm text-slate-500 dark:text-slate-400">
        <div>
          {total > 0
            ? `Showing ${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, total)} of ${total}`
            : 'No entries'}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0 || isFetching}
            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-boxdark-2 disabled:opacity-40 font-bold"
          >
            Prev
          </button>
          <span className="px-2 py-1.5">
            Page {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page + 1 >= totalPages || isFetching}
            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-boxdark-2 disabled:opacity-40 font-bold"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
