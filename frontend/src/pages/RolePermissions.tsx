import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import {
  ACTION_COLUMN,
  ACTION_LABEL,
  MODULES,
  ModuleDefinition,
  PermissionAction,
} from '../config/permissions';

interface PermissionRow {
  id?: string;
  moduleName: string;
  feature: string;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

interface Role {
  id: string;
  name: string;
  description?: string;
}

const ALL_ACTIONS: PermissionAction[] = ['view', 'add', 'edit', 'delete'];

const IconArrowLeft = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const IconCheck = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
);

const IconShield = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const IconSave = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const IconSpinner = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

/**
 * Build the matrix state from the modules config + whatever rows the API
 * returned. Always returns exactly one row per canonical module — preserves
 * existing toggles where possible.
 */
const buildInitialState = (
  apiPermissions: PermissionRow[] | undefined,
  isAdmin: boolean,
): Record<string, PermissionRow> => {
  const byKey = new Map<string, PermissionRow>();
  (apiPermissions ?? []).forEach((p) => {
    byKey.set(p.moduleName.toLowerCase(), p);
  });

  const state: Record<string, PermissionRow> = {};
  for (const mod of MODULES) {
    const existing = byKey.get(mod.key);
    state[mod.key] = {
      id: existing?.id,
      moduleName: mod.key,
      feature: mod.label,
      canView: isAdmin ? true : existing?.canView ?? false,
      canAdd: isAdmin ? true : existing?.canAdd ?? false,
      canEdit: isAdmin ? true : existing?.canEdit ?? false,
      canDelete: isAdmin ? true : existing?.canDelete ?? false,
    };
  }
  return state;
};

const RolePermissions = () => {
  const navigate = useNavigate();
  const { roleId } = useParams<{ roleId: string }>();
  const queryClient = useQueryClient();
  const [matrix, setMatrix] = useState<Record<string, PermissionRow>>({});
  const [dirty, setDirty] = useState(false);

  const { data: role } = useQuery<Role>({
    queryKey: ['role', roleId],
    queryFn: () => apiClient.roles.getById(roleId!),
    enabled: !!roleId,
  });

  const isSuperAdmin = role?.name?.toLowerCase() === 'super_admin';
  const isLocked = isSuperAdmin; // Only super_admin is locked; admin is now editable

  const { data: apiPermissions, isLoading } = useQuery<PermissionRow[]>({
    queryKey: ['permissions', roleId],
    queryFn: () => apiClient.permissions.getByRoleId(roleId!),
    enabled: !!roleId,
  });

  // Hydrate the matrix once both role + permissions are loaded.
  useEffect(() => {
    if (!role) return;
    setMatrix(buildInitialState(apiPermissions, isLocked));
    setDirty(false);
  }, [role, apiPermissions, isLocked]);

  // Warn on navigation when there are unsaved changes.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = MODULES.map((mod) => {
        const row = matrix[mod.key];
        return {
          moduleName: mod.key,
          feature: mod.label,
          canView: row?.canView ?? false,
          canAdd: row?.canAdd ?? false,
          canEdit: row?.canEdit ?? false,
          canDelete: row?.canDelete ?? false,
        };
      });
      return apiClient.permissions.bulkUpdate(roleId!, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions', roleId] });
      setDirty(false);
    },
  });

  const setCell = (moduleKey: string, action: PermissionAction, value: boolean) => {
    if (isLocked) return;
    setMatrix((prev) => {
      const row = prev[moduleKey];
      if (!row) return prev;
      const col = ACTION_COLUMN[action];
      // If turning off "view" for a module, also turn off the others — you can't add/edit what you can't see.
      const next: PermissionRow = { ...row, [col]: value };
      if (action === 'view' && !value) {
        next.canAdd = false;
        next.canEdit = false;
        next.canDelete = false;
      }
      // Conversely, enabling any non-view action implies view.
      if (action !== 'view' && value) {
        next.canView = true;
      }
      return { ...prev, [moduleKey]: next };
    });
    setDirty(true);
  };

  const setRowAll = (moduleKey: string, value: boolean) => {
    if (isLocked) return;
    const mod = MODULES.find((m) => m.key === moduleKey);
    if (!mod) return;
    setMatrix((prev) => {
      const row = prev[moduleKey];
      if (!row) return prev;
      const next: PermissionRow = { ...row };
      mod.actions.forEach((a) => {
        next[ACTION_COLUMN[a]] = value;
      });
      return { ...prev, [moduleKey]: next };
    });
    setDirty(true);
  };

  const setColumnAll = (action: PermissionAction, value: boolean) => {
    if (isLocked) return;
    setMatrix((prev) => {
      const next = { ...prev };
      MODULES.forEach((mod) => {
        if (!mod.actions.includes(action)) return;
        const row = next[mod.key];
        if (!row) return;
        const updated: PermissionRow = { ...row, [ACTION_COLUMN[action]]: value };
        // Same view-coupling rule as setCell.
        if (action === 'view' && !value) {
          updated.canAdd = false;
          updated.canEdit = false;
          updated.canDelete = false;
        }
        if (action !== 'view' && value) {
          updated.canView = true;
        }
        next[mod.key] = updated;
      });
      return next;
    });
    setDirty(true);
  };

  const setEverything = (value: boolean) => {
    if (isLocked) return;
    setMatrix((prev) => {
      const next = { ...prev };
      MODULES.forEach((mod) => {
        const row = next[mod.key];
        if (!row) return;
        const updated: PermissionRow = { ...row };
        mod.actions.forEach((a) => {
          updated[ACTION_COLUMN[a]] = value;
        });
        next[mod.key] = updated;
      });
      return next;
    });
    setDirty(true);
  };

  const isColumnFull = (action: PermissionAction) => {
    return MODULES.every((mod) => {
      if (!mod.actions.includes(action)) return true;
      return matrix[mod.key]?.[ACTION_COLUMN[action]] === true;
    });
  };

  const isRowFull = (mod: ModuleDefinition) =>
    mod.actions.every((a) => matrix[mod.key]?.[ACTION_COLUMN[a]] === true);

  const groups = useMemo(
    () => ({
      main: MODULES.filter((m) => m.group === 'main'),
      administration: MODULES.filter((m) => m.group === 'administration'),
    }),
    [],
  );

  const totalEnabled = useMemo(() => {
    let count = 0;
    let total = 0;
    MODULES.forEach((mod) => {
      mod.actions.forEach((a) => {
        total += 1;
        if (matrix[mod.key]?.[ACTION_COLUMN[a]]) count += 1;
      });
    });
    return { count, total };
  }, [matrix]);

  if (isLoading || !role) {
    return (
      <div className="flex items-center justify-center h-64">
        <IconSpinner className="w-6 h-6 text-sky-500" />
      </div>
    );
  }

  return (
    <div className="px-6 py-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-6 flex-wrap">
        <div>
          <button
            onClick={() => navigate('/roles')}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-3 transition-colors"
          >
            <IconArrowLeft className="w-4 h-4" />
            Back to Roles
          </button>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white capitalize tracking-tight">
            {role.name} Permissions
          </h1>
          {role.description && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {role.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Permissions enabled
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {totalEnabled.count}
              <span className="text-sm font-bold text-slate-400 ml-1">
                / {totalEnabled.total}
              </span>
            </div>
          </div>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={isLocked || !dirty || saveMutation.isLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold shadow-lg shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all"
          >
            {saveMutation.isLoading ? (
              <IconSpinner className="w-4 h-4" />
            ) : (
              <IconSave className="w-4 h-4" />
            )}
            {saveMutation.isLoading ? 'Saving…' : dirty ? 'Save Changes' : 'Saved'}
          </button>
        </div>
      </div>

      {/* Admin lock banner */}
      {isLocked && (
        <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/30">
          <IconShield className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
          <div>
            <div className="text-sm font-bold text-sky-900 dark:text-sky-200">
              Super Admin role has full access by design
            </div>
            <div className="text-xs text-sky-700/80 dark:text-sky-300/80">
              Permissions for the Super Admin role are locked to prevent accidental
              lockouts. Edit other roles (including Admin) to restrict access.
            </div>
          </div>
        </div>
      )}

      {/* Bulk-action toolbar */}
      {!isLocked && (
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={() => setEverything(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100 dark:hover:bg-sky-500/20 border border-sky-200 dark:border-sky-500/30 transition-colors"
          >
            Allow everything
          </button>
          <button
            onClick={() => setEverything(false)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/40 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-600 transition-colors"
          >
            Deny everything
          </button>
          {dirty && (
            <span className="ml-auto text-xs font-bold text-amber-600 dark:text-amber-400">
              Unsaved changes
            </span>
          )}
        </div>
      )}

      {/* Matrix */}
      <div className="rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700">
              <th className="text-left px-5 py-3 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em] w-[40%]">
                Module
              </th>
              {ALL_ACTIONS.map((action) => (
                <th key={action} className="px-3 py-3 text-center text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em]">
                  <div className="flex flex-col items-center gap-1">
                    <span>{ACTION_LABEL[action]}</span>
                    <button
                      onClick={() => setColumnAll(action, !isColumnFull(action))}
                      disabled={isLocked}
                      className="text-[9px] font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {isColumnFull(action) ? 'Clear all' : 'All'}
                    </button>
                  </div>
                </th>
              ))}
              <th className="px-3 py-3 text-center text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em] w-[80px]">
                Row
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {(['main', 'administration'] as const).map((groupKey) => (
              <>
                <tr key={`group-${groupKey}`} className="bg-slate-50/60 dark:bg-slate-900/20">
                  <td colSpan={6} className="px-5 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                    {groupKey === 'main' ? 'Main Menu' : 'Administration'}
                  </td>
                </tr>
                {groups[groupKey].map((mod) => {
                  const row = matrix[mod.key];
                  return (
                    <tr
                      key={mod.key}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-700/20 transition-colors"
                    >
                      <td className="px-5 py-3.5 text-[14px] font-bold text-slate-900 dark:text-white">
                        {mod.label}
                      </td>
                      {ALL_ACTIONS.map((action) => {
                        const supported = mod.actions.includes(action);
                        const checked = !!row?.[ACTION_COLUMN[action]];
                        return (
                          <td key={action} className="px-3 py-3.5 text-center">
                            {supported ? (
                              <button
                                onClick={() => setCell(mod.key, action, !checked)}
                                disabled={isLocked}
                                aria-label={`${mod.label} ${ACTION_LABEL[action]}`}
                                className={`inline-flex items-center justify-center w-6 h-6 rounded-md border-2 transition-all ${
                                  checked
                                    ? 'bg-sky-600 border-sky-600 text-white shadow-sm shadow-sky-500/30'
                                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-sky-400'
                                } ${isLocked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                              >
                                {checked && <IconCheck className="w-4 h-4" />}
                              </button>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-3.5 text-center">
                        <button
                          onClick={() => setRowAll(mod.key, !isRowFull(mod))}
                          disabled={isLocked}
                          className="text-[10px] font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          {isRowFull(mod) ? 'Clear' : 'All'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {saveMutation.isError && (
        <div className="mt-4 text-sm font-bold text-rose-600 dark:text-rose-400">
          Failed to save permissions. Please try again.
        </div>
      )}
    </div>
  );
};

export default RolePermissions;
