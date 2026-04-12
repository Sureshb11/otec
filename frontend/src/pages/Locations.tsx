import { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import Can from '../components/Can';
import { apiClient } from '../api/apiClient';

interface Location {
  id: string;
  name: string;
  country: string;
  region: string | null;
  coordinates: string | null;
  description: string | null;
  customerId: string | null;
  customer?: { id: string; name: string };
  isActive: boolean;
}

interface Customer {
  id: string;
  name: string;
}

type LocationForm = {
  name: string;
  country: string;
  region: string;
  coordinates: string;
  description: string;
  customerId: string;
  isActive: boolean;
};

const blankForm = (): LocationForm => ({
  name: '', country: '', region: '', coordinates: '', description: '', customerId: '', isActive: true,
});

const orNull = (v: string | null | undefined) => {
  const s = (v ?? '').trim();
  return s === '' ? null : s;
};

const Locations = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LocationForm>(blankForm());
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Location | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [locs, custs] = await Promise.all([
        apiClient.locations.getAll(),
        apiClient.customers.getAll().catch(() => []),
      ]);
      setLocations(Array.isArray(locs) ? locs : []);
      setCustomers(Array.isArray(custs) ? custs : []);
    } catch (err) {
      console.error('Failed to fetch locations:', err);
      setError('Failed to load locations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(blankForm());
    setShowFormModal(true);
  };

  const openEdit = (l: Location) => {
    setEditingId(l.id);
    setForm({
      name: l.name || '',
      country: l.country || '',
      region: l.region || '',
      coordinates: l.coordinates || '',
      description: l.description || '',
      customerId: l.customerId || '',
      isActive: l.isActive,
    });
    setShowFormModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.country.trim()) {
      alert('Please fill in name and country');
      return;
    }
    const payload: any = {
      name: form.name.trim(),
      country: form.country.trim(),
      region: orNull(form.region),
      coordinates: orNull(form.coordinates),
      description: orNull(form.description),
      customerId: form.customerId || null,
      isActive: form.isActive,
    };
    try {
      setSaving(true);
      const enrich = (loc: Location): Location => {
        if (loc.customerId) {
          const c = customers.find(x => x.id === loc.customerId);
          if (c) return { ...loc, customer: { id: c.id, name: c.name } };
        }
        return { ...loc, customer: undefined };
      };
      if (editingId) {
        const updated = await apiClient.locations.update(editingId, payload);
        setLocations(prev => prev.map(l => l.id === editingId ? enrich(updated) : l));
      } else {
        const created = await apiClient.locations.create(payload);
        setLocations(prev => [...prev, enrich(created)]);
      }
      setShowFormModal(false);
      setEditingId(null);
      setForm(blankForm());
    } catch (err: any) {
      console.error('Failed to save location:', err);
      alert(err?.response?.data?.message || 'Failed to save location');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      setDeleting(true);
      await apiClient.locations.delete(confirmDelete.id);
      setLocations(prev => prev.filter(l => l.id !== confirmDelete.id));
      setConfirmDelete(null);
    } catch (err: any) {
      console.error('Failed to delete location:', err);
      alert(err?.response?.data?.message || 'Failed to delete location');
    } finally {
      setDeleting(false);
    }
  };

  const filteredLocations = locations.filter(l =>
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.region && l.region.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <MainLayout headerContent={<div><h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 tracking-tight">Locations</h1></div>}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout headerContent={<div><h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 tracking-tight">Locations</h1></div>}>
        <div className="flex items-center justify-center h-64 text-red-500">{error}</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      headerContent={
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between w-full gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 tracking-tight">Locations</h1>
            <p className="text-sm text-slate-500 font-medium dark:text-slate-400">Manage all your locations</p>
          </div>
          <div className="flex items-center space-x-3 xl:ml-auto">
            <Can module="locations" action="add">
              <button
                onClick={openAdd}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-600 text-white rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(25,86,168,0.3)] hover:shadow-[0_0_25px_rgba(25,86,168,0.5)] transition-all duration-300 transform hover:-translate-y-0.5 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Location</span>
              </button>
            </Can>
          </div>
        </div>
      }
    >
      {/* Add/Edit Location Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowFormModal(false)} />
          <div className="relative bg-white dark:bg-boxdark rounded-2xl w-full max-w-md shadow-2xl border border-white/20 dark:border-white/5 overflow-hidden max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-boxdark px-6 py-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${editingId ? 'bg-slate-100 dark:bg-slate-500/20' : 'bg-blue-100 dark:bg-blue-500/20'}`}>
                  {editingId ? (
                    <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  ) : (
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    {editingId ? 'Edit Location' : 'Add New Location'}
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">{editingId ? 'Update location details' : 'Create a new location record'}</p>
                </div>
              </div>
              <button onClick={() => setShowFormModal(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-meta-4 rounded-xl transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 border border-slate-200 dark:border-strokedark rounded-xl bg-white/50 dark:bg-boxdark dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all" placeholder="e.g., North Kuwait" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Country *</label>
                <input type="text" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="w-full px-4 py-3 border border-slate-200 dark:border-strokedark rounded-xl bg-white/50 dark:bg-boxdark dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all" placeholder="Kuwait" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Region</label>
                <input type="text" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className="w-full px-4 py-3 border border-slate-200 dark:border-strokedark rounded-xl bg-white/50 dark:bg-boxdark dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all" placeholder="Northern Region" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Coordinates</label>
                <input type="text" value={form.coordinates} onChange={(e) => setForm({ ...form, coordinates: e.target.value })} className="w-full px-4 py-3 border border-slate-200 dark:border-strokedark rounded-xl bg-white/50 dark:bg-boxdark dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all" placeholder="29.3759° N" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Customer</label>
                <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} className="w-full px-4 py-3 border border-slate-200 dark:border-strokedark rounded-xl bg-white/50 dark:bg-boxdark dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all">
                  <option value="">— None —</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-3 border border-slate-200 dark:border-strokedark rounded-xl bg-white/50 dark:bg-boxdark dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all" placeholder="Location description..." rows={3} />
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded border-slate-300" />
                Active
              </label>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowFormModal(false)} className="flex-1 py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-meta-4 rounded-xl font-bold transition-colors">Cancel</button>
              <button onClick={handleSubmit} disabled={saving} className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-600 text-white rounded-xl font-bold shadow-[0_0_15px_rgba(25,86,168,0.3)] hover:shadow-[0_0_25px_rgba(25,86,168,0.5)] transition-all disabled:opacity-50">
                {saving ? 'Saving...' : (editingId ? 'Save Changes' : 'Create Location')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-white dark:bg-boxdark rounded-2xl p-8 w-full max-w-sm shadow-2xl border border-white/20 dark:border-white/5">
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Delete Location?</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                <span className="font-bold text-slate-700 dark:text-white">{confirmDelete.name}</span> will be permanently removed.
              </p>
              <p className="text-xs text-rose-500 font-bold mt-2">This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-meta-4 rounded-xl font-bold transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-3 bg-gradient-to-r from-rose-600 to-rose-500 text-white rounded-xl font-bold shadow-lg transition-all disabled:opacity-50">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search locations..." className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-strokedark rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 bg-white/80 dark:bg-boxdark dark:text-white shadow-sm transition-all" />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></div>
        </div>

        <div className="glass-premium dark:bg-boxdark/90 rounded-2xl shadow-xl overflow-hidden border border-white/20 dark:border-white/5">
          <table className="min-w-full divide-y divide-slate-200/50 dark:divide-white/5">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-boxdark-2/80">
                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">Name</th>
                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">Country</th>
                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">Region</th>
                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">Customer</th>
                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">Status</th>
                <th className="px-6 py-4 text-right text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredLocations.map((location) => (
                <tr key={location.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-500/5 transition-colors duration-200 group">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-white">{location.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{location.country}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{location.region || '--'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{location.customer?.name || '--'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 inline-flex text-[10px] leading-4 font-black uppercase tracking-wider rounded-lg ${location.isActive ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200/50 dark:border-rose-500/20'}`}>
                      {location.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(location)} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 px-3 py-1.5 rounded-lg transition-colors">Edit</button>
                      <button onClick={() => setConfirmDelete(location)} className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 px-3 py-1.5 rounded-lg transition-colors">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLocations.length === 0 && (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500"><svg className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg><p className="font-semibold">No locations found</p></div>
          )}
        </div>

        <div className="mt-4 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
          Displaying {filteredLocations.length} of {locations.length} locations
        </div>
      </div>
    </MainLayout>
  );
};

export default Locations;
