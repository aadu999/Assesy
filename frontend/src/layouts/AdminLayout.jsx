import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const AdminLayout = () => {
    console.log("Rendering AdminLayout");
    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
            <Sidebar />
            <main className="flex-1 min-w-0 h-screen overflow-y-auto">
                <div className="max-w-7xl mx-auto p-8 pb-20">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
