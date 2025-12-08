import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, CheckCircle, Clock, Code2 } from 'lucide-react';
import api from '../../services/api';

const Welcome = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // Fetch session details to verify token and show info
        const fetchSession = async () => {
            try {
                // We need a public endpoint for this, or use the token to auth
                // Assuming GET /session/:token is public/protected by token
                // Modify backend if needed
                const response = await api.get(`/session/${token}`);
                setSession(response.data);
            } catch (err) {
                setError('Invalid or expired session link.');
            } finally {
                setLoading(false);
            }
        };
        fetchSession();
    }, [token]);

    const startAssessment = () => {
        navigate(`/assessment/${token}/register`);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Loading...</div>;
    if (error) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-red-400">{error}</div>;

    return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <div className="mb-10 text-center">
                    <div className="w-16 h-16 mx-auto bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
                        <Code2 className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold mb-4">Technical Assessment</h1>
                    <p className="text-slate-400 text-lg">Position: <span className="text-white font-semibold">{session.position}</span></p>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-3xl p-8 mb-8">
                    <h2 className="text-xl font-bold mb-6">Instructions</h2>
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 font-bold text-slate-300">1</div>
                            <div>
                                <h3 className="font-semibold mb-1">Knowledge Check</h3>
                                <p className="text-slate-400 text-sm">Answer {session.question_count || 'a few'} multiple choice and fill-in-the-blank questions.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 font-bold text-slate-300">2</div>
                            <div>
                                <h3 className="font-semibold mb-1">Coding Challenge</h3>
                                <p className="text-slate-400 text-sm">Solve a real-world coding problem in our VS Code environment.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 font-bold text-slate-300">3</div>
                            <div>
                                <h3 className="font-semibold mb-1">Submission</h3>
                                <p className="text-slate-400 text-sm">Submit your code directly from the editor. Once submitted, you cannot return.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={startAssessment}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-bold text-lg shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                >
                    <span>Start Assessment</span>
                    <Play className="w-5 h-5 fill-current" />
                </button>
            </div>
        </div>
    );
};

export default Welcome;
