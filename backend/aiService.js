// Multi-Provider AI Service
// Supports: Groq, OpenAI, Claude (Anthropic), Gemini (Google)

const Groq = require("groq-sdk");

class AIService {
    constructor(pool) {
        this.pool = pool;
        this.activeProvider = null;
        this.providerClients = {
            groq: null,
            openai: null,
            claude: null,
            gemini: null
        };
    }

    async getActiveProvider() {
        // Fetch keys from admin_settings
        const res = await this.pool.query(`
            SELECT * FROM admin_settings 
            WHERE key IN ('groq_api_key', 'openai_api_key', 'gemini_api_key', 'claude_api_key', 'llm_provider', 'llm_model')
        `);
        const settings = {};
        res.rows.forEach(r => settings[r.key] = r.value);

        // Determine active provider (default to groq)
        const provider = settings.llm_provider || 'groq';
        let api_key = null;
        let model = settings.llm_model; // Use custom model from settings

        // Default models if not set in settings
        const defaultModels = {
            groq: 'llama-3.3-70b-versatile',
            openai: 'gpt-4-turbo',
            gemini: 'gemini-1.5-pro',
            claude: 'claude-3-5-sonnet-20241022'
        };

        if (provider === 'groq') {
            api_key = settings.groq_api_key || process.env.GROQ_API_KEY;
            model = model || defaultModels.groq;
        } else if (provider === 'openai') {
            api_key = settings.openai_api_key || process.env.OPENAI_API_KEY;
            model = model || defaultModels.openai;
        } else if (provider === 'gemini') {
            api_key = settings.gemini_api_key || process.env.GEMINI_API_KEY;
            model = model || defaultModels.gemini;
        } else if (provider === 'claude') {
            api_key = settings.claude_api_key || process.env.CLAUDE_API_KEY;
            model = model || defaultModels.claude;
        }

        return {
            provider,
            api_key,
            model,
            config: { temperature: 0.7, max_tokens: 4000 }
        };
    }

    async initializeClient(providerConfig) {
        const { provider, api_key, model, config } = providerConfig;

        if (!api_key) {
            throw new Error(`No API key configured for ${provider}`);
        }

        switch (provider) {
            case 'groq':
                if (!this.providerClients.groq) {
                    this.providerClients.groq = new Groq({ apiKey: api_key });
                }
                return this.providerClients.groq;

            case 'openai':
                // Lazy load OpenAI SDK
                if (!this.providerClients.openai) {
                    const OpenAI = require('openai');
                    this.providerClients.openai = new OpenAI({ apiKey: api_key });
                }
                return this.providerClients.openai;

            case 'claude':
                // Lazy load Anthropic SDK
                if (!this.providerClients.claude) {
                    const Anthropic = require('@anthropic-ai/sdk');
                    this.providerClients.claude = new Anthropic({ apiKey: api_key });
                }
                return this.providerClients.claude;

            case 'gemini':
                // Lazy load Google Generative AI SDK
                if (!this.providerClients.gemini) {
                    const { GoogleGenerativeAI } = require('@google/generative-ai');
                    this.providerClients.gemini = new GoogleGenerativeAI(api_key);
                }
                return this.providerClients.gemini;

            default:
                throw new Error(`Unsupported provider: ${provider}`);
        }
    }

    async generateCompletion(prompt, options = {}) {
        const providerConfig = await this.getActiveProvider();
        const client = await this.initializeClient(providerConfig);
        const { provider, model, config } = providerConfig;

        console.log(`Using ${provider} (${model}) for AI generation`);

        try {
            switch (provider) {
                case 'groq':
                    return await this.groqCompletion(client, model, prompt, config);
                case 'openai':
                    return await this.openaiCompletion(client, model, prompt, config);
                case 'claude':
                    return await this.claudeCompletion(client, model, prompt, config);
                case 'gemini':
                    return await this.geminiCompletion(client, model, prompt, config);
                default:
                    throw new Error(`Unsupported provider: ${provider}`);
            }
        } catch (error) {
            console.error(`${provider} API error:`, error.message);
            throw error;
        }
    }

    async groqCompletion(client, model, prompt, config) {
        const completion = await client.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: model,
            temperature: config.temperature || 0.7,
            response_format: { type: "json_object" },
        });
        return JSON.parse(completion.choices[0].message.content);
    }

    async openaiCompletion(client, model, prompt, config) {
        const completion = await client.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: model,
            temperature: config.temperature || 0.7,
            response_format: { type: "json_object" },
        });
        return JSON.parse(completion.choices[0].message.content);
    }

    async claudeCompletion(client, model, prompt, config) {
        const message = await client.messages.create({
            model: model,
            max_tokens: config.max_tokens || 4000,
            temperature: config.temperature || 0.7,
            messages: [{
                role: "user",
                content: `${prompt}\n\nIMPORTANT: Respond ONLY with valid JSON, no markdown formatting.`
            }]
        });

        // Claude returns text, we need to parse JSON
        const text = message.content[0].text;
        // Strip markdown code blocks if present
        const jsonText = text.replace(/```json\n?|\n?```/g, '').trim();
        return JSON.parse(jsonText);
    }

    async geminiCompletion(client, model, prompt, config) {
        const geminiModel = client.getGenerativeModel({ model: model });
        const result = await geminiModel.generateContent({
            contents: [{
                parts: [{
                    text: `${prompt}\n\nIMPORTANT: Respond ONLY with valid JSON, no markdown formatting.`
                }]
            }],
            generationConfig: {
                temperature: config.temperature || 0.7,
                maxOutputTokens: config.max_tokens || 4000,
            }
        });

        const text = result.response.text();
        // Strip markdown if present
        const jsonText = text.replace(/```json\n?|\n?```/g, '').trim();
        return JSON.parse(jsonText);
    }
}

module.exports = AIService;
