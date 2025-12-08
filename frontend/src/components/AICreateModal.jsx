import React, { useState } from 'react';
import { Sparkles, Loader2, X, Check, Save } from 'lucide-react';
import api from '../services/api';
import { cn } from '../lib/utils';

const AICreateModal = ({ onClose, onSuccess }) => {
    const [step, setStep] = useState('input'); // input, generating, review, saving
    const [jobDescription, setJobDescription] = useState('');
    const [complexity, setComplexity] = useState('Medium');
    const [generatedData, setGeneratedData] = useState(null);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!jobDescription) return;
        setStep('generating');
        setError('');

        try {
            // Updated to use the session generation logic for assessment template
            // Or use /assessments/generate if available. 
            // Using /sessions/generate-ai logic, but we want a template.
            // Let's use /assessments/generate as per backend line 604
            const response = await api.post('/assessments/generate', { jobDescription });
            setGeneratedData(response.data);
            setStep('review');
        } catch (err) {
            console.error(err);
            setError('Failed to generate assessment. Please try again.');
            setStep('input');
        }
    };

    const handleSave = async () => {
        if (!generatedData) return;
        setStep('saving');

        try {
            await api.post('/assessments/create-ai', {
                title: `Assessment for ${jobDescription.substring(0, 30)}...`,
                jobDescription,
                questions: generatedData.questions,
                codingChallenge: generatedData.coding_challenge
            });
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            setError('Failed to save assessment.');
            setStep('review');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={cn(
                "bg-white rounded-2xl shadow-2xl w-full transition-all duration-300 flex flex-col max-h-[90vh]",
                step === 'review' ? "max-w-4xl h-[80vh]" : "max-w-xl"
            )}>
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        {step === 'review' ? 'Review Generated Assessment' : 'Generate with AI'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-900 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 overflow-y-auto">
                    {step === 'input' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Job Description / Requirements
                                </label>
                                <textarea
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value)}
                                    placeholder="e.g. Senior Frontend Developer with React, TypeScript, and performance optimization skills..."
                                    className="w-full h-32 px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none transition-all"
                                />
                            </div>
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                        </div>
                    )}

                    {step === 'generating' && (
                        <div className="h-40 flex flex-col items-center justify-center text-center">
                            <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-4" />
                            <h3 className="text-lg font-semibold text-slate-900">Generating Assessment...</h3>
                            <p className="text-slate-500 text-sm mt-1">Analyzing requirements and crafting questions</p>
                        </div>
                    )}

                    {step === 'review' && generatedData && (
                        <div className="space-y-8">
                            <div>
                                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs">1</span>
                                    Coding Challenge
                                </h3>
                                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                                    <h4 className="font-bold text-slate-900">{generatedData.coding_challenge.title}</h4>
                                    <p className="text-sm text-slate-600 mt-2 whitespace-pre-line">{generatedData.coding_challenge.description}</p>
                                    <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 gap-4 text-xs text-slate-500">
                                        <div>
                                            <span className="font-semibold block mb-1">Constraints:</span>
                                            <ul className="list-disc pl-4 space-y-1">
                                                {generatedData.coding_challenge.constraints?.map((c, i) => <li key={i}>{c}</li>)}
                                            </ul>
                                        </div>
                                        <div>
                                            <span className="font-semibold block mb-1">Test Cases:</span>
                                            {generatedData.coding_challenge.test_cases?.length} cases included
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-xs">2</span>
                                    Multiple Choice Questions ({generatedData.questions.filter(q => q.type === 'MCQ').length})
                                </h3>
                                <div className="space-y-3">
                                    {generatedData.questions.filter(q => q.type === 'MCQ').map((q, i) => (
                                        <div key={i} className="p-4 bg-white border border-slate-100 rounded-lg shadow-sm">
                                            <p className="font-medium text-slate-900 mb-2">{i + 1}. {q.question_text}</p>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                {q.options?.map((opt, idx) => (
                                                    <div key={idx} className={cn(
                                                        "px-3 py-2 rounded-lg border",
                                                        opt === q.correct_answer ? "bg-green-50 border-green-200 text-green-700 font-medium" : "bg-white border-slate-100 text-slate-500"
                                                    )}>
                                                        {opt}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 rounded-b-2xl">
                    {step === 'input' && (
                        <>
                            <button onClick={onClose} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={!jobDescription}
                                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg disabled:opacity-50 transition-all flex items-center gap-2"
                            >
                                <Sparkles className="w-4 h-4" />
                                Generate
                            </button>
                        </>
                    )}
                    {step === 'review' && (
                        <>
                            <button onClick={() => setStep('input')} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors">
                                Back
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-5 py-2.5 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 shadow-lg shadow-green-500/20 transition-all flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Save Assessment
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AICreateModal;
