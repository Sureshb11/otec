import { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import { apiClient } from '../api/apiClient';

interface Rig {
  id: string;
  name: string;
  type: 'TRS' | 'DHT';
  status: 'active' | 'inactive' | 'maintenance';
  description?: string;
  location?: { id: string; name: string };
  customer?: { id: string; name: string };
}

const Rigs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [rigs, setRigs] = useState<Rig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRig, setNewRig] = useState({ name: '', type: 'TRS' as 'TRS' | 'DHT', description: '' });
  const [saving, setSaving] = useState(false);

  // Fetch rigs from API
  useEffect(() => {
    const fetchRigs = async () => {
      try {
        setLoading(true);
        const data = await apiClient.rigs.getAll();
        if (Array.isArray(data)) {
          setRigs(data);
        } else {
          console.error('API returned invalid data:', data);
          setRigs([]);
          setError('Invalid server response');
        }
      } catch (err) {
        console.error('Failed to fetch rigs:', err);
        setError('Failed to load rigs. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchRigs();
  }, []);

  // Create new rig
  const handleCreateRig = async () => {
    if (!newRig.name) {
      alert('Please fill in the rig name');
      return;
    }
    try {
      setSaving(true);
      const created = await apiClient.rigs.create({
        ...newRig,
        status: 'active'
      });
      setRigs(prev => [...prev, created]);
      setNewRig({ name: '', type: 'TRS', description: '' });
      setShowAddModal(false);
    } catch (err: any) {
      console.error('Failed to create rig:', err);
      alert(err?.response?.data?.message || 'Failed to create rig');
    } finally {
      setSaving(false);
    }
  };

  // Delete rig
  const handleDeleteRig = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rig?')) return;
    try {
      await apiClient.rigs.delete(id);
      setRigs(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      console.error('Failed to delete rig:', err);
      alert(err?.response?.data?.message || 'Failed to delete rig');
    }
  };

  const filteredRigs = rigs.filter(rig =>
    rig.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rig.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (rig.location?.name && rig.location.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (rig.customer?.name && rig.customer.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20';
      case 'maintenance':
        return 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/20';
      case 'inactive':
        return 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200/50 dark:border-rose-500/20';
      default:
        return 'bg-slate-100 dark:bg-slate-500/20 text-slate-700 dark:text-slate-400 border border-slate-200/50 dark:border-slate-500/20';
    }
  };

  if (loading) {
    return (
      <MainLayout headerContent={<div><h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 tracking-tight">Rigs</h1></div>}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout headerContent={<div><h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 tracking-tight">Rigs</h1></div>}>
        <div className="flex items-center justify-center h-64 text-red-500">{error}</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      headerContent={
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between w-full gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 tracking-tight">Rigs</h1>
            <p className="text-sm text-slate-500 font-medium dark:text-slate-400">Manage all your rigs</p>
          </div>
          <div className="flex items-center space-x-3 xl:ml-auto">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-600 text-white rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(25,86,168,0.3)] hover:shadow-[0_0_25px_rgba(25,86,168,0.5)] transition-all duration-300 transform hover:-translate-y-0.5 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Rig</span>
            </button>
          </div>
        </div>
      }
    >
      {/* Add Rig Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative glass-premium dark:bg-boxdark/95 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-white/20 dark:border-white/5 animate-slideUp">
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">Add New Rig</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Rig Name *</label>
                <input type="text" value={newRig.name} onChange={(e) => setNewRig({ ...newRig, name: e.target.value })} className="w-full px-4 py-3 border border-slate-200 dark:border-strokedark rounded-xl bg-white/50 dark:bg-boxdark dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all" placeholder="e.g., Rig 15" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Type *</label>
                <select value={newRig.type} onChange={(e) => setNewRig({ ...newRig, type: e.target.value as 'TRS' | 'DHT' })} className="w-full px-4 py-3 border border-slate-200 dark:border-strokedark rounded-xl bg-white/50 dark:bg-boxdark dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all">
                  <option value="TRS">TRS</option>
                  <option value="DHT">DHT</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Description</label>
                <textarea value={newRig.description} onChange={(e) => setNewRig({ ...newRig, description: e.target.value })} className="w-full px-4 py-3 border border-slate-200 dark:border-strokedark rounded-xl bg-white/50 dark:bg-boxdark dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all" placeholder="Rig description..." rows={3} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-meta-4 rounded-xl font-semibold transition-colors">Cancel</button>
              <button onClick={handleCreateRig} disabled={saving} className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-600 text-white rounded-xl font-bold shadow-[0_0_15px_rgba(25,86,168,0.3)] hover:shadow-[0_0_25px_rgba(25,86,168,0.5)] transition-all disabled:opacity-50">{saving ? 'Creating...' : 'Create Rig'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search rigs..." className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-strokedark rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 bg-white/80 dark:bg-boxdark dark:text-white shadow-sm transition-all" />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></div>
        </div>

        <div className="glass-premium dark:bg-boxdark/90 rounded-2xl shadow-xl overflow-hidden border border-white/20 dark:border-white/5">
          <table className="min-w-full divide-y divide-slate-200/50 dark:divide-white/5">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-boxdark-2/80">
                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">Name</th>
                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">Type</th>
                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">Location</th>
                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">Customer</th>
                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">Status</th>
                <th className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredRigs.map((rig) => (
                <tr key={rig.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-500/5 transition-colors duration-200 group">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-white">{rig.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${rig.type === 'TRS' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-200/50 dark:border-blue-500/20' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-500/20'}`}>{rig.type}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{rig.location?.name || '--'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{rig.customer?.name || '--'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 inline-flex text-[10px] leading-4 font-black uppercase tracking-wider rounded-lg ${getStatusBadgeClass(rig.status)}`}>{rig.status.charAt(0).toUpperCase() + rig.status.slice(1)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button onClick={() => handleDeleteRig(rig.id)} className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRigs.length === 0 && (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500"><svg className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg><p className="font-semibold">No rigs found</p></div>
          )}
        </div>

        <div className="mt-4 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
          Displaying {filteredRigs.length} of {rigs.length} rigs
        </div>
      </div>
    </MainLayout>
  );
};

export default Rigs;
