import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import api from '../../services/api';

const CodingEnvironment = () => {
    const { token } = useParams();
    const [iframeUrl, setIframeUrl] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Provision container and get URL
        const startSession = async () => {
            try {
                // This could be a new endpoint or piggyback on existing
                // Backend creates container and returns subdomain URL
                // Check backend provision logic
                // Assuming POST /sessions/:token/start returns url
                const response = await api.post(`/session/${token}/start`);
                // Append file arg to open README by default
                let url = response.data.url;
                if (url.includes('?')) url += '&file=README.md';
                else url += '?file=README.md';

                // Add delay to allow container services to boot
                await new Promise(r => setTimeout(r, 5000));

                setIframeUrl(url);
            } catch (err) {
                console.error("Failed to start session:", err);
                if (err.response?.status === 403) {
                    alert("Session expired or completed.");
                    window.location.href = "/";
                }
            } finally {
                setLoading(false);
            }
        };
        startSession();
    }, [token]);

    const [testOutput, setTestOutput] = useState('');
    const [runningTests, setRunningTests] = useState(false);

    const handleRunTests = async () => {
        setRunningTests(true);
        setTestOutput('');
        try {
            const response = await api.post(`/session/${token}/run`);
            setTestOutput(response.data.output);
        } catch (err) {
            console.error("Run tests failed:", err);
            setTestOutput("Failed to run tests provided by backend.");
        } finally {
            setRunningTests(false);
        }
    };

    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleFinalSubmit = async () => {
        setSubmitting(true);
        try {
            // Details are already collected at registration
            await api.post(`/session/${token}/submit-workspace`, { details: {} });

            alert("Assessment Submitted Successfully! You may close this window.");
            window.close();
            // Fallback for browsers preventing window.close()
            window.location.href = "/assessment/complete";
        } catch (err) {
            console.error(err);
            alert("Submission failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
            <div className="text-center">
                <h2 className="text-xl font-bold">{loading ? "Setting up Dev Environment..." : "Starting Code Server..."}</h2>
                <p className="text-slate-400 mt-2 max-w-sm">
                    {loading ? "Allocating a private coding container for you." : "Container is ready. Waiting for VS Code (code-server) to launch. This usually takes 10-15 seconds."}
                </p>
                {loading && <p className="text-xs text-slate-600 mt-4">If this takes longer than 1 minute, refresh.</p>}
            </div>
        </div>
    );

    if (!iframeUrl) return <div className="min-h-screen flex items-center justify-center">Failed to load environment.</div>;

    return (
        <div className="w-full h-screen bg-black flex flex-col">
            <div className="bg-slate-900 border-b border-slate-800 p-2 flex justify-between items-center px-4 h-14">
                <span className="text-slate-400 text-sm font-inco font-medium">Coding Interface</span>
                <div className="flex items-center gap-4">
                    <div className="text-xs text-slate-500">
                        Running on: {iframeUrl.replace('http://', '')}
                    </div>
                    <button
                        onClick={handleRunTests}
                        disabled={runningTests}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        {runningTests ? <Loader2 className="w-4 h-4 animate-spin" /> : "Run Tests"}
                    </button>
                    <button
                        onClick={() => setShowSubmitModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors"
                    >
                        Submit Assessment
                    </button>
                </div>
            </div>

            {/* Submission Modal */}
            {showSubmitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
                        <h2 className="text-xl font-bold text-white mb-2">Are you sure?</h2>
                        <p className="text-slate-400 text-sm mb-6">
                            Once submitted, you cannot return to this assessment. Ensure your code passes the tests.
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowSubmitModal(false)}
                                className="px-4 py-2 text-slate-400 hover:text-white font-medium hover:bg-slate-800 rounded-xl"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleFinalSubmit}
                                disabled={submitting}
                                className="px-4 py-2 bg-green-600 text-white font-medium hover:bg-green-700 rounded-xl disabled:opacity-50 flex items-center gap-2"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Submission"}
                            </button>
                        </div>
                    </div>
                </div>
            )}


            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 relative">
                    <iframe
                        src={iframeUrl}
                        className="w-full h-full border-0"
                        title="Coding Environment"
                        allow="clipboard-read; clipboard-write;"
                    />
                </div>

                {testOutput && (
                    <div className="w-1/3 bg-slate-950 border-l border-slate-800 p-4 font-mono text-sm text-slate-300 overflow-y-auto">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-slate-500 uppercase text-xs font-bold tracking-wider">Test Output</h3>
                            <button onClick={() => setTestOutput('')} className="text-xs text-slate-500 hover:text-white">Close</button>
                        </div>
                        <pre className="whitespace-pre-wrap">{testOutput}</pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CodingEnvironment;
