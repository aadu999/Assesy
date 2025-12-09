import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Loader2, Save, Info } from 'lucide-react';

const Settings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        llm_provider: 'groq',
        llm_model: '',
        groq_api_key: '',
        openai_api_key: '',
        gemini_api_key: '',
        claude_api_key: ''
    });

    // Model options for each provider
    const modelOptions = {
        groq: [
            { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile (Recommended)' },
            { value: 'llama-3.1-70b-versatile', label: 'Llama 3.1 70B Versatile' },
            { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant (Faster)' },
            { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' }
        ],
        openai: [
            { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (Recommended)' },
            { value: 'gpt-4o', label: 'GPT-4o' },
            { value: 'gpt-4', label: 'GPT-4' },
            { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Faster, Cheaper)' }
        ],
        gemini: [
            { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Recommended)' },
            { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Faster)' },
            { value: 'gemini-pro', label: 'Gemini Pro' }
        ],
        claude: [
            { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (Recommended)' },
            { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus (Most Capable)' },
            { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
            { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku (Fastest)' }
        ]
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/admin/settings');
            setSettings(s => ({ ...s, ...res.data }));
        } catch (e) {
            console.error("Failed to fetch settings", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Save all LLM settings
            await api.post('/admin/settings', { key: 'llm_provider', value: settings.llm_provider });
            await api.post('/admin/settings', { key: 'llm_model', value: settings.llm_model });
            await api.post('/admin/settings', { key: 'groq_api_key', value: settings.groq_api_key });
            await api.post('/admin/settings', { key: 'openai_api_key', value: settings.openai_api_key });
            await api.post('/admin/settings', { key: 'gemini_api_key', value: settings.gemini_api_key });
            await api.post('/admin/settings', { key: 'claude_api_key', value: settings.claude_api_key });
            alert("Settings saved successfully!");
        } catch (e) {
            alert("Failed to save settings.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;

    const currentProvider = settings.llm_provider || 'groq';
    const availableModels = modelOptions[currentProvider] || modelOptions.groq;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">LLM Configuration</h1>
                    <p className="text-slate-500 text-sm mt-1">Configure AI providers for assessment generation and grading</p>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">Tunnel Configuration Moved</p>
                    <p className="text-blue-700">
                        Cloudflare tunnel settings are now managed via <code className="bg-blue-100 px-1.5 py-0.5 rounded">.env.tunnel</code> file and <code className="bg-blue-100 px-1.5 py-0.5 rounded">start.sh</code> script.
                        See README for details.
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <form onSubmit={handleSave} className="space-y-6">
                    {/* Provider Selection */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Active Provider</label>
                        <select
                            className="w-full px-4 py-2 border rounded-xl"
                            value={currentProvider}
                            onChange={e => setSettings({ ...settings, llm_provider: e.target.value, llm_model: '' })}
                        >
                            <option value="groq">Groq (Fast, Free Tier Available)</option>
                            <option value="openai">OpenAI (GPT Models)</option>
                            <option value="gemini">Google Gemini</option>
                            <option value="claude">Anthropic Claude</option>
                        </select>
                    </div>

                    {/* Model Selection */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Model</label>
                        <select
                            className="w-full px-4 py-2 border rounded-xl"
                            value={settings.llm_model || ''}
                            onChange={e => setSettings({ ...settings, llm_model: e.target.value })}
                        >
                            <option value="">Select a model...</option>
                            {availableModels.map(model => (
                                <option key={model.value} value={model.value}>
                                    {model.label}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500 mt-1">
                            Choose the model to use for generating assessments and grading submissions
                        </p>
                    </div>

                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold mb-4">API Keys</h3>
                        <p className="text-sm text-slate-500 mb-4">
                            Configure API keys for each provider. Only the selected provider's key is required.
                        </p>

                        <div className="space-y-4">
                            {/* Groq API Key */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Groq API Key
                                    {currentProvider === 'groq' && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                <input
                                    type="password"
                                    className={`w-full px-4 py-2 border rounded-xl ${currentProvider === 'groq' ? 'border-blue-300' : ''}`}
                                    placeholder="gsk_..."
                                    value={settings.groq_api_key || ''}
                                    onChange={e => setSettings({ ...settings, groq_api_key: e.target.value })}
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Get your key at <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">console.groq.com</a>
                                </p>
                            </div>

                            {/* OpenAI API Key */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    OpenAI API Key
                                    {currentProvider === 'openai' && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                <input
                                    type="password"
                                    className={`w-full px-4 py-2 border rounded-xl ${currentProvider === 'openai' ? 'border-blue-300' : ''}`}
                                    placeholder="sk-..."
                                    value={settings.openai_api_key || ''}
                                    onChange={e => setSettings({ ...settings, openai_api_key: e.target.value })}
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Get your key at <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">platform.openai.com</a>
                                </p>
                            </div>

                            {/* Gemini API Key */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Google Gemini API Key
                                    {currentProvider === 'gemini' && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                <input
                                    type="password"
                                    className={`w-full px-4 py-2 border rounded-xl ${currentProvider === 'gemini' ? 'border-blue-300' : ''}`}
                                    placeholder="AI..."
                                    value={settings.gemini_api_key || ''}
                                    onChange={e => setSettings({ ...settings, gemini_api_key: e.target.value })}
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Get your key at <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a>
                                </p>
                            </div>

                            {/* Claude API Key */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Anthropic Claude API Key
                                    {currentProvider === 'claude' && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                <input
                                    type="password"
                                    className={`w-full px-4 py-2 border rounded-xl ${currentProvider === 'claude' ? 'border-blue-300' : ''}`}
                                    placeholder="sk-ant-..."
                                    value={settings.claude_api_key || ''}
                                    onChange={e => setSettings({ ...settings, claude_api_key: e.target.value })}
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Get your key at <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">console.anthropic.com</a>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Configuration
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Settings;
