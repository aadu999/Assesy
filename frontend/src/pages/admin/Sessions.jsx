import React, { useState, useEffect } from 'react';
import { Play, Copy, ExternalLink, Loader2, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { cn } from '../../lib/utils';

const SessionsPage = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [assessments, setAssessments] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newSession, setNewSession] = useState({ candidateName: '', position: '', assessmentId: '' });
    const [error, setError] = useState(null);

    const [publicUrl, setPublicUrl] = useState('');

    useEffect(() => {
        fetchSessions();
        fetchAssessments();
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/admin/settings');
            if (res.data.public_url_candidate) {
                setPublicUrl(res.data.public_url_candidate.replace(/\/$/, '')); // trim trailing slash
            }
        } catch (e) {
            console.error("Failed to fetch settings", e);
        }
    };

    const [toast, setToast] = useState(null);

    const fetchSessions = async () => {
        try {
            const response = await api.get('/admin/sessions');
            setSessions(response.data);
        } catch (error) {
            console.error('Failed to fetch sessions', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAssessments = async () => {
        try {
            const response = await api.get('/assessments');
            setAssessments(response.data);
        } catch (error) {
            console.error("Failed to fetch assessments", error);
        }
    }

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(null), 3000);
    };

    const handleCreateSession = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            const res = await api.post('/sessions', newSession);
            setIsModalOpen(false);
            setNewSession({ candidateName: '', position: '', assessmentId: '' });
            fetchSessions();

            // Use configured public URL or fallback to window.origin
            const baseUrl = publicUrl || window.location.origin;
            const link = `${baseUrl}/assessment/${res.data.token}`;

            showToast(`Session created! Link: ${link}`);
            // Also copy to clipboard automatically
            navigator.clipboard.writeText(link);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create session');
        }
    };

    const copyLink = (token) => {
        const baseUrl = publicUrl || window.location.origin;
        const link = `${baseUrl}/assessment/${token}`;
        navigator.clipboard.writeText(link);
        showToast("Link copied to clipboard!");
    };

    return (
        <div className="space-y-6 relative">
            {/* Toast Notification */}
            {toast && (
                <div className="fixed top-4 right-4 z-[60] bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-top-2 duration-200">
                    <div className="bg-green-500 rounded-full p-1"><Check className="w-3 h-3 text-black" /></div>
                    <p className="text-sm font-medium pr-2 max-w-sm truncate">{toast}</p>
                </div>
            )}

            {/* Create Session Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                        <h2 className="text-xl font-bold mb-4">Create New Session</h2>
                        {error && <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>}
                        <form onSubmit={handleCreateSession} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Candidate Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border rounded-xl"
                                    value={newSession.candidateName}
                                    onChange={(e) => setNewSession({ ...newSession, candidateName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Position</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border rounded-xl"
                                    value={newSession.position}
                                    onChange={(e) => setNewSession({ ...newSession, position: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Assessment</label>
                                <select
                                    required
                                    className="w-full px-3 py-2 border rounded-xl"
                                    value={newSession.assessmentId}
                                    onChange={(e) => setNewSession({ ...newSession, assessmentId: e.target.value })}
                                >
                                    <option value="">Select an Assessment...</option>
                                    {assessments.map(a => (
                                        <option key={a.id} value={a.id}>{a.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-xl">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-xl">Create Session</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Interview Sessions</h1>
                    <p className="text-slate-500 text-sm mt-1">Track active and completed interviews</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-black font-medium transition-colors shadow-lg shadow-slate-900/20"
                >
                    <Play className="w-4 h-4" />
                    <span>Create Session</span>
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-900">Candidate</th>
                            <th className="px-6 py-4 font-semibold text-slate-900">Position</th>
                            <th className="px-6 py-4 font-semibold text-slate-900">Assessment</th>
                            <th className="px-6 py-4 font-semibold text-slate-900">Status</th>
                            <th className="px-6 py-4 font-semibold text-slate-900">Created At</th>
                            <th className="px-6 py-4 font-semibold text-slate-900">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-8 text-center">
                                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto" />
                                </td>
                            </tr>
                        ) : sessions.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-8 text-center text-slate-500">No sessions found</td>
                            </tr>
                        ) : (
                            sessions.map((session) => (
                                <tr key={session.token} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900">{session.candidate_name}</td>
                                    <td className="px-6 py-4">{session.position}</td>
                                    <td className="px-6 py-4">{session.assessment_title || 'AI Generated'}</td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                                            session.status === 'COMPLETED' ? "bg-green-50 text-green-700 border-green-200" :
                                                session.status === 'IN_PROGRESS' ? "bg-blue-50 text-blue-700 border-blue-200" :
                                                    "bg-slate-100 text-slate-600 border-slate-200"
                                        )}>
                                            {session.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{new Date(session.created_at).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 flex gap-2">
                                        <button
                                            onClick={() => copyLink(session.token)}
                                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                                            title="Copy Link"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                        <Link
                                            to={`/admin/sessions/${session.token}`}
                                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                                            title="View Details"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </Link>
                                        <button
                                            onClick={async () => {
                                                if (confirm('Delete this session?')) {
                                                    try {
                                                        await api.delete(`/admin/sessions/${session.token}`);
                                                        fetchSessions();
                                                    } catch (e) { alert('Failed to delete'); }
                                                }
                                            }}
                                            className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                                            title="Delete"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                        </button>
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

export default SessionsPage;
