import React, { useState, useEffect } from 'react';
import { Plus, Sparkles, FileText, Loader2 } from 'lucide-react';
import api from '../../services/api';
import AICreateModal from '../../components/AICreateModal';

const Assessments = () => {
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAiModal, setShowAiModal] = useState(false);
    const [selectedAssessment, setSelectedAssessment] = useState(null);

    useEffect(() => {
        fetchAssessments();
    }, []);

    const fetchAssessments = async () => {
        try {
            const response = await api.get('/assessments');
            setAssessments(response.data);
        } catch (error) {
            console.error('Failed to fetch assessments', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this assessment?")) return;
        try {
            await api.delete(`/assessments/${id}`);
            fetchAssessments();
        } catch (error) {
            console.error("Failed to delete assessment", error);
            alert("Failed to delete assessment");
        }
    };

    return (
        <div className="space-y-6 relative">
            {selectedAssessment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-2xl">
                            <h2 className="text-xl font-bold">{selectedAssessment.title}</h2>
                            <button onClick={() => setSelectedAssessment(null)} className="text-slate-400 hover:text-black"><FileText /></button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <h3 className="font-semibold text-slate-900 mb-2">Job Description</h3>
                            <p className="text-slate-600 text-sm mb-6 bg-slate-50 p-3 rounded-lg border">{selectedAssessment.job_description || 'N/A'}</p>

                            <h3 className="font-semibold text-slate-900 mb-2">Questions</h3>
                            <div className="space-y-3">
                                {selectedAssessment.questions?.map((q, i) => (
                                    <div key={i} className="p-3 border rounded-lg">
                                        <div className="font-medium text-sm mb-1">{q.question_text}</div>
                                        <div className="text-xs text-slate-500">{q.type}</div>
                                    </div>
                                ))}
                                {(!selectedAssessment.questions || selectedAssessment.questions.length === 0) && <p className="text-slate-400">No questions found (details not fetched).</p>}
                            </div>
                        </div>
                        <div className="p-4 border-t bg-slate-50 rounded-b-2xl flex justify-end">
                            <button onClick={() => setSelectedAssessment(null)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 font-medium">Close</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Assessment Library</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage and create coding assessments</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium transition-colors shadow-sm">
                        <Plus className="w-4 h-4" />
                        <span>Manually Create</span>
                    </button>
                    <button
                        onClick={() => setShowAiModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 font-medium transition-all"
                    >
                        <Sparkles className="w-4 h-4" />
                        <span>Generate with AI</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
            ) : assessments.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <h3 className="text-lg font-medium text-slate-900">No assessments found</h3>
                    <p className="mt-1">Create your first assessment to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assessments.map((assessment) => (
                        <div
                            key={assessment.id}
                            onClick={() => setSelectedAssessment(assessment)}
                            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-500"
                        >
                            <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{assessment.title}</h3>
                            <p className="text-slate-400 text-sm mt-2 line-clamp-2">{assessment.job_description || 'No description provided'}</p>
                            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                                <span className="px-2 py-1 bg-slate-100 rounded-md">ID: {assessment.id}</span>
                                <span>{new Date().toLocaleDateString()}</span> {/* Placeholder for created_at */}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* AI Modal */}
            {showAiModal && (
                <AICreateModal
                    onClose={() => setShowAiModal(false)}
                    onSuccess={() => {
                        // Refresh list
                        fetchAssessments();
                    }}
                />
            )}
        </div>
    );
};

export default Assessments;
