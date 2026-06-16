'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { ThemeProvider } from '../ThemeProvider';

function LayoutInner({ children }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  
  const isLoginPage = pathname === '/login';

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isLoginPage) {
    return <main className="flex-1">{children}</main>;
  }

  // If we reach here and no user, the AuthProvider's useEffect will redirect us
  if (!user) {
    return null; 
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64 overflow-hidden relative">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950">
          <div className="mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AppLayout({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LayoutInner>{children}</LayoutInner>
      </AuthProvider>
    </ThemeProvider>
  );
}
