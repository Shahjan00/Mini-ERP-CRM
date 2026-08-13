import React from 'react';
import { LogOut, User as UserIcon, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-medium text-slate-400">
          Welcome back, <span className="text-slate-100 font-semibold">{user?.name}</span>
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Role Pill */}
        <div className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 border border-slate-700 text-sky-400">
          {user?.role} Access
        </div>

        {/* User avatar & logout */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <UserIcon className="w-4 h-4" />
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-rose-400 transition-colors py-1.5 px-2.5 rounded-lg hover:bg-rose-500/10"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
