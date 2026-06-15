'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

export default function NewAssetPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [sites, setSites] = useState([]);

  const [formData, setFormData] = useState({
    code: '', name: '', status: 'OPERATIONAL', lifecycleStage: 'PLANNED', categoryId: '', siteId: '',
    imageUrl: '', manufacturer: '', modelNumber: '', serialNumber: '', installationDate: '',
    safetyImpact: 1, environmentalImpact: 1, productionImpact: 1, financialImpact: 1
  });

  useEffect(() => {
    Promise.all([fetch('/api/settings/categories'), fetch('/api/settings/sites')])
      .then(async ([catRes, siteRes]) => {
        setCategories((await catRes.json()).data || []);
        const sitesData = (await siteRes.json()).data || [];
        setSites(sitesData);
        if (sitesData.length > 0) setFormData(f => ({ ...f, siteId: sitesData[0].id }));
      }).catch(console.error);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        router.push('/assets');
      } else {
        const errorData = await res.json();
        alert('Failed to save asset: ' + (errorData.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Error saving asset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Create New Asset</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Register a new equipment or facility record</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Information */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">General Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Asset Code" required type="text" name="code" value={formData.code} onChange={handleChange} placeholder="e.g. GEN-101" />
            <Input label="Asset Name" required type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Primary Generator" />
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
        </div>

        {/* Specifications */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Specifications & Media</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Manufacturer" type="text" name="manufacturer" value={formData.manufacturer} onChange={handleChange} placeholder="e.g. Caterpillar" />
            <Input label="Model Number" type="text" name="modelNumber" value={formData.modelNumber} onChange={handleChange} placeholder="e.g. C175-16" />
            <Input label="Serial Number" type="text" name="serialNumber" value={formData.serialNumber} onChange={handleChange} />
            <Input label="Installation Date" type="date" name="installationDate" value={formData.installationDate} onChange={handleChange} />
            <div className="md:col-span-2">
              <Input label="Image URL" type="url" name="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="https://example.com/image.jpg" />
              {formData.imageUrl && (
                <div className="mt-4 w-48 h-48 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800">
                  <img src={formData.imageUrl} alt="Asset Preview" className="w-full h-full object-cover" onError={(e) => e.target.src = 'https://placehold.co/400x400/png?text=Invalid+Image'} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Criticality Assessment */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">ISO 55001 Criticality Assessment</h2>
            <span className="text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded">Scale: 1 (Low) to 5 (High)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Safety Impact" type="number" min="1" max="5" name="safetyImpact" value={formData.safetyImpact} onChange={handleChange} />
            <Input label="Environmental Impact" type="number" min="1" max="5" name="environmentalImpact" value={formData.environmentalImpact} onChange={handleChange} />
            <Input label="Production Impact" type="number" min="1" max="5" name="productionImpact" value={formData.productionImpact} onChange={handleChange} />
            <Input label="Financial Impact" type="number" min="1" max="5" name="financialImpact" value={formData.financialImpact} onChange={handleChange} />
          </div>
          <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg flex items-center justify-between border border-slate-200 dark:border-slate-700">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Calculated Classification</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Based on worst-case impact scenario</p>
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {(() => {
                const s = parseInt(formData.safetyImpact) || 1;
                const e = parseInt(formData.environmentalImpact) || 1;
                const p = parseInt(formData.productionImpact) || 1;
                const f = parseInt(formData.financialImpact) || 1;
                const total = s + e + p + f;
                if (total >= 16) return <span className="text-red-500">CRITICAL</span>;
                if (total >= 11) return <span className="text-orange-500">HIGH</span>;
                if (total >= 6) return <span className="text-yellow-500">MEDIUM</span>;
                return <span className="text-green-500">LOW</span>;
              })()}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button type="button" onClick={() => router.back()} className="px-6 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
            {loading ? 'Creating...' : 'Create Asset'}
          </button>
        </div>
      </form>
    </div>
  );
}
