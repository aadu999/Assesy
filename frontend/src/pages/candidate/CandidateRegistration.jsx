import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, ArrowRight, Loader2, BookOpen } from 'lucide-react';
import api from '../../services/api';

const CandidateRegistration = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        qualification: '',
        course: '',
        college: '',
        year: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post(`/session/${token}/register`, {
                name: formData.name,
                email: formData.email,
                details: {
                    qualification: formData.qualification,
                    course: formData.course,
                    college: formData.college,
                    year: formData.year
                }
            });
            // Proceed to questions
            navigate(`/assessment/${token}/questions`);
        } catch (err) {
            console.error(err);
            alert("Registration failed: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-slate-100">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-slate-900">
                        Candidate Registration
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">
                        Please provide your details to begin the assessment.
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-700">Full Name</label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email Address</label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="john@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-slate-300"></div>
                            <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase font-semibold flex items-center gap-1">
                                <BookOpen className="w-3 h-3" /> Education
                            </span>
                            <div className="flex-grow border-t border-slate-300"></div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Qualification</label>
                                <select
                                    name="qualification"
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    value={formData.qualification}
                                    onChange={handleChange}
                                >
                                    <option value="">Select...</option>
                                    <option value="B.Tech">B.Tech</option>
                                    <option value="M.Tech">M.Tech</option>
                                    <option value="BCA">BCA</option>
                                    <option value="MCA">MCA</option>
                                    <option value="B.Sc">B.Sc</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Year</label>
                                <input
                                    name="year"
                                    type="number"
                                    required
                                    placeholder="2024"
                                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    value={formData.year}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-700">Course / Stream</label>
                                <input
                                    name="course"
                                    type="text"
                                    required
                                    placeholder="Computer Science"
                                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    value={formData.course}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-700">College / University</label>
                                <input
                                    name="college"
                                    type="text"
                                    required
                                    placeholder="University Name"
                                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    value={formData.college}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-slate-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-colors disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <span className="flex items-center gap-2">
                                    Start Assessment <ArrowRight className="w-4 h-4" />
                                </span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CandidateRegistration;
