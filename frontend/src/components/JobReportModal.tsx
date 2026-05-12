/**
 * JobReportModal — triggered when a Kanban card is dragged to "Job Done & Return".
 *
 * Features:
 *  • Auto-populated from order data
 *  • Printable / PDF-export via window.print()
 *  • Signed hardcopy upload (stored in local state, displayed as attachment icon)
 *  • Admin-only editing with timestamped audit trail
 *  • Non-admin users see read-only view (no edit button)
 */

import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { useAuthStore } from '../store/authStore';
import { fmtKwDateTime } from '../utils/kuwaitTime';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReportTool {
  toolId: string;
  toolName: string;
  serialNumber?: string;
  size?: string;
  quantity?: number;
}

export interface JobReportData {
  reportNumber: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  locationName?: string;
  rigName?: string;
  jobStartDate: string;
  jobEndDate: string;
  tools: ReportTool[];
  assignedPersonnel: string;
  notes?: string;
  operationSummary?: string;
  returnCondition?: string;
  hoursOnsite?: string;
  standbyHours?: string;
  operationHours?: string;
  signedOffBy?: string;
  otecRepName?: string;
  otecRepDate?: string;
  clientRepName?: string;
  clientRepDate?: string;
  hardcopyFile?: File | null;
  hardcopyFileName?: string;
}

interface AuditEntry {
  timestamp: string;
  editor: string;
  field: string;
  oldValue: string;
  newValue: string;
}

interface JobReportModalProps {
  reportData: JobReportData;
  onClose: () => void;
  onConfirm: (data: JobReportData) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const nowFmt = () =>
  format(new Date(), 'dd MMM yyyy, HH:mm:ss');

const safeFmtDateTime = (d?: string) => {
  if (!d) return '—';
  return fmtKwDateTime(d, '—');
};

// Converts an ISO timestamp to the `datetime-local` input format (no timezone)
const toDateTimeLocal = (d?: string): string => {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const fromDateTimeLocal = (s: string): string => {
  if (!s) return '';
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toISOString();
};

// ─── Editable field renderer (hoisted so input identity is stable across renders) ──

interface EditableTextProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
  editMode: boolean;
}

const EditableText = ({
  label,
  value,
  onChange,
  multiline = false,
  placeholder = '',
  editMode,
}: EditableTextProps) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</label>
    {editMode ? (
      multiline ? (
        <textarea
          rows={3}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-sm bg-white dark:bg-meta-4 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:outline-none resize-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-sm bg-white dark:bg-meta-4 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
        />
      )
    ) : (
      <p className="text-sm font-semibold text-slate-800 dark:text-white min-h-[1.5rem]">
        {value || <span className="text-slate-400 italic">—</span>}
      </p>
    )}
  </div>
);

interface EditableDateTimeProps {
  label: string;
  value: string;
  onChange: (isoValue: string) => void;
  editMode: boolean;
}

const EditableDateTime = ({ label, value, onChange, editMode }: EditableDateTimeProps) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</label>
    {editMode ? (
      <input
        type="datetime-local"
        value={toDateTimeLocal(value)}
        onChange={(e) => onChange(fromDateTimeLocal(e.target.value))}
        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-sm bg-white dark:bg-meta-4 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
      />
    ) : (
      <p className="text-sm font-semibold text-slate-800 dark:text-white min-h-[1.5rem]">
        {safeFmtDateTime(value)}
      </p>
    )}
  </div>
);

interface InlineCellInputProps {
  value: string;
  onChange: (v: string) => void;
  type?: 'text' | 'number';
  placeholder?: string;
}

const InlineCellInput = ({ value, onChange, type = 'text', placeholder }: InlineCellInputProps) => (
  <input
    type={type}
    value={value}
    placeholder={placeholder}
    onChange={(e) => onChange(e.target.value)}
    className="w-full px-2 py-1 rounded border border-slate-200 dark:border-white/10 text-sm bg-white dark:bg-meta-4 text-slate-800 dark:text-white focus:ring-1 focus:ring-blue-500/40 focus:outline-none"
  />
);

// ─── Component ────────────────────────────────────────────────────────────────

const JobReportModal = ({ reportData: initialData, onClose, onConfirm }: JobReportModalProps) => {
  const { isAdmin, user } = useAuthStore();
  const adminMode = isAdmin();

  const [data, setData] = useState<JobReportData>(initialData);
  const [editMode, setEditMode] = useState(false);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [showAudit, setShowAudit] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const field = <T extends keyof JobReportData>(key: T, val: JobReportData[T]) => {
    const old = String(data[key] ?? '');
    const nw = String(val ?? '');
    if (old !== nw && adminMode) {
      setAuditLog(prev => [
        {
          timestamp: nowFmt(),
          editor: `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Admin',
          field: key,
          oldValue: old,
          newValue: nw,
        },
        ...prev,
      ]);
    }
    setData(prev => ({ ...prev, [key]: val }));
  };

  const updateTool = (index: number, key: keyof ReportTool, val: string | number) => {
    setData(prev => {
      const oldTool = prev.tools[index];
      const oldVal = String((oldTool as any)?.[key] ?? '');
      const newVal = String(val ?? '');
      if (oldVal !== newVal && adminMode) {
        setAuditLog(p => [
          {
            timestamp: nowFmt(),
            editor: `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Admin',
            field: `tools[${index}].${key}`,
            oldValue: oldVal,
            newValue: newVal,
          },
          ...p,
        ]);
      }
      const nextTools = prev.tools.map((t, i) => (i === index ? { ...t, [key]: val } : t));
      return { ...prev, tools: nextTools };
    });
  };

  const removeTool = (index: number) => {
    setData(prev => {
      const removed = prev.tools[index];
      if (removed && adminMode) {
        setAuditLog(p => [
          {
            timestamp: nowFmt(),
            editor: `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Admin',
            field: `tools[${index}]`,
            oldValue: `${removed.toolName} (${removed.serialNumber ?? '—'})`,
            newValue: 'removed',
          },
          ...p,
        ]);
      }
      return { ...prev, tools: prev.tools.filter((_, i) => i !== index) };
    });
  };

  const addTool = () => {
    setData(prev => ({
      ...prev,
      tools: [
        ...prev.tools,
        { toolId: `manual-${Date.now()}`, toolName: '', serialNumber: '', size: '', quantity: 1 },
      ],
    }));
  };

  // ── File upload ──
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    // Simulate a brief upload
    setTimeout(() => {
      field('hardcopyFile', file);
      field('hardcopyFileName', file.name);
      setUploadingFile(false);
    }, 800);
  };

  // ── Print ──
  const handlePrint = () => {
    const printContent = document.getElementById('job-report-print');
    if (!printContent) { window.print(); return; }
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) { window.print(); return; }
    win.document.write(`
      <html><head><title>Job Report #${data.reportNumber}</title>
      <style>
        body { font-family: sans-serif; padding: 24px; color: #1e293b; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #e2e8f0; padding: 6px 12px; font-size: 12px; }
        th { background: #f8fafc; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
        h1 { font-size: 20px; font-weight: 900; margin: 0; }
        h3 { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin: 16px 0 8px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
        .label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 2px; }
        .value { font-size: 13px; font-weight: 600; }
        .hr { border: none; border-top: 2px solid #e2e8f0; margin: 12px 0; }
        .sign-box { height: 48px; border-bottom: 2px dashed #cbd5e1; margin-bottom: 8px; }
      </style>
      </head><body>${printContent.innerHTML}</body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  // ── Confirm (close job) ──
  const handleConfirm = () => {
    onConfirm(data);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-boxdark rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col overflow-hidden">

        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-gradient-to-r from-slate-50 to-white dark:from-boxdark-2 dark:to-boxdark">
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white">Job Completion Report</h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Report #{data.reportNumber} · Order #{data.orderNumber}
              {data.hardcopyFileName && (
                <span className="ml-2 inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  Hardcopy attached
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Print */}
            <button onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-meta-4 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print / PDF
            </button>

            {/* Admin edit toggle */}
            {adminMode && (
              <button
                onClick={() => setEditMode(!editMode)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-colors ${
                  editMode
                    ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                    : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-meta-4'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                {editMode ? 'Stop Editing' : 'Edit (Admin)'}
              </button>
            )}

            {/* Audit trail — admin only */}
            {adminMode && auditLog.length > 0 && (
              <button
                onClick={() => setShowAudit(!showAudit)}
                className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Audit ({auditLog.length})
              </button>
            )}

            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-meta-4 transition-colors text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Audit Trail Panel ── */}
        {showAudit && adminMode && auditLog.length > 0 && (
          <div className="px-6 py-4 bg-purple-50 dark:bg-purple-900/10 border-b border-purple-100 dark:border-purple-500/20">
            <h3 className="text-xs font-black text-purple-700 dark:text-purple-300 uppercase tracking-wider mb-3">
              Admin Edit Audit Trail
            </h3>
            <div className="space-y-2 max-h-36 overflow-y-auto">
              {auditLog.map((entry, i) => (
                <div key={i} className="text-xs flex flex-wrap gap-x-3 text-slate-600 dark:text-slate-400 border-l-2 border-purple-400 pl-2">
                  <span className="font-black text-purple-600 dark:text-purple-300">{entry.timestamp}</span>
                  <span className="font-bold">{entry.editor}</span>
                  <span>changed <span className="italic text-slate-500">{entry.field}</span></span>
                  <span className="text-red-500 line-through">{entry.oldValue || '—'}</span>
                  <span className="text-emerald-600">→ {entry.newValue || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto">
          {/* ── Printable report content ── */}
          <div ref={printRef} id="job-report-print" className="p-6 space-y-6">

            {/* OTEC letterhead */}
            <div className="flex items-center justify-between pb-4 border-b-2 border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-black text-lg tracking-wide">O</span>
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-widest">OTEC</h1>
                  <p className="text-[10px] text-slate-400 font-bold tracking-[0.2em] uppercase">Oil Technology Equipment Co.</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">Job Completion Report</p>
                <p className="text-[11px] text-slate-400 font-mono mt-1">#{data.reportNumber}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{format(new Date(), 'dd MMM yyyy')}</p>
              </div>
            </div>

            {/* ── Section 1: Job Details ── */}
            <div>
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-5 h-px bg-slate-300 dark:bg-white/20 block" />
                1. Job Details
                <span className="flex-1 h-px bg-slate-300 dark:bg-white/20 block" />
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Order Number</span>
                  <p className="text-sm font-bold text-slate-800 dark:text-white">#{data.orderNumber}</p>
                </div>
                <EditableText
                  editMode={editMode}
                  label="Customer"
                  value={data.customerName}
                  onChange={(v) => field('customerName', v)}
                />
                <EditableText
                  editMode={editMode}
                  label="Location"
                  value={data.locationName || ''}
                  onChange={(v) => field('locationName', v)}
                />
                <EditableText
                  editMode={editMode}
                  label="Rig"
                  value={data.rigName || ''}
                  onChange={(v) => field('rigName', v)}
                />
                <EditableDateTime
                  editMode={editMode}
                  label="Job Start"
                  value={data.jobStartDate}
                  onChange={(v) => field('jobStartDate', v)}
                />
                <EditableDateTime
                  editMode={editMode}
                  label="Job End"
                  value={data.jobEndDate}
                  onChange={(v) => field('jobEndDate', v)}
                />
              </div>
            </div>

            {/* ── Section 2: Tools Used ── */}
            <div>
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-5 h-px bg-slate-300 dark:bg-white/20 block" />
                2. Tools Used
                <span className="flex-1 h-px bg-slate-300 dark:bg-white/20 block" />
                {editMode && (
                  <button
                    onClick={addTool}
                    className="ml-2 print:hidden px-2 py-1 rounded-md border border-slate-200 dark:border-white/10 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors normal-case tracking-normal"
                  >
                    + Add row
                  </button>
                )}
              </h3>
              {data.tools.length > 0 ? (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-meta-4">
                      <th className="text-left px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 border border-slate-200 dark:border-white/10">#</th>
                      <th className="text-left px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 border border-slate-200 dark:border-white/10">Tool Name</th>
                      <th className="text-left px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 border border-slate-200 dark:border-white/10">Serial No.</th>
                      <th className="text-left px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 border border-slate-200 dark:border-white/10">Size</th>
                      <th className="text-right px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 border border-slate-200 dark:border-white/10">Qty</th>
                      {editMode && (
                        <th className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 border border-slate-200 dark:border-white/10 print:hidden text-center">Remove</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {data.tools.map((t, i) => (
                      <tr key={t.toolId} className={i % 2 === 0 ? 'bg-white dark:bg-boxdark' : 'bg-slate-50/50 dark:bg-meta-4/30'}>
                        <td className="px-3 py-2.5 text-slate-400 border border-slate-200 dark:border-white/10 text-xs">{i + 1}</td>
                        <td className="px-2 py-1.5 border border-slate-200 dark:border-white/10">
                          {editMode ? (
                            <InlineCellInput value={t.toolName} onChange={(v) => updateTool(i, 'toolName', v)} />
                          ) : (
                            <span className="font-semibold text-slate-800 dark:text-white">{t.toolName}</span>
                          )}
                        </td>
                        <td className="px-2 py-1.5 border border-slate-200 dark:border-white/10">
                          {editMode ? (
                            <InlineCellInput value={t.serialNumber || ''} onChange={(v) => updateTool(i, 'serialNumber', v)} />
                          ) : (
                            <span className="font-mono text-slate-500 dark:text-slate-400 text-xs">{t.serialNumber || '—'}</span>
                          )}
                        </td>
                        <td className="px-2 py-1.5 border border-slate-200 dark:border-white/10">
                          {editMode ? (
                            <InlineCellInput value={t.size || ''} onChange={(v) => updateTool(i, 'size', v)} />
                          ) : (
                            <span className="text-slate-600 dark:text-slate-300">{t.size || '—'}</span>
                          )}
                        </td>
                        <td className="px-2 py-1.5 border border-slate-200 dark:border-white/10 text-right">
                          {editMode ? (
                            <InlineCellInput
                              type="number"
                              value={String(t.quantity ?? 1)}
                              onChange={(v) => updateTool(i, 'quantity', v === '' ? 0 : Number(v))}
                            />
                          ) : (
                            <span className="font-bold text-slate-800 dark:text-white">{t.quantity ?? 1}</span>
                          )}
                        </td>
                        {editMode && (
                          <td className="px-2 py-1.5 border border-slate-200 dark:border-white/10 text-center print:hidden">
                            <button
                              onClick={() => removeTool(i)}
                              className="text-rose-500 hover:text-rose-700 text-xs font-bold"
                              aria-label="Remove tool row"
                            >
                              ×
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div>
                  <p className="text-sm text-slate-400 italic">No tools recorded for this order.</p>
                  {editMode && (
                    <button
                      onClick={addTool}
                      className="mt-2 px-3 py-1.5 rounded-md border border-slate-200 dark:border-white/10 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors print:hidden"
                    >
                      + Add tool row
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── Section 3: Operation Details ── */}
            <div>
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-5 h-px bg-slate-300 dark:bg-white/20 block" />
                3. Operation Details
                <span className="flex-1 h-px bg-slate-300 dark:bg-white/20 block" />
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <EditableText
                  editMode={editMode}
                  label="Hours Onsite (Total)"
                  value={data.hoursOnsite || ''}
                  onChange={v => field('hoursOnsite', v)}
                  placeholder="e.g. 48h 30m"
                />
                <EditableText
                  editMode={editMode}
                  label="Standby Hours"
                  value={data.standbyHours || ''}
                  onChange={v => field('standbyHours', v)}
                  placeholder="e.g. 12h 15m"
                />
                <EditableText
                  editMode={editMode}
                  label="Operation / Running Hours"
                  value={data.operationHours || ''}
                  onChange={v => field('operationHours', v)}
                  placeholder="e.g. 36h 15m"
                />
                <EditableText
                  editMode={editMode}
                  label="Assigned Personnel"
                  value={data.assignedPersonnel}
                  onChange={v => field('assignedPersonnel', v)}
                />
                <EditableText
                  editMode={editMode}
                  label="Return Condition"
                  value={data.returnCondition || ''}
                  onChange={v => field('returnCondition', v)}
                  placeholder="e.g. Good / Minor wear / Damaged"
                />
                <EditableText
                  editMode={editMode}
                  label="Signed Off By"
                  value={data.signedOffBy || ''}
                  onChange={v => field('signedOffBy', v)}
                  placeholder="Name of client representative"
                />
                <div className="md:col-span-2">
                  <EditableText
                    editMode={editMode}
                    label="Operation Summary"
                    value={data.operationSummary || ''}
                    onChange={v => field('operationSummary', v)}
                    multiline
                    placeholder="Describe what was done, any issues encountered, remarks…"
                  />
                </div>
                <div className="md:col-span-2">
                  <EditableText
                    editMode={editMode}
                    label="Additional Notes"
                    value={data.notes || ''}
                    onChange={v => field('notes', v)}
                    multiline
                    placeholder="Any other notes…"
                  />
                </div>
              </div>
            </div>

            {/* ── Section 4: Signatures ── */}
            <div>
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-5 h-px bg-slate-300 dark:bg-white/20 block" />
                4. Signatures
                <span className="flex-1 h-px bg-slate-300 dark:bg-white/20 block" />
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">OTEC Representative</p>
                  <div className="h-12 border-b-2 border-dashed border-slate-300 dark:border-white/20" />
                  <div className="grid grid-cols-2 gap-3">
                    <EditableText
                      editMode={editMode}
                      label="Name"
                      value={data.otecRepName || ''}
                      onChange={(v) => field('otecRepName', v)}
                    />
                    <EditableDateTime
                      editMode={editMode}
                      label="Date"
                      value={data.otecRepDate || ''}
                      onChange={(v) => field('otecRepDate', v)}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Client Representative</p>
                  <div className="h-12 border-b-2 border-dashed border-slate-300 dark:border-white/20" />
                  <div className="grid grid-cols-2 gap-3">
                    <EditableText
                      editMode={editMode}
                      label="Name"
                      value={data.clientRepName || ''}
                      onChange={(v) => field('clientRepName', v)}
                    />
                    <EditableDateTime
                      editMode={editMode}
                      label="Date"
                      value={data.clientRepDate || ''}
                      onChange={(v) => field('clientRepDate', v)}
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>
          {/* ── End printable section ── */}

          {/* ── Hardcopy upload (not printed) ── */}
          <div className="px-6 pb-6 print:hidden">
            <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 p-5 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={handleFileChange}
              />
              {data.hardcopyFileName ? (
                <div className="flex items-center justify-center gap-3 text-emerald-600 dark:text-emerald-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <div className="text-left">
                    <p className="font-bold text-sm">{data.hardcopyFileName}</p>
                    <p className="text-xs text-slate-400">Signed hardcopy uploaded</p>
                  </div>
                  <button
                    onClick={() => { field('hardcopyFile', null); field('hardcopyFileName', ''); }}
                    className="ml-2 text-red-400 hover:text-red-600 text-xs font-bold"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <div className="mb-2 opacity-40"><svg className="w-8 h-8 mx-auto text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg></div>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">Upload Signed Hardcopy</p>
                  <p className="text-xs text-slate-400 mb-3">PDF, JPG or PNG — scanned signed copy of this report</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                    className="px-4 py-2 bg-white dark:bg-meta-4 border border-slate-300 dark:border-white/10 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-meta-4/80 transition-colors"
                  >
                    {uploadingFile ? 'Uploading…' : 'Select File'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer actions ── */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-boxdark-2/50 flex items-center justify-between gap-3 print:hidden">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-meta-4 rounded-xl transition-colors"
          >
            Cancel — Keep as Active
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-meta-4 flex items-center gap-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print / PDF
            </button>
            <button
              onClick={handleConfirm}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-bold shadow-lg hover:shadow-purple-500/30 hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Confirm Job Done
            </button>
          </div>
        </div>
      </div>

      {/* Print-only styles injected inline */}
      <style>{`
        @media print {
          body > *:not(#job-report-print-wrapper) { display: none !important; }
          #job-report-print { display: block !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default JobReportModal;
