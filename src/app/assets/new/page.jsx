'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

function NewAssetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledParentId = searchParams.get('parentId') || '';
  const prefilledSiteId = searchParams.get('siteId') || '';

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [sites, setSites] = useState([]);
  const [potentialParents, setPotentialParents] = useState([]);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardScores, setWizardScores] = useState({
    safetyImpact: 1, environmentalImpact: 1, productionImpact: 1, financialImpact: 1
  });

  const [formData, setFormData] = useState({
    code: '', name: '', status: 'OPERATIONAL', lifecycleStage: 'PLANNED', categoryId: '', siteId: '',
    parentId: '',
    imageUrl: '', manufacturer: '', modelNumber: '', serialNumber: '', installationDate: '',
    safetyImpact: 1, environmentalImpact: 1, productionImpact: 1, financialImpact: 1
  });

  useEffect(() => {
    Promise.all([fetch('/api/settings/categories'), fetch('/api/settings/sites')])
      .then(async ([catRes, siteRes]) => {
        setCategories((await catRes.json()).data || []);
        const sitesData = (await siteRes.json()).data || [];
        setSites(sitesData);
        
        const initialSiteId = prefilledSiteId || (sitesData.length > 0 ? sitesData[0].id : '');
        setFormData(f => ({ 
          ...f, 
          siteId: initialSiteId,
          parentId: prefilledParentId
        }));
      }).catch(console.error);
  }, [prefilledSiteId, prefilledParentId]);

  useEffect(() => {
    if (!formData.siteId) {
      setPotentialParents([]);
      return;
    }
    fetch(`/api/assets?siteId=${formData.siteId}&limit=1000`)
      .then(res => res.json())
      .then(resData => {
        setPotentialParents(resData.data || []);
      })
      .catch(console.error);
  }, [formData.siteId]);

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
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">ISO 55001 Criticality Assessment</h2>
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
              <span className="text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded">Scale: 1-5</span>
            </div>
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
                        className="text-blue-600 focus:ring-blue-500 animate-none"
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
                        className="text-blue-600 focus:ring-blue-500 animate-none"
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
                        className="text-blue-600 focus:ring-blue-500 animate-none"
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
                        className="text-blue-600 focus:ring-blue-500 animate-none"
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

export default function NewAssetPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 animate-pulse">Loading new asset form...</div>}>
      <NewAssetForm />
    </Suspense>
  );
}
