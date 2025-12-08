import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, ArrowRight, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { cn } from '../../lib/utils';

const AssessmentQuestions = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                // Fetch ONLY questions (not coding challenge details yet?)
                // Assuming backend /admin/sessions/:token/questions works for candidate too or new endpoint
                // Fetch public session details
                const response = await api.get(`/session/${token}/details`);
                // Filter out CODING questions as they are handled in the next step
                const questions = response.data.questions.filter(q => q.type !== 'CODING');
                setQuestions(questions);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchQuestions();
    }, [token]);

    const handleAnswer = (questionId, value) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleNext = async () => {
        setSubmitting(true);
        try {
            // Save answers
            const formattedAnswers = Object.entries(answers).map(([qId, val]) => ({
                questionId: qId,
                answer: val
            }));
            await api.post(`/session/${token}/answers`, { answers: formattedAnswers });
            // Navigate to coding environment
            navigate(`/assessment/${token}/coding`);
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Loading questions...</div>;

    const progress = (Object.keys(answers).length / questions.length) * 100;

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <h1 className="font-bold text-slate-900">Knowledge Check</h1>
                    <div className="flex items-center gap-4">
                        <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-sm text-slate-500 font-medium">{Object.keys(answers).length}/{questions.length} Answered</span>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto py-12 px-6 space-y-8">
                {questions.map((q, index) => (
                    <div key={q.id} className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                        <div className="flex gap-4">
                            <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                                {index + 1}
                            </span>
                            <div className="flex-1">
                                <h3 className="text-lg font-medium text-slate-900 mb-6"><MarkdownView content={q.question_text} /></h3>

                                {q.type === 'MCQ' && (
                                    <div className="space-y-3">
                                        {q.options.map((opt, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleAnswer(q.id, opt)}
                                                className={cn(
                                                    "w-full text-left px-5 py-4 rounded-xl border transition-all flex items-center justify-between group",
                                                    answers[q.id] === opt
                                                        ? "bg-blue-50 border-blue-500 ring-1 ring-blue-500"
                                                        : "bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                                                )}
                                            >
                                                <span className={cn(
                                                    "font-medium",
                                                    answers[q.id] === opt ? "text-blue-700" : "text-slate-600 group-hover:text-slate-900"
                                                )}>{opt}</span>
                                                {answers[q.id] === opt && <Check className="w-5 h-5 text-blue-600" />}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {q.type === 'FILL_IN_THE_BLANKS' && (
                                    <div>
                                        <input
                                            type="text"
                                            placeholder="Type your answer here..."
                                            value={answers[q.id] || ''}
                                            onChange={(e) => handleAnswer(q.id, e.target.value)}
                                            className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium text-slate-900"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                <div className="flex justify-end pt-8">
                    <button
                        onClick={handleNext}
                        disabled={Object.keys(answers).length !== questions.length || submitting}
                        className="px-8 py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-black shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <>
                                <span>Proceed to Coding Challenge</span>
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Basic Markdown & Mermaid Renderer
const MarkdownView = ({ content }) => {
    useEffect(() => {
        if (window.mermaid) {
            window.mermaid.init(undefined, document.querySelectorAll('.mermaid'));
        }
    }, [content]);

    if (!content) return null;

    // Very simple split for mermaid blocks
    const parts = content.split(/```mermaid/);

    return (
        <div className="prose prose-slate max-w-none text-slate-900">
            {parts.map((part, i) => {
                if (i === 0) return <MarkdownText key={i} text={part} />;

                // For subsequent parts, they start with mermaid code until ```
                const endCode = part.indexOf('```');
                const code = part.substring(0, endCode);
                const rest = part.substring(endCode + 3);

                return (
                    <React.Fragment key={i}>
                        <div className="mermaid my-4 bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-center overflow-x-auto">
                            {code}
                        </div>
                        <MarkdownText text={rest} />
                    </React.Fragment>
                );
            })}
        </div>
    );
};

// Simple Markdown Text Formatter (Images, Bold, Code, Headers)
const MarkdownText = ({ text }) => {
    // 1. Handle Images: ![alt](url)
    const renderImages = (txt) => {
        const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
        let lastIndex = 0;
        const elements = [];
        let match;

        while ((match = imgRegex.exec(txt)) !== null) {
            elements.push(txt.substring(lastIndex, match.index));
            elements.push(
                <img
                    key={match.index}
                    src={match[2]}
                    alt={match[1]}
                    className="max-w-full h-auto rounded-lg shadow-sm my-4"
                />
            );
            lastIndex = imgRegex.lastIndex;
        }
        elements.push(txt.substring(lastIndex));

        // Flatten and render text parts
        return elements.map((el, i) => typeof el === 'string' ? <span key={i} dangerouslySetInnerHTML={{ __html: formatText(el) }}></span> : el);
    };

    const formatText = (t) => {
        // Headers
        t = t.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-2">$1</h1>');
        t = t.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mb-2">$1</h2>');
        t = t.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mb-2">$1</h3>');

        // Bold
        t = t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Inline Code
        t = t.replace(/`([^`]+)`/g, '<code class="bg-slate-100 px-1 py-0.5 rounded text-sm font-mono text-pink-600">$1</code>');

        // Line breaks
        t = t.replace(/\n/g, '<br/>');
        return t;
    };

    return <div>{renderImages(text)}</div>;
};

export default AssessmentQuestions;
