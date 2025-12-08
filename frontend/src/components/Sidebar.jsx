import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Code2, PlayCircle, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

const Sidebar = () => {
    const { logout } = useAuth();

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
        { icon: PlayCircle, label: 'Sessions', path: '/admin/sessions' },
        { icon: FileText, label: 'Assessments', path: '/admin/assessments' },
        { icon: Code2, label: 'Submissions', path: '/admin/submissions' },
        { icon: Users, label: 'Users', path: '/admin/users' },
        { icon: Settings, label: 'Settings', path: '/admin/settings' },
    ];

    return (
        <aside className="w-64 h-screen sticky top-0 bg-white/80 backdrop-blur-xl border-r border-slate-200 flex flex-col p-6 z-20 transition-all">
            <div className="mb-10 px-2 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">
                    A
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-800 tracking-tight">Assesy</h1>
                    <p className="text-xs text-slate-500 font-medium">Admin Portal</p>
                </div>
            </div>

            <nav className="space-y-1 flex-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group",
                            isActive
                                ? "bg-blue-50 text-blue-600 shadow-sm"
                                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                        )}
                    >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="mt-auto pt-6 border-t border-slate-100">
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-500 hover:bg-red-50 transition-all duration-200"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
