'use client';

import { useState, useEffect } from 'react';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';

export default function AssetManagementPlanPage() {
  const [selectedFy, setSelectedFy] = useState('FY 2026');
  const [targets, setTargets] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    availabilityTarget: 95.0,
    downtimeTarget: 10.0,
    maintenanceCostTarget: 5.0,
    assetHealthTarget: 80.0
  });

  const fetchTargets = async (fy) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/targets?fy=${encodeURIComponent(fy)}`);
      const { data } = await res.json();
      if (data) {
        setTargets(data);
        setFormData({
          availabilityTarget: data.availabilityTarget,
          downtimeTarget: data.downtimeTarget,
          maintenanceCostTarget: data.maintenanceCostTarget,
          assetHealthTarget: data.assetHealthTarget
        });
      }
    } catch (error) {
      console.error('Failed to fetch targets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTargets(selectedFy);
  }, [selectedFy]);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fiscalYear: selectedFy,
          ...formData
        })
      });
      
      if (res.ok) {
        const { data } = await res.json();
        setTargets(data);
        handleCloseModal();
      } else {
        alert('Failed to save targets');
      }
    } catch (error) {
      console.error(error);
      alert('Error saving targets');
    }
  };

  const handleGeneratePMs = async () => {
    try {
      const res = await fetch('/api/cron/generate-pms');
      const data = await res.json();
      if (res.ok) {
        alert(`Successfully triggered PM generation. ${data.message}`);
      } else {
        alert(`Failed to generate PMs: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error triggering PM generation');
    }
  };

  return (
    <div className="space-y-6 pb-10 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Asset Management Plan (ISO 55001)</h1>
          <p className="text-slate-500 mt-1">Strategic organizational objectives and performance targets.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select 
            value={selectedFy} 
            onChange={(e) => setSelectedFy(e.target.value)}
            className="w-32"
          >
            <option value="FY 2026">FY 2026</option>
            <option value="FY 2025">FY 2025</option>
            <option value="FY 2024">FY 2024</option>
          </Select>
          <button 
            onClick={handleGeneratePMs}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
          >
            Run PM Generator
          </button>
          <button 
            onClick={handleOpenModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
          >
            Edit Targets
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 animate-pulse">Loading strategic targets...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
            <h3 className="text-slate-800 dark:text-slate-200 font-semibold mb-1">Availability Target</h3>
            <p className="text-sm text-slate-500 mb-6">Maintain overall plant availability above threshold.</p>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">{targets?.availabilityTarget}%</div>
                <div className="text-sm text-green-600 font-medium mt-1">Currently at 95.2%</div>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
              </div>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-4">
              <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '95.2%' }}></div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 dark:bg-green-900/20 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
            <h3 className="text-slate-800 dark:text-slate-200 font-semibold mb-1">Reduce Downtime</h3>
            <p className="text-sm text-slate-500 mb-6">Year-over-year reduction in unplanned downtime.</p>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">{targets?.downtimeTarget}%</div>
                <div className="text-sm text-orange-500 font-medium mt-1">Currently at 12%</div>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-400">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
              </div>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-4">
              <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '80%' }}></div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 dark:bg-purple-900/20 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
            <h3 className="text-slate-800 dark:text-slate-200 font-semibold mb-1">Reduce Maint. Cost</h3>
            <p className="text-sm text-slate-500 mb-6">Target reduction in reactive maintenance spend.</p>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">{targets?.maintenanceCostTarget}%</div>
                <div className="text-sm text-red-500 font-medium mt-1">Currently at 4.5%</div>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              </div>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-4">
              <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: '45%' }}></div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 dark:bg-orange-900/20 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
            <h3 className="text-slate-800 dark:text-slate-200 font-semibold mb-1">Improve Asset Health</h3>
            <p className="text-sm text-slate-500 mb-6">Increase proportion of assets in 'Excellent' condition.</p>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">{targets?.assetHealthTarget}%</div>
                <div className="text-sm text-green-600 font-medium mt-1">Currently at +22% (Met)</div>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center text-orange-600 dark:text-orange-400">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
              </div>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-4">
              <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>

        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 mt-6">
        <h3 className="text-lg font-medium mb-4 text-slate-900 dark:text-slate-100">Strategic Alignment (ISO 55001:2014)</h3>
        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
          <p>
            The organizational objectives listed above constitute the formal <strong>Asset Management Plan (AMP)</strong> as mandated by ISO 55001. 
            This plan ensures that asset management activities are derived directly from the organizational strategic plan.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Value Realization:</strong> Aligning maintenance strategies to maximize overall equipment effectiveness (OEE).</li>
            <li><strong>Alignment:</strong> Ensuring financial, operational, and maintenance teams are working towards the same reliability goals.</li>
            <li><strong>Leadership:</strong> Top management commitment demonstrated via targeted, measurable KPI tracking.</li>
            <li><strong>Assurance:</strong> Formal risk management frameworks integrated into standard maintenance routines.</li>
          </ul>
        </div>
      </div>

      {/* Edit Targets Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                Edit Targets ({selectedFy})
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Input
                label="Availability Target (%)"
                required
                type="number"
                step="0.1"
                name="availabilityTarget"
                value={formData.availabilityTarget}
                onChange={handleChange}
              />
              
              <Input
                label="Reduce Downtime Target (%)"
                required
                type="number"
                step="0.1"
                name="downtimeTarget"
                value={formData.downtimeTarget}
                onChange={handleChange}
              />

              <Input
                label="Reduce Maintenance Cost (%)"
                required
                type="number"
                step="0.1"
                name="maintenanceCostTarget"
                value={formData.maintenanceCostTarget}
                onChange={handleChange}
              />

              <Input
                label="Improve Asset Health (%)"
                required
                type="number"
                step="0.1"
                name="assetHealthTarget"
                value={formData.assetHealthTarget}
                onChange={handleChange}
              />

              <div className="pt-4 flex items-center justify-end gap-3">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Save Targets
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
