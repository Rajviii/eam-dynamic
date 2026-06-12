'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '../ThemeProvider';

// Inline SVGs for icons
const BoxIcon = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>;
const DashboardIcon = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>;
const NetworkIcon = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="16" y="16" width="6" height="6" rx="1"></rect><rect x="2" y="16" width="6" height="6" rx="1"></rect><rect x="9" y="2" width="6" height="6" rx="1"></rect><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"></path><path d="M12 12V8"></path></svg>;
const PackageIcon = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>;
const ActivityIcon = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>;
const ShieldAlertIcon = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>;
const ClipboardListIcon = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><line x1="12" y1="11" x2="16" y2="11"></line><line x1="12" y1="16" x2="16" y2="16"></line><line x1="8" y1="11" x2="8.01" y2="11"></line><line x1="8" y1="16" x2="8.01" y2="16"></line></svg>;
const SettingsIcon = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const MoonIcon = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>;
const SunIcon = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>;

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: DashboardIcon },
    { name: 'Assets', path: '/assets', icon: BoxIcon },
    { name: 'Asset Hierarchy', path: '/assets/hierarchy', icon: NetworkIcon },
    { name: 'Inventory', path: '/inventory', icon: PackageIcon },
    { name: 'Reliability', path: '/reliability', icon: ActivityIcon },
    { name: 'Risk Register', path: '/risk', icon: ShieldAlertIcon },
    { name: 'Work Orders', path: '/work-orders', icon: ClipboardListIcon },
  ];

  return (
    <aside className="fixed left-0 top-0 w-64 h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col border-r border-slate-200 dark:border-slate-800 transition-colors duration-300 z-50">
      <div className="h-16 flex items-center px-5 gap-3 border-b border-slate-200 dark:border-slate-800">
        <div className="bg-blue-600 text-white w-9 h-9 rounded-lg flex items-center justify-center">
          <BoxIcon size={20} />
        </div>
        <h1 className="text-xl font-semibold tracking-tight m-0 text-slate-900 dark:text-white">EAM Pro</h1>
      </div>

      <nav className="flex-1 py-5 px-3 flex flex-col gap-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-50 text-blue-700 dark:bg-slate-800 dark:text-blue-400' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
            >
              <span className={`opacity-80 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                <Icon size={20} />
              </span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-5 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
        <Link 
          href="/settings"
          className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all w-full text-left ${
            pathname.startsWith('/settings')
              ? 'bg-blue-50 text-blue-700 dark:bg-slate-800 dark:text-blue-400'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
          }`}
        >
          <span className={`opacity-80 ${pathname.startsWith('/settings') ? 'text-blue-600 dark:text-blue-400' : ''}`}><SettingsIcon size={20} /></span>
          <span>Settings</span>
        </Link>

        <div className="flex items-center justify-between px-4 py-3 rounded-md bg-slate-50 dark:bg-slate-800/50">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
          <button
            onClick={toggleTheme}
            className={`w-11 h-6 rounded-full relative transition-colors duration-300 focus:outline-none ${theme === 'dark' ? 'bg-blue-600' : 'bg-slate-400'}`}
            aria-label="Toggle theme"
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-[2px] transition-transform duration-300 flex items-center justify-center shadow-sm ${theme === 'dark' ? 'translate-x-5' : 'translate-x-[2px]'}`}>
              {theme === 'dark' ? <MoonIcon size={12} className="text-slate-900" /> : <SunIcon size={12} className="text-slate-400" />}
            </div>
          </button>
        </div>

        <div className="flex items-center gap-3 px-4 py-3 mt-2 bg-slate-50 dark:bg-slate-800 rounded-md">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
            A
          </div>
          <div className="flex flex-col">
            <p className="m-0 text-sm font-semibold text-slate-900 dark:text-white">Admin User</p>
            <p className="m-0 text-xs text-slate-500 dark:text-slate-400">Maintenance Manager</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
