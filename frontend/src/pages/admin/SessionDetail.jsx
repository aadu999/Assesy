import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileText, Download, CheckCircle, XCircle, ArrowLeft, Loader2, Play } from 'lucide-react';
import api from '../../services/api';
import { cn } from '../../lib/utils';

const SessionDetail = () => {
    const { token } = useParams();
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [containerStatus, setContainerStatus] = useState({ status: 'STOPPED', url: null });
    const [containerLoading, setContainerLoading] = useState(false);

    const checkStatus = async () => {
        try {
            const res = await api.get(`/admin/sessions/${token}/container/status`);
            setContainerStatus(res.data);
        } catch (e) { console.error("Status check failed", e); }
    };

    const startContainer = async () => {
        setContainerLoading(true);
        try {
            const res = await api.post(`/admin/sessions/${token}/container/start`);
            setContainerStatus({ status: 'RUNNING', url: `http://${window.location.hostname}:${res.data.port}` });
        } catch (e) {
            alert("Failed to start container: " + (e.response?.data?.message || e.message));
        } finally {
            setContainerLoading(false);
        }
    };

    const stopContainer = async () => {
        setContainerLoading(true);
        try {
            await api.post(`/admin/sessions/${token}/container/stop`);
            setContainerStatus({ status: 'STOPPED', url: null });
        } catch (e) {
            alert("Failed to stop container");
        } finally {
            setContainerLoading(false);
        }
    };

    useEffect(() => {
        const fetchSessionDetail = async () => {
            try {
                // Fetch full session details for Admin
                const detailRes = await api.get(`/admin/sessions/${token}/result`);
                setSession(detailRes.data);
                checkStatus(); // Check container status
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSessionDetail();
    }, [token]);

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;
    if (!session) return <div className="p-10 text-center">Session not found or not completed.</div>;

    return (
        <div className="space-y-6">
            <Link to="/admin/sessions" className="flex items-center text-slate-500 hover:text-slate-900 transition-colors gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Sessions
            </Link>

            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">{session.candidate_name}</h1>
                    <p className="text-slate-500 mt-1">{session.position} • {session.assessment_title || 'AI Generated Assessment'}</p>
                </div>
                <div className="flex gap-3">
                    <span className={cn(
                        "px-4 py-2 rounded-xl border font-semibold flex items-center gap-2",
                        session.status === 'COMPLETED' ? "bg-green-50 border-green-200 text-green-700" : "bg-blue-50 border-blue-200 text-blue-700"
                    )}>
                        {session.status}
                    </span>
                    <div className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold border border-slate-900">
                        Score: {session.score ?? 'N/A'}/100
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Stats & MCQ */}
                <div className="space-y-6 lg:col-span-2">
                    {/* AI Feedback Card */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-purple-600" />
                            AI Evaluation
                        </h2>
                        {session.feedback ? (
                            <div className="prose prose-sm max-w-none text-slate-600">
                                {/* Only simple display for now. Real implementation would parse JSON feedback */}
                                <p className="whitespace-pre-wrap">{session.feedback.feedback || "No detailed qualitative feedback available."}</p>

                                {session.feedback.strengths && (
                                    <div className="mt-4">
                                        <h4 className="font-bold text-green-700 mb-2">Strengths</h4>
                                        <ul className="list-disc pl-5 space-y-1">
                                            {session.feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                        </ul>
                                    </div>
                                )}

                                {session.feedback.weaknesses && (
                                    <div className="mt-4">
                                        <h4 className="font-bold text-red-700 mb-2">Areas for Improvement</h4>
                                        <ul className="list-disc pl-5 space-y-1">
                                            {session.feedback.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-slate-500 italic">Pending AI analysis...</p>
                        )}
                    </div>

                    {/* MCQ Responses */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Quiz Responses</h2>
                        <div className="space-y-4">
                            {session.responses?.map((resp, i) => (
                                <div key={i} className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <div className="mt-1">
                                        {resp.is_correct ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">{resp.question_text}</p>
                                        <p className="text-sm text-slate-600 mt-1">Answer: <span className={resp.is_correct ? "text-green-700 font-medium" : "text-red-600 font-medium"}>{resp.response}</span></p>
                                        {!resp.is_correct && (
                                            <p className="text-sm text-green-700 mt-1">Correct Answer: <span className="font-medium">{resp.correct_answer}</span></p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Code & Actions */}
                <div className="space-y-6">
                    {/* Code Review Section */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Code Submission & Review</h2>

                        <div className="mb-4 flex flex-col gap-2">
                            {containerStatus.status === 'RUNNING' ? (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                                    <div className="flex items-center gap-2 text-green-700 font-semibold mb-2">
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                        Container Running
                                    </div>
                                    <a
                                        href={containerStatus.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full py-2 bg-green-600 hover:bg-green-700 text-white text-center rounded-lg font-medium transition-colors mb-2"
                                    >
                                        Open Code Editor
                                    </a>
                                    <button
                                        onClick={stopContainer}
                                        disabled={containerLoading}
                                        className="w-full py-2 text-slate-600 hover:bg-white border hover:border-slate-300 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        {containerLoading ? 'Stopping...' : 'Stop Review Environment'}
                                    </button>
                                </div>
                            ) : (
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                                    <p className="text-sm text-slate-500 mb-3">Start a temporary container to review the code and run tests.</p>
                                    <button
                                        onClick={startContainer}
                                        disabled={containerLoading}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                                    >
                                        {containerLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                        Start Review
                                    </button>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={async () => {
                                try {
                                    const res = await api.get(`/admin/sessions/${token}/download`, { responseType: 'blob' });
                                    const url = window.URL.createObjectURL(new Blob([res.data]));
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.setAttribute('download', `submission-${session.id}.tar`);
                                    document.body.appendChild(link);
                                    link.click();
                                    link.remove();
                                } catch (e) {
                                    alert("Download failed.");
                                }
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-medium transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Download Zip
                        </button>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Candidate Info</h2>
                        <div className="space-y-3 text-sm">
                            <div>
                                <label className="text-slate-500 block mb-1">Email / Contact</label>
                                <p className="font-medium text-slate-900">{session.candidate_email || "N/A"}</p>
                            </div>
                            <div>
                                <label className="text-slate-500 block mb-1">Started At</label>
                                <p className="font-medium text-slate-900">{new Date(session.active_at).toLocaleString()}</p>
                            </div>
                            <div>
                                <label className="text-slate-500 block mb-1">Duration</label>
                                <p className="font-medium text-slate-900">45 minutes</p>
                            </div>
                            {session.education_qualification && (
                                <div className="pt-4 border-t border-slate-100 mt-4">
                                    <h3 className="font-semibold text-slate-700 mb-2">Education</h3>
                                    <div className="space-y-2">
                                        <p><span className="text-slate-500">Qualification:</span> <span className="text-slate-900">{session.education_qualification}</span></p>
                                        <p><span className="text-slate-500">Course:</span> <span className="text-slate-900">{session.education_course}</span></p>
                                        <p><span className="text-slate-500">College:</span> <span className="text-slate-900">{session.education_college}</span></p>
                                        <p><span className="text-slate-500">Year:</span> <span className="text-slate-900">{session.education_year}</span></p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default SessionDetail;
