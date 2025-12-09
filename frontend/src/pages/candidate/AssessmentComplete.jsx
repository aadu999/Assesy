import React from 'react';
import { CheckCircle, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

const AssessmentComplete = () => {
    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-3xl p-8 max-w-lg w-full text-center border border-slate-700 shadow-2xl">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                </div>

                <h1 className="text-3xl font-bold text-white mb-4">Assessment Submitted!</h1>
                <p className="text-slate-400 text-lg mb-8">
                    Thank you for completing the assessment. Your code and responses have been successfully recorded.
                    <br /><br />
                    Our team will review your submission and get back to you shortly.
                </p>

                <div className="flex flex-col gap-3">
                    <Link
                        to="/"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
                    >
                        <Home className="w-5 h-5" />
                        Return to Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AssessmentComplete;
