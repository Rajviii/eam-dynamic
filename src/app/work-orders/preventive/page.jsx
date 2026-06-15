'use client';

import { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, parseISO, differenceInDays } from 'date-fns';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

export default function PreventiveMaintenancePage() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedProgram, setSelectedProgram] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assets, setAssets] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    assetId: '',
    frequencyDays: 30,
    scheduleType: 'MONTHLY',
    nextDueDate: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    fetchPrograms();
    fetchAssets();
  }, []);

  const fetchPrograms = async () => {
    try {
      const res = await fetch('/api/maintenance-programs');
      const data = await res.json();
      setPrograms(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
      const res = await fetch('/api/assets');
      const data = await res.json();
      setAssets(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Forecast Generator Utility
  const generateForecasts = (program, viewMonthStart, viewMonthEnd) => {
    if (!program || !program.nextDueDate) return [];

    let forecasts = [];
    let currentForecaseDate = parseISO(program.nextDueDate);

    // Safety break to prevent infinite loops if frequency is 0
    if (!program.frequencyDays || program.frequencyDays <= 0) return [];

    // If the next due date is after our view, we might not have any in this month (unless we backtrack, but usually we just forecast forward)
    // To be thorough, let's generate forward for 2 years and filter.
    for (let i = 0; i < 24; i++) {
      if (currentForecaseDate >= viewMonthStart && currentForecaseDate <= viewMonthEnd) {
        forecasts.push({
          date: currentForecaseDate,
          programId: program.id,
          title: program.title,
          status: currentForecaseDate < new Date() ? 'Overdue' : 'Scheduled'
        });
      }
      currentForecaseDate = addDays(currentForecaseDate, program.frequencyDays);
      if (currentForecaseDate > viewMonthEnd) break;
    }

    return forecasts;
  };

  // Calendar Logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "d";
  const rows = [];

  let days = [];
  let day = startDate;
  let formattedDate = "";

  // Collect all forecasts for the selected program, or all programs if none selected
  const displayPrograms = selectedProgram ? [selectedProgram] : programs;
  let allForecasts = [];
  displayPrograms.forEach(p => {
    allForecasts = [...allForecasts, ...generateForecasts(p, startDate, endDate)];
  });

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, dateFormat);
      const cloneDay = day;

      const dayForecasts = allForecasts.filter(f => isSameDay(f.date, cloneDay));

      days.push(
        <div
          className={`min-h-[100px] border-r border-b border-slate-200 dark:border-slate-800 p-2 transition-colors ${!isSameMonth(day, monthStart)
            ? "bg-slate-50 dark:bg-slate-900/50 text-slate-400"
            : "bg-white dark:bg-slate-900"
            }`}
          key={day}
        >
          <div className="flex justify-between items-start">
            <span className={`text-sm font-medium ${isSameDay(day, new Date()) ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : ''}`}>
              {formattedDate}
            </span>
          </div>
          <div className="mt-2 flex flex-col gap-1">
            {dayForecasts.map((f, idx) => (
              <div key={idx} className={`text-[10px] px-1.5 py-1 rounded truncate font-medium cursor-pointer ${f.status === 'Overdue' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                }`} title={f.title}>
                {f.title}
              </div>
            ))}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div className="grid grid-cols-7" key={day}>
        {days}
      </div>
    );
    days = [];
  }

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/maintenance-programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchPrograms();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-full -m-6 h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">PM Planner</h1>
          <p className="text-slate-500 mt-1 text-sm">Design maintenance strategies and visualize forecasted work orders.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + New Strategy
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* Left Pane: Strategies List */}
        <div className="w-80 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="font-semibold text-slate-700 dark:text-slate-300">Active Programs ({programs.length})</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loading ? (
              <p className="text-sm text-slate-500 text-center p-4">Loading...</p>
            ) : programs.length === 0 ? (
              <p className="text-sm text-slate-500 text-center p-4">No maintenance strategies found.</p>
            ) : (
              programs.map(p => (
                <div
                  key={p.id}
                  onClick={() => setSelectedProgram(selectedProgram?.id === p.id ? null : p)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedProgram?.id === p.id
                    ? 'bg-white dark:bg-slate-800 border-blue-500 shadow-sm'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate pr-2">{p.title}</h3>
                    <span className="shrink-0 w-2 h-2 rounded-full bg-green-500 mt-1.5"></span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2 truncate">Asset: {p.asset?.name}</p>
                  <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-500">
                    <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">Every {p.frequencyDays} Days</span>
                    <span className={p.asset?.criticality?.classification === 'CRITICAL' ? 'text-red-500' : 'text-blue-500'}>
                      {p.asset?.criticality?.classification || 'NORMAL'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Pane: Calendar */}
        <div className="flex-1 bg-white dark:bg-slate-900 flex flex-col overflow-hidden">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <h2 className="text-lg font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
              {format(currentDate, 'MMMM yyyy')}
              {selectedProgram && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full ml-2">Filtering: {selectedProgram.title}</span>
              )}
            </h2>
            <div className="flex gap-2">
              <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-sm font-medium border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800">
                Today
              </button>
              <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase">{day}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900">
            {rows}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Create PM Strategy</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <Input
                label="Strategy Title"
                required
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Monthly Filter Check"
              />
              <Select
                label="Target Asset"
                required
                value={formData.assetId}
                onChange={e => setFormData({ ...formData, assetId: e.target.value })}
              >
                <option value="">Select Asset...</option>
                {assets.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.code})</option>
                ))}
              </Select>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Frequency (Days)"
                  required
                  type="number"
                  min="1"
                  value={formData.frequencyDays}
                  onChange={e => setFormData({ ...formData, frequencyDays: parseInt(e.target.value) })}
                />
                <Select
                  label="Schedule Type"
                  value={formData.scheduleType}
                  onChange={e => setFormData({ ...formData, scheduleType: e.target.value })}
                >
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="ANNUAL">Annual</option>
                </Select>
              </div>
              <Input
                label="Next Due Date (Start)"
                required
                type="date"
                value={formData.nextDueDate}
                onChange={e => setFormData({ ...formData, nextDueDate: e.target.value })}
              />
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                  Cancel
                </button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
                  Create Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
