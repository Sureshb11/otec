import { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import { apiClient } from '../api/apiClient';

interface Location {
  id: string;
  name: string;
  country: string;
  region?: string;
  coordinates?: string;
  description?: string;
  isActive: boolean;
}

const Locations = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLocation, setNewLocation] = useState({ name: '', country: '', region: '', coordinates: '', description: '' });
  const [saving, setSaving] = useState(false);

  // Fetch locations from API
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        const data = await apiClient.locations.getAll();
        if (Array.isArray(data)) {
          setLocations(data);
        } else {
          console.error('API returned invalid data:', data);
          setLocations([]);
          setError('Invalid server response');
        }
      } catch (err) {
        console.error('Failed to fetch locations:', err);
        setError('Failed to load locations. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchLocations();
  }, []);

  // Create new location
  const handleCreateLocation = async () => {
    if (!newLocation.name || !newLocation.country) {
      alert('Please fill in name and country');
      return;
    }
    try {
      setSaving(true);
      const created = await apiClient.locations.create(newLocation);
      setLocations(prev => [...prev, created]);
      setNewLocation({ name: '', country: '', region: '', coordinates: '', description: '' });
      setShowAddModal(false);
    } catch (err: any) {
      console.error('Failed to create location:', err);
      alert(err?.response?.data?.message || 'Failed to create location');
    } finally {
      setSaving(false);
    }
  };

  // Delete location
  const handleDeleteLocation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return;
    try {
      await apiClient.locations.delete(id);
      setLocations(prev => prev.filter(l => l.id !== id));
    } catch (err: any) {
      console.error('Failed to delete location:', err);
      alert(err?.response?.data?.message || 'Failed to delete location');
    }
  };

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (location.region && location.region.toLowerCase().includes(searchTerm.toLowerCase()))
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
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-600 text-white rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(25,86,168,0.3)] hover:shadow-[0_0_25px_rgba(25,86,168,0.5)] transition-all duration-300 transform hover:-translate-y-0.5 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Location</span>
            </button>
          </div>
        </div>
      }
    >
      {/* Add Location Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative glass-premium dark:bg-boxdark/95 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-white/20 dark:border-white/5 animate-slideUp">
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">Add New Location</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Name *</label>
                <input type="text" value={newLocation.name} onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })} className="w-full px-4 py-3 border border-slate-200 dark:border-strokedark rounded-xl bg-white/50 dark:bg-boxdark dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all" placeholder="e.g., North Kuwait" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Country *</label>
                <input type="text" value={newLocation.country} onChange={(e) => setNewLocation({ ...newLocation, country: e.target.value })} className="w-full px-4 py-3 border border-slate-200 dark:border-strokedark rounded-xl bg-white/50 dark:bg-boxdark dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all" placeholder="Kuwait" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Region</label>
                <input type="text" value={newLocation.region} onChange={(e) => setNewLocation({ ...newLocation, region: e.target.value })} className="w-full px-4 py-3 border border-slate-200 dark:border-strokedark rounded-xl bg-white/50 dark:bg-boxdark dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all" placeholder="Northern Region" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Coordinates</label>
                <input type="text" value={newLocation.coordinates} onChange={(e) => setNewLocation({ ...newLocation, coordinates: e.target.value })} className="w-full px-4 py-3 border border-slate-200 dark:border-strokedark rounded-xl bg-white/50 dark:bg-boxdark dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all" placeholder="29.3759° N" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Description</label>
                <textarea value={newLocation.description} onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })} className="w-full px-4 py-3 border border-slate-200 dark:border-strokedark rounded-xl bg-white/50 dark:bg-boxdark dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all" placeholder="Location description..." rows={3} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-meta-4 rounded-xl font-semibold transition-colors">Cancel</button>
              <button onClick={handleCreateLocation} disabled={saving} className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-600 text-white rounded-xl font-bold shadow-[0_0_15px_rgba(25,86,168,0.3)] hover:shadow-[0_0_25px_rgba(25,86,168,0.5)] transition-all disabled:opacity-50">{saving ? 'Creating...' : 'Create Location'}</button>
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
                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">Coordinates</th>
                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">Status</th>
                <th className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredLocations.map((location) => (
                <tr key={location.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-500/5 transition-colors duration-200 group">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-white">{location.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{location.country}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{location.region || '--'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{location.coordinates || '--'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 inline-flex text-[10px] leading-4 font-black uppercase tracking-wider rounded-lg ${location.isActive ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200/50 dark:border-rose-500/20'}`}>
                      {location.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button onClick={() => handleDeleteLocation(location.id)} className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
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
