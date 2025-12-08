import React, { useState, useEffect } from 'react';
import { Save, Bot, Key, CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';

const AIProviderCard = ({ provider, config, onUpdate, onActivate }) => {
    const [apiKey, setApiKey] = useState(config.has_api_key ? '****************' : '');
    const [isEditing, setIsEditing] = useState(false);
    const [localModel, setLocalModel] = useState(config.model || '');

    const handleSave = async () => {
        await onUpdate(provider, { api_key: apiKey === '****************' ? undefined : apiKey, model: localModel });
        setIsEditing(false);
    };

    return (
        <div className={`p-6 bg-white border rounded-2xl shadow-sm transition-all ${config.is_active ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200'}`}>
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold ${provider === 'groq' ? 'bg-orange-100 text-orange-600' :
                            provider === 'openai' ? 'bg-green-100 text-green-600' :
                                provider === 'claude' ? 'bg-purple-100 text-purple-600' :
                                    'bg-blue-100 text-blue-600'
                        }`}>
                        {provider[0].toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 capitalize">{provider}</h3>
                        <p className="text-xs text-slate-500">{config.is_active ? 'Active Provider' : 'Inactive'}</p>
                    </div>
                </div>
                {config.is_active ? (
                    <CheckCircle className="w-6 h-6 text-blue-500" />
                ) : (
                    <button
                        onClick={() => onActivate(provider)}
                        className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                    >
                        Activate
                    </button>
                )}
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">API Key</label>
                    <div className="flex gap-2">
                        <input
                            type="password"
                            value={apiKey}
                            disabled={!isEditing}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm disabled:opacity-75"
                            placeholder="Enter API Key"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Model</label>
                    <input
                        type="text"
                        value={localModel}
                        disabled={!isEditing}
                        onChange={(e) => setLocalModel(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm disabled:opacity-75"
                        placeholder="e.g. gpt-4"
                    />
                </div>
            </div>

            <div className="mt-6 flex justify-end">
                {isEditing ? (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg"
                        >
                            Save Changes
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg bg-white"
                    >
                        Edit Configuration
                    </button>
                )}
            </div>
        </div>
    );
};

const SettingsPage = () => {
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProviders();
    }, []);

    const fetchProviders = async () => {
        try {
            const response = await api.get('/admin/ai-providers');
            setProviders(response.data);
        } catch (error) {
            console.error('Failed to fetch providers', error);
        } finally {
            setLoading(false);
        }
    };

    const updateProvider = async (provider, data) => {
        try {
            await api.put(`/admin/ai-providers/${provider}`, data);
            fetchProviders();
        } catch (error) {
            console.error('Update failed', error);
        }
    };

    const activateProvider = async (provider) => {
        try {
            await api.put(`/admin/ai-providers/${provider}/activate`);
            fetchProviders();
        } catch (error) {
            console.error('Activation failed', error);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading settings...</div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
                <p className="text-slate-500 text-sm mt-1">Configure Global AI Providers</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {providers.map((p) => (
                    <AIProviderCard
                        key={p.provider}
                        provider={p.provider}
                        config={p}
                        onUpdate={updateProvider}
                        onActivate={activateProvider}
                    />
                ))}
            </div>
        </div>
    );
};

export default SettingsPage;
