'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '../ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';

import {
  Box as BoxIcon,
  LayoutDashboard as DashboardIcon,
  Network as NetworkIcon,
  Package as PackageIcon,
  Activity as ActivityIcon,
  ShieldAlert as ShieldAlertIcon,
  ClipboardList as ClipboardListIcon,
  Settings as SettingsIcon,
  Moon as MoonIcon,
  Sun as SunIcon,
  Target as TargetIcon,
  Calendar as CalendarIcon,
  Users as UsersIcon,
  LogOut as LogOutIcon,
  Bell as BellIcon
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [openRequestsCount, setOpenRequestsCount] = useState(0);

  useEffect(() => {
    if (user && (user.role === 'ADMIN' || user.role === 'MANAGER')) {
      fetch('/api/part-requests/count')
        .then(res => res.json())
        .then(data => setOpenRequestsCount(data.count || 0))
        .catch(err => console.error('Failed to fetch request count'));
    }
  }, [user, pathname]); // Re-fetch when pathname changes (e.g. user navigates)

  const allNavItems = [
    { name: 'Dashboard', path: '/', icon: DashboardIcon, roles: ['ADMIN', 'MANAGER', 'VIEWER'] },
    { name: 'My Dashboard', path: '/', icon: DashboardIcon, roles: ['TECHNICIAN'] },
    { name: 'Asset Mgmt Plan', path: '/asset-management-plan', icon: TargetIcon, roles: ['ADMIN', 'MANAGER'] },
    { name: 'Assets', path: '/assets', icon: BoxIcon, roles: ['ADMIN', 'MANAGER', 'VIEWER'] },
    { name: 'Asset Hierarchy', path: '/assets/hierarchy', icon: NetworkIcon, roles: ['ADMIN', 'MANAGER'] },
    { name: 'Inventory', path: '/inventory', icon: PackageIcon, roles: ['ADMIN', 'MANAGER'] },
    { name: 'Part Requests', path: '/inventory/requests', icon: PackageIcon, roles: ['ADMIN', 'MANAGER'] },
    { name: 'Preventive Maint.', path: '/work-orders/preventive', icon: CalendarIcon, roles: ['ADMIN', 'MANAGER'] },
    { name: 'Work Orders', path: '/work-orders', icon: ClipboardListIcon, roles: ['ADMIN', 'MANAGER', 'VIEWER'] },
    { name: 'My Work Orders', path: '/work-orders', icon: ClipboardListIcon, roles: ['TECHNICIAN'] },
    { name: 'Reliability', path: '/reliability', icon: ActivityIcon, roles: ['ADMIN', 'MANAGER'] },
    { name: 'Risk Register', path: '/risk', icon: ShieldAlertIcon, roles: ['ADMIN', 'MANAGER'] },
    { name: 'Technicians / Resources', path: '/technicians', icon: UsersIcon, roles: ['ADMIN', 'MANAGER'] },
  ];

  const navItems = allNavItems.filter(item => !user || item.roles.includes(user.role));

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
              className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 ${isActive
                ? 'bg-blue-50 text-blue-700 dark:bg-slate-800 dark:text-blue-400'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
            >
              <span className={`opacity-80 relative ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                <Icon size={20} />
                {item.name === 'Part Requests' && openRequestsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
                )}
              </span>
              <span className="flex-1">{item.name}</span>
              {item.name === 'Part Requests' && openRequestsCount > 0 && (
                <span className="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 py-0.5 px-2 rounded-full text-[10px] font-bold">
                  {openRequestsCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-5 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all w-full text-left ${pathname.startsWith('/settings')
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

        <div className="flex items-center gap-3 px-4 py-3 mt-2 bg-slate-50 dark:bg-slate-800 rounded-md group">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm shrink-0">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <p className="m-0 text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.name || 'User'}</p>
            <p className="m-0 text-xs text-slate-500 dark:text-slate-400 truncate">{user?.role || 'Guest'}</p>
          </div>
          <button onClick={logout} className="text-slate-400 hover:text-red-500 transition-colors" title="Logout">
            <LogOutIcon size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
