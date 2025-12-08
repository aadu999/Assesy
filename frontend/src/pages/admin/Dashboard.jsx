import React from 'react';
import { Users, Code, Activity, Trophy } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-2">{value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
                <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
            </div>
        </div>
    </div>
);

const AdminDashboard = () => {
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                    <p className="text-slate-500 mt-2">Welcome back, Admin</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={Activity}
                    label="Active Sessions"
                    value="12"
                    color="bg-blue-500"
                />
                <StatCard
                    icon={Code}
                    label="Total Submissions"
                    value="48"
                    color="bg-purple-500"
                />
                <StatCard
                    icon={Trophy}
                    label="Assessments"
                    value="8"
                    color="bg-green-500"
                />
                <StatCard
                    icon={Users}
                    label="Active Users"
                    value="156"
                    color="bg-orange-500"
                />
            </div>

            {/* Recent Activity Section */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Activity</h2>
                <div className="h-48 flex items-center justify-center text-slate-400">
                    Activity chart or list would go here
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
