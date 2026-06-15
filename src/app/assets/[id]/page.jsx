'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

export default function AssetDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [saving, setSaving] = useState(false);

  // For Edit Form
  const [categories, setCategories] = useState([]);
  const [sites, setSites] = useState([]);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchAsset();
    fetchDropdowns();
  }, [params.id]);

  const fetchAsset = async () => {
    try {
      const res = await fetch(`/api/assets/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setAsset(data);
        setFormData({
          code: data.code || '',
          name: data.name || '',
          status: data.status || 'OPERATIONAL',
          lifecycleStage: data.lifecycleStage || 'OPERATIONAL',
          categoryId: data.categoryId || '',
          siteId: data.siteId || '',
          imageUrl: data.imageUrl || '',
          manufacturer: data.manufacturer || '',
          modelNumber: data.modelNumber || '',
          serialNumber: data.serialNumber || '',
          installationDate: data.installationDate ? data.installationDate.split('T')[0] : '',
          safetyImpact: data.criticality?.safetyImpact || 1,
          environmentalImpact: data.criticality?.environmentalImpact || 1,
          productionImpact: data.criticality?.productionImpact || 1,
          financialImpact: data.criticality?.financialImpact || 1,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [catRes, siteRes] = await Promise.all([fetch('/api/settings/categories'), fetch('/api/settings/sites')]);
      setCategories((await catRes.json()).data || []);
      setSites((await siteRes.json()).data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/assets/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        await fetchAsset();
        setActiveTab('Overview');
      } else {
        const err = await res.json();
        alert('Failed to save asset: ' + (err.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Error saving asset');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading asset details...</div>;
  if (!asset) return <div className="p-8 text-center text-red-500">Asset not found.</div>;

  const tabs = ['Overview', 'Specifications', 'Edit Asset', 'Risk Assessment', 'Work Orders'];

  return (
    <div className="space-y-6 pb-10 mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/assets')} className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-500">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">{asset.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm font-medium text-slate-500">{asset.code}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${asset.criticality?.classification === 'CRITICAL' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' :
                  asset.criticality?.classification === 'HIGH' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' :
                    asset.criticality?.classification === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' :
                      'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                }`}>
                {asset.criticality?.classification || 'LOW'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800 hide-scrollbar px-2">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab
                  ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border-transparent'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-6 min-h-[400px]">
          {activeTab === 'Overview' && (
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="w-full lg:w-1/3">
                <div className="bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden aspect-square flex items-center justify-center border border-slate-200 dark:border-slate-700">
                  {asset.imageUrl ? (
                    <img src={asset.imageUrl} alt={asset.name} className="w-full h-full object-cover" onError={(e) => e.target.src = 'https://placehold.co/400x400/png?text=Invalid+Image'} />
                  ) : (
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                  )}
                </div>
              </div>
              <div className="w-full lg:w-2/3 grid grid-cols-2 gap-6">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Status</span>
                  <span className="text-lg font-medium text-slate-900 dark:text-white">{asset.status.replace('_', ' ')}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Lifecycle Stage</span>
                  <span className="text-lg font-medium text-slate-900 dark:text-white">{asset.lifecycleStage}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Site Location</span>
                  <span className="text-lg font-medium text-slate-900 dark:text-white">{asset.site?.name || 'Unassigned'}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Category</span>
                  <span className="text-lg font-medium text-slate-900 dark:text-white">{asset.category?.name || 'None'}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Specifications' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
              <div className="space-y-4">
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-slate-500">Manufacturer</span>
                  <span className="font-medium">{asset.manufacturer || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-slate-500">Model Number</span>
                  <span className="font-medium">{asset.modelNumber || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-slate-500">Serial Number</span>
                  <span className="font-medium">{asset.serialNumber || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-slate-500">Installation Date</span>
                  <span className="font-medium">{asset.installationDate ? new Date(asset.installationDate).toLocaleDateString() : '-'}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Edit Asset' && (
            <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Asset Code" required type="text" name="code" value={formData.code} onChange={handleChange} />
                <Input label="Asset Name" required type="text" name="name" value={formData.name} onChange={handleChange} />
                <Select label="Category" name="categoryId" value={formData.categoryId} onChange={handleChange}>
                  <option value="">-- Select Category --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
                <Select label="Location (Site)" required name="siteId" value={formData.siteId} onChange={handleChange}>
                  <option value="">-- Select Location --</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
                <Select label="Status" name="status" value={formData.status} onChange={handleChange}>
                  <option value="OPERATIONAL">Operational</option>
                  <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                  <option value="DEGRADED">Degraded</option>
                  <option value="DECOMMISSIONED">Decommissioned</option>
                  <option value="IN_STORAGE">In Storage</option>
                </Select>
                <Select label="Lifecycle Stage" name="lifecycleStage" value={formData.lifecycleStage} onChange={handleChange}>
                  <option value="PLANNED">Planned</option>
                  <option value="ACQUIRED">Acquired</option>
                  <option value="INSTALLED">Installed</option>
                  <option value="OPERATIONAL">Operational</option>
                  <option value="MAINTAINED">Maintained</option>
                  <option value="RETIRED">Retired</option>
                  <option value="DISPOSED">Disposed</option>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                <Input label="Manufacturer" type="text" name="manufacturer" value={formData.manufacturer} onChange={handleChange} />
                <Input label="Model Number" type="text" name="modelNumber" value={formData.modelNumber} onChange={handleChange} />
                <Input label="Serial Number" type="text" name="serialNumber" value={formData.serialNumber} onChange={handleChange} />
                <Input label="Installation Date" type="date" name="installationDate" value={formData.installationDate} onChange={handleChange} />
                <div className="md:col-span-2">
                  <Input label="Image URL" type="url" name="imageUrl" value={formData.imageUrl} onChange={handleChange} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                <div className="md:col-span-2 flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100">ISO 55001 Criticality Assessment</h3>
                  <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded font-medium">Scale 1-5</span>
                </div>
                <Input label="Safety Impact" type="number" min="1" max="5" name="safetyImpact" value={formData.safetyImpact} onChange={handleChange} />
                <Input label="Environmental Impact" type="number" min="1" max="5" name="environmentalImpact" value={formData.environmentalImpact} onChange={handleChange} />
                <Input label="Production Impact" type="number" min="1" max="5" name="productionImpact" value={formData.productionImpact} onChange={handleChange} />
                <Input label="Financial Impact" type="number" min="1" max="5" name="financialImpact" value={formData.financialImpact} onChange={handleChange} />
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'Risk Assessment' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Criticality Model</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="text-sm text-slate-500 font-semibold mb-1 uppercase">Safety Impact</div>
                  <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{asset.criticality?.safetyImpact || 1} / 5</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="text-sm text-slate-500 font-semibold mb-1 uppercase">Environmental Impact</div>
                  <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{asset.criticality?.environmentalImpact || 1} / 5</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="text-sm text-slate-500 font-semibold mb-1 uppercase">Production Impact</div>
                  <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{asset.criticality?.productionImpact || 1} / 5</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="text-sm text-slate-500 font-semibold mb-1 uppercase">Financial Impact</div>
                  <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{asset.criticality?.financialImpact || 1} / 5</div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-between">
                <span className="font-medium text-slate-700 dark:text-slate-300">Overall Criticality Classification:</span>
                <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                  {asset.criticality?.classification || 'LOW'} (Score: {asset.criticality?.overallScore || 1})
                </span>
              </div>
            </div>
          )}

          {activeTab === 'Work Orders' && (
            <div className="text-slate-500 text-center py-10">
              Work orders history will be displayed here.
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
