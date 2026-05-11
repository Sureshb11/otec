import { useState } from 'react';
import { apiClient } from '../api/apiClient';

interface EditableOrder {
  id: string;
  orderNumber: string;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  totalAmount?: number | string | null;
  wellNumber?: string | null;
  notes?: string | null;
}

interface EditOrderModalProps {
  order: EditableOrder;
  onClose: () => void;
  onSaved: () => void;
}

const STATUS_OPTIONS = ['draft', 'booked', 'active', 'job_done', 'returned', 'cancelled'];

function toDateInputValue(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function toIsoFromDateInput(value: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

const EditOrderModal = ({ order, onClose, onSaved }: EditOrderModalProps) => {
  const [status, setStatus] = useState(order.status);
  const [startDate, setStartDate] = useState(toDateInputValue(order.startDate ?? undefined));
  const [endDate, setEndDate] = useState(toDateInputValue(order.endDate ?? undefined));
  const [totalAmount, setTotalAmount] = useState(
    order.totalAmount != null && order.totalAmount !== '' ? String(order.totalAmount) : '',
  );
  const [wellNumber, setWellNumber] = useState(order.wellNumber ?? '');
  const [notes, setNotes] = useState(order.notes ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setError(null);
    setSubmitting(true);

    const patch: Record<string, unknown> = {};
    const startIso = toIsoFromDateInput(startDate);
    const endIso = toIsoFromDateInput(endDate);
    if (startIso !== undefined && startIso !== order.startDate) patch.startDate = startIso;
    if (endIso !== undefined && endIso !== order.endDate) patch.endDate = endIso;
    const amountTrimmed = totalAmount.trim();
    if (amountTrimmed !== '' && Number(amountTrimmed) !== Number(order.totalAmount ?? 0)) {
      const parsed = Number(amountTrimmed);
      if (Number.isNaN(parsed)) {
        setError('Total amount must be a number.');
        setSubmitting(false);
        return;
      }
      patch.totalAmount = parsed;
    }
    if (wellNumber !== (order.wellNumber ?? '')) patch.wellNumber = wellNumber;
    if (notes !== (order.notes ?? '')) patch.notes = notes;

    try {
      if (Object.keys(patch).length > 0) {
        await apiClient.orders.update(order.id, patch);
      }
      if (status !== order.status) {
        await apiClient.orders.updateStatus(order.id, status);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      const raw = err?.response?.data?.message;
      setError(Array.isArray(raw) ? raw.join('; ') : raw || 'Failed to update order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-boxdark rounded-2xl shadow-2xl w-full max-w-xl max-h-[95vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-gradient-to-r from-slate-50 to-white dark:from-boxdark-2 dark:to-boxdark">
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-white">Edit Order</h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Order #{order.orderNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-meta-4 text-slate-500"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-sm bg-white dark:bg-meta-4 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400">Backend enforces valid transitions.</p>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Amount</label>
              <input
                type="number"
                step="0.01"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-sm bg-white dark:bg-meta-4 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-sm bg-white dark:bg-meta-4 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-sm bg-white dark:bg-meta-4 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Well Number</label>
              <input
                type="text"
                value={wellNumber}
                onChange={(e) => setWellNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-sm bg-white dark:bg-meta-4 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Notes</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-sm bg-white dark:bg-meta-4 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:outline-none resize-none"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700 px-3 py-2 text-sm font-semibold text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/60 dark:bg-boxdark-2/40">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-meta-4 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={submitting}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-bold shadow-lg disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditOrderModal;
