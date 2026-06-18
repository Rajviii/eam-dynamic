'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { 
  Calendar, 
  User, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Eye, 
  FileText, 
  RefreshCw, 
  Layers, 
  ShieldAlert
} from 'lucide-react';

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
  const [potentialParents, setPotentialParents] = useState([]);
  const [formData, setFormData] = useState({});
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardScores, setWizardScores] = useState({
    safetyImpact: 1, environmentalImpact: 1, productionImpact: 1, financialImpact: 1
  });

  // For Work Orders Tab
  const [workOrders, setWorkOrders] = useState([]);
  const [woLoading, setWoLoading] = useState(false);
  const [includeChildren, setIncludeChildren] = useState(true);
  const [selectedWo, setSelectedWo] = useState(null);

  useEffect(() => {
    fetchAsset();
    fetchDropdowns();
  }, [params.id]);

  useEffect(() => {
    if (!formData.siteId) {
      setPotentialParents([]);
      return;
    }
    fetch(`/api/assets?siteId=${formData.siteId}&limit=1000`)
      .then(res => res.json())
      .then(resData => {
        const filtered = (resData.data || []).filter(a => a.id !== params.id);
        setPotentialParents(filtered);
      })
      .catch(console.error);
  }, [formData.siteId, params.id]);

  useEffect(() => {
    if (activeTab === 'Work Orders') {
      fetchWorkOrders();
    }
  }, [activeTab, includeChildren, params.id]);

  const fetchWorkOrders = async () => {
    setWoLoading(true);
    try {
      const res = await fetch(`/api/assets/${params.id}/work-orders?rollup=${includeChildren}`);
      if (res.ok) {
        const data = await res.json();
        setWorkOrders(data);
      }
    } catch (err) {
      console.error('Failed to fetch work orders:', err);
    } finally {
      setWoLoading(false);
    }
  };

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
          parentId: data.parentId || '',
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
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Parent Asset / System</span>
                  <span className="text-lg font-medium text-slate-900 dark:text-white">
                    {asset.parent ? (
                      <button 
                        onClick={() => router.push(`/assets/${asset.parent.id}`)}
                        className="text-blue-600 dark:text-blue-400 hover:underline text-left font-medium"
                      >
                        {asset.parent.name} ({asset.parent.code})
                      </button>
                    ) : (
                      <span className="text-slate-400 italic font-normal text-sm">None (Top Level)</span>
                    )}
                  </span>
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
                <Select label="Parent Asset / System" name="parentId" value={formData.parentId} onChange={handleChange}>
                  <option value="">-- None (Top Level) --</option>
                  {potentialParents.map(a => <option key={a.id} value={a.id}>{a.name} ({a.code})</option>)}
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
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100">ISO 55001 Criticality Assessment</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Determine equipment prioritization classification</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      type="button" 
                      onClick={() => {
                        setWizardScores({
                          safetyImpact: parseInt(formData.safetyImpact) || 1,
                          environmentalImpact: parseInt(formData.environmentalImpact) || 1,
                          productionImpact: parseInt(formData.productionImpact) || 1,
                          financialImpact: parseInt(formData.financialImpact) || 1
                        });
                        setIsWizardOpen(true);
                      }}
                      className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                      Open Scoring Wizard
                    </button>
                    <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded font-medium">Scale 1-5</span>
                  </div>
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
            <div className="space-y-6 animate-fadeIn">
              {/* Header Controls */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText size={18} className="text-blue-500" />
                    Maintenance & Work History
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Track all maintenance operations, corrective actions, and scheduled preventive tasks.
                  </p>
                </div>
                <div className="flex items-center gap-4 self-stretch sm:self-auto justify-between sm:justify-end">
                  <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300">
                    <input 
                      type="checkbox" 
                      checked={includeChildren}
                      onChange={(e) => setIncludeChildren(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500" 
                    />
                    <span className="flex items-center gap-1.5 select-none">
                      <Layers size={14} className="text-slate-400" />
                      Include Child Assets
                    </span>
                  </label>
                  <button 
                    onClick={fetchWorkOrders} 
                    disabled={woLoading}
                    className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-800"
                    title="Refresh history"
                  >
                    <RefreshCw size={14} className={woLoading ? "animate-spin" : ""} />
                  </button>
                </div>
              </div>

              {/* Stats Panel */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-50/50 dark:bg-slate-800/20 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/40">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Total Tasks</span>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white mt-1 block">{workOrders.length}</span>
                </div>
                <div className="bg-blue-50/30 dark:bg-blue-950/10 p-4 rounded-xl border border-blue-100/40 dark:border-blue-900/20">
                  <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">Active Tasks</span>
                  <span className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-1 block">
                    {workOrders.filter(wo => ['DRAFT', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_PARTS'].includes(wo.status)).length}
                  </span>
                </div>
                <div className="bg-purple-50/30 dark:bg-purple-950/10 p-4 rounded-xl border border-purple-100/40 dark:border-purple-900/20">
                  <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">Waiting Parts</span>
                  <span className="text-2xl font-bold text-purple-700 dark:text-purple-400 mt-1 block font-mono">
                    {workOrders.filter(wo => wo.status === 'WAITING_PARTS').length}
                  </span>
                </div>
                <div className="bg-green-50/30 dark:bg-green-950/10 p-4 rounded-xl border border-green-100/40 dark:border-green-900/20">
                  <span className="text-[10px] font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider block">Completed</span>
                  <span className="text-2xl font-bold text-green-700 dark:text-green-400 mt-1 block font-mono">
                    {workOrders.filter(wo => ['COMPLETED', 'CLOSED'].includes(wo.status)).length}
                  </span>
                </div>
              </div>

              {/* Loader / Content */}
              {woLoading ? (
                <div className="text-center py-20 text-slate-500 animate-pulse flex flex-col items-center justify-center gap-2">
                  <RefreshCw size={24} className="animate-spin text-blue-500" />
                  <span>Fetching maintenance records...</span>
                </div>
              ) : workOrders.length === 0 ? (
                <div className="text-center py-16 bg-slate-50/50 dark:bg-slate-800/10 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  <FileText size={40} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                  <p className="text-slate-500 dark:text-slate-400 font-medium">No work orders recorded for this asset.</p>
                  <p className="text-xs text-slate-400 mt-1">Create a work order in the Work Orders section to see it here.</p>
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-900">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
                      <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="px-5 py-3.5 font-medium">WO ID</th>
                          <th className="px-5 py-3.5 font-medium">Title</th>
                          {includeChildren && <th className="px-5 py-3.5 font-medium">Asset Unit</th>}
                          <th className="px-5 py-3.5 font-medium">Assigned To</th>
                          <th className="px-5 py-3.5 font-medium">Due Date</th>
                          <th className="px-5 py-3.5 font-medium">Priority</th>
                          <th className="px-5 py-3.5 font-medium">Status</th>
                          <th className="px-5 py-3.5 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {workOrders.map(wo => {
                          const isChildAsset = wo.assetId !== asset.id;
                          return (
                            <tr 
                              key={wo.id} 
                              className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                              onClick={() => setSelectedWo(wo)}
                            >
                              <td className="px-5 py-4 font-semibold text-slate-900 dark:text-slate-100 font-mono text-xs">
                                {wo.woNumber?.startsWith('WO-') ? wo.woNumber : `WO-${wo.id.substring(0, 6).toUpperCase()}`}
                              </td>
                              <td className="px-5 py-4 font-medium text-slate-800 dark:text-slate-200">
                                {wo.title}
                              </td>
                              {includeChildren && (
                                <td className="px-5 py-4 text-xs">
                                  {isChildAsset ? (
                                    <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-medium border border-slate-200 dark:border-slate-700">
                                      <Layers size={10} className="text-blue-500" />
                                      {wo.asset?.name}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 italic">Self</span>
                                  )}
                                </td>
                              )}
                              <td className="px-5 py-4">
                                {wo.assignedTo ? (
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[9px] font-bold">
                                      {wo.assignedTo.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                    </div>
                                    <span className="text-slate-700 dark:text-slate-300 text-xs">{wo.assignedTo.name}</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic text-xs">Unassigned</span>
                                )}
                              </td>
                              <td className="px-5 py-4 text-slate-500 dark:text-slate-400 text-xs">
                                {wo.dueDate ? new Date(wo.dueDate).toLocaleDateString() : '-'}
                              </td>
                              <td className="px-5 py-4">
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                                  wo.priority === 'CRITICAL' ? 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400' :
                                  wo.priority === 'HIGH' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400' :
                                  wo.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400' :
                                  'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                }`}>
                                  {wo.priority}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                  wo.status === 'DRAFT' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' :
                                  wo.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400' :
                                  wo.status === 'IN_PROGRESS' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400' :
                                  wo.status === 'WAITING_PARTS' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400' :
                                  wo.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' :
                                  'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                }`}>
                                  {wo.status.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                <button 
                                  onClick={() => setSelectedWo(wo)}
                                  className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  title="View Work Order details"
                                >
                                  <Eye size={15} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Work Order Details Modal */}
      {selectedWo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div>
                <span className="text-xs uppercase font-mono tracking-wider text-slate-400 block">
                  Work Order Detail
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 mt-0.5">
                  {selectedWo.woNumber?.startsWith('WO-') ? selectedWo.woNumber : `WO-${selectedWo.id.substring(0, 6).toUpperCase()}`}
                </h2>
              </div>
              <button 
                onClick={() => setSelectedWo(null)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Header Title */}
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selectedWo.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800/80">
                  {selectedWo.description || "No description provided."}
                </p>
              </div>

              {/* Status and Priority Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/50 dark:bg-slate-800/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Status</span>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    {selectedWo.status.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Priority</span>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                    {selectedWo.priority}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Work Type</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1 block">
                    {selectedWo.workType || 'Corrective'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Due Date</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1 block flex items-center gap-1">
                    <Calendar size={12} className="text-slate-400" />
                    {selectedWo.dueDate ? new Date(selectedWo.dueDate).toLocaleDateString() : '-'}
                  </span>
                </div>
              </div>

              {/* Asset and Assignee */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Asset Location</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedWo.asset?.name}</span>
                  <span className="text-xs text-slate-400 block mt-0.5">Code: {selectedWo.asset?.code}</span>
                </div>
                <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Assigned Technician</span>
                  {selectedWo.assignedTo ? (
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedWo.assignedTo.name}</span>
                      <span className="text-xs text-slate-400 block mt-0.5">{selectedWo.assignedTo.role}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic text-sm">Unassigned</span>
                  )}
                </div>
              </div>

              {/* Effort & Planning Hours */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                  <span className="text-xs text-slate-500 uppercase font-semibold block">Estimated Effort</span>
                  <span className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-1 block">
                    {selectedWo.estimatedHours ? `${selectedWo.estimatedHours} hrs` : '--'}
                  </span>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                  <span className="text-xs text-slate-500 uppercase font-semibold block">Actual Effort</span>
                  <span className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-1 block">
                    {selectedWo.actualHours ? `${selectedWo.actualHours} hrs` : '--'}
                  </span>
                </div>
              </div>

              {/* Completion Notes or Failure Reason */}
              {(selectedWo.completionNotes || selectedWo.failureCause || selectedWo.rootCause) && (
                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Resolution & Cause Analysis</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {selectedWo.completionNotes && (
                      <div className="bg-slate-50/50 dark:bg-slate-800/30 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-semibold text-slate-500 uppercase">Completion Notes</span>
                        <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{selectedWo.completionNotes}</p>
                      </div>
                    )}
                    {(selectedWo.failureCause || selectedWo.rootCause) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedWo.failureCause && (
                          <div className="bg-red-50/20 dark:bg-red-950/10 p-3 rounded-lg border border-red-100/30 dark:border-red-900/10">
                            <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase">Failure Cause</span>
                            <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{selectedWo.failureCause}</p>
                          </div>
                        )}
                        {selectedWo.rootCause && (
                          <div className="bg-orange-50/20 dark:bg-orange-950/10 p-3 rounded-lg border border-orange-100/30 dark:border-orange-900/10">
                            <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase">Root Cause (RCA)</span>
                            <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{selectedWo.rootCause}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center shrink-0">
              <button 
                onClick={() => {
                  setSelectedWo(null);
                  router.push(`/work-orders`);
                }}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                Go to Work Orders Planner &rarr;
              </button>
              <button 
                onClick={() => setSelectedWo(null)} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Criticality Scoring Wizard Modal */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div>
                <span className="text-xs uppercase font-mono tracking-wider text-slate-400 block">ISO 55001 Standard</span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 mt-0.5">Criticality Scoring Wizard</h2>
              </div>
              <button 
                type="button"
                onClick={() => setIsWizardOpen(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <p className="text-xs text-slate-500">
                Select the description that best fits the potential impact of this asset's failure across safety, environmental, production, and financial categories.
              </p>

              {/* Safety Impact */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900 dark:text-white block">1. Safety & Health Impact</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { val: 1, lbl: "1 - Negligible (No injury or minor health impact)" },
                    { val: 2, lbl: "2 - Minor (Minor injury requiring first-aid treatment)" },
                    { val: 3, lbl: "3 - Moderate (Medical treatment or lost-time injury)" },
                    { val: 4, lbl: "4 - Major (Serious injury causing permanent disability)" },
                    { val: 5, lbl: "5 - Catastrophic (Single or multiple workplace fatalities)" }
                  ].map(opt => (
                    <label key={opt.val} className={`p-3 rounded-lg border text-sm flex items-center gap-3 cursor-pointer transition-all ${wizardScores.safetyImpact === opt.val ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-500' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'}`}>
                      <input 
                        type="radio" 
                        name="wizSafety" 
                        value={opt.val} 
                        checked={wizardScores.safetyImpact === opt.val} 
                        onChange={() => setWizardScores(prev => ({ ...prev, safetyImpact: opt.val }))}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-slate-700 dark:text-slate-300">{opt.lbl}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Environmental Impact */}
              <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <label className="text-sm font-semibold text-slate-900 dark:text-white block">2. Environmental Impact</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { val: 1, lbl: "1 - Negligible (No release, localized impact only)" },
                    { val: 2, lbl: "2 - Minor (Low release, fully contained within site boundaries)" },
                    { val: 3, lbl: "3 - Moderate (Moderate release requiring reports to regulatory bodies)" },
                    { val: 4, lbl: "4 - Major (Serious release, localized community impact, regulatory fines)" },
                    { val: 5, lbl: "5 - Catastrophic (Major environmental disaster with long-term ecosystem damage)" }
                  ].map(opt => (
                    <label key={opt.val} className={`p-3 rounded-lg border text-sm flex items-center gap-3 cursor-pointer transition-all ${wizardScores.environmentalImpact === opt.val ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-500' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'}`}>
                      <input 
                        type="radio" 
                        name="wizEnv" 
                        value={opt.val} 
                        checked={wizardScores.environmentalImpact === opt.val} 
                        onChange={() => setWizardScores(prev => ({ ...prev, environmentalImpact: opt.val }))}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-slate-700 dark:text-slate-300">{opt.lbl}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Production Impact */}
              <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <label className="text-sm font-semibold text-slate-900 dark:text-white block">3. Production & Operations Impact</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { val: 1, lbl: "1 - Negligible (No interruption to operations)" },
                    { val: 2, lbl: "2 - Minor (Minor production delay, easily rescheduled)" },
                    { val: 3, lbl: "3 - Moderate (Moderate delay, partial shutdown < 12 hours)" },
                    { val: 4, lbl: "4 - Major (Significant delay, partial/full plant shutdown 12-48 hours)" },
                    { val: 5, lbl: "5 - Catastrophic (Total plant shutdown > 48 hours, supply chain breach)" }
                  ].map(opt => (
                    <label key={opt.val} className={`p-3 rounded-lg border text-sm flex items-center gap-3 cursor-pointer transition-all ${wizardScores.productionImpact === opt.val ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-500' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'}`}>
                      <input 
                        type="radio" 
                        name="wizProd" 
                        value={opt.val} 
                        checked={wizardScores.productionImpact === opt.val} 
                        onChange={() => setWizardScores(prev => ({ ...prev, productionImpact: opt.val }))}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-slate-700 dark:text-slate-300">{opt.lbl}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Financial Impact */}
              <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <label className="text-sm font-semibold text-slate-900 dark:text-white block">4. Financial Impact</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { val: 1, lbl: "1 - Negligible (Cost of failure is < $1,000)" },
                    { val: 2, lbl: "2 - Minor (Cost of failure is $1,000 to $10,000)" },
                    { val: 3, lbl: "3 - Moderate (Cost of failure is $10,000 to $50,000)" },
                    { val: 4, lbl: "4 - Major (Cost of failure is $50,000 to $250,000)" },
                    { val: 5, lbl: "5 - Catastrophic (Cost of failure exceeds $250,000)" }
                  ].map(opt => (
                    <label key={opt.val} className={`p-3 rounded-lg border text-sm flex items-center gap-3 cursor-pointer transition-all ${wizardScores.financialImpact === opt.val ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-500' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'}`}>
                      <input 
                        type="radio" 
                        name="wizFin" 
                        value={opt.val} 
                        checked={wizardScores.financialImpact === opt.val} 
                        onChange={() => setWizardScores(prev => ({ ...prev, financialImpact: opt.val }))}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-slate-700 dark:text-slate-300">{opt.lbl}</span>
                    </label>
                  ))}
                </div>
              </div>

            </div>

            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 shrink-0">
              <button 
                type="button" 
                onClick={() => setIsWizardOpen(false)} 
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    safetyImpact: wizardScores.safetyImpact,
                    environmentalImpact: wizardScores.environmentalImpact,
                    productionImpact: wizardScores.productionImpact,
                    financialImpact: wizardScores.financialImpact
                  }));
                  setIsWizardOpen(false);
                }} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Apply Wizard Scores
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
