import React, { useState, useEffect } from 'react';
import { UserPlus, Shield, User, Loader2 } from 'lucide-react';
import api from '../../services/api';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'INTERVIEWER' });
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            await api.post('/auth/register', newUser);
            setIsAddModalOpen(false);
            setNewUser({ username: '', password: '', role: 'INTERVIEWER' });
            fetchUsers();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add user');
        }
    };

    return (
        <div className="space-y-6 relative">
            {/* Add User Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                        <h2 className="text-xl font-bold mb-4">Add New User</h2>
                        {error && <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>}
                        <form onSubmit={handleAddUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Username</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border rounded-xl"
                                    value={newUser.username}
                                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full px-3 py-2 border rounded-xl"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Role</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-xl"
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                >
                                    <option value="INTERVIEWER">Interviewer</option>
                                    <option value="ADMIN">Admin</option>
                                    <option value="CANDIDATE">Candidate</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-xl">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-xl">Create User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage system access and roles</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors shadow-sm shadow-blue-500/20"
                >
                    <UserPlus className="w-4 h-4" />
                    <span>Add User</span>
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-900">Username</th>
                            <th className="px-6 py-4 font-semibold text-slate-900">Role</th>
                            <th className="px-6 py-4 font-semibold text-slate-900">Created At</th>
                            <th className="px-6 py-4 font-semibold text-slate-900">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-8 text-center">
                                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto" />
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-8 text-center text-slate-500">No users found</td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                            {user.role === 'ADMIN' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                        </div>
                                        {user.username}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${user.role === 'ADMIN'
                                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                                            : user.role === 'INTERVIEWER'
                                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                : 'bg-green-50 text-green-700 border-green-200'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{new Date(user.created_at).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">
                                        <button className="text-slate-400 hover:text-red-500 transition-colors font-medium">Remove</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UsersPage;
