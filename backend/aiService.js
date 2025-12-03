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
        const result = await this.pool.query(
            "SELECT * FROM ai_config WHERE is_active = TRUE LIMIT 1"
        );

        if (result.rows.length === 0) {
            // Fallback to env variable for Groq
            return {
                provider: 'groq',
                api_key: process.env.GROQ_API_KEY,
                model: 'llama-3.3-70b-versatile',
                config: { temperature: 0.7, max_tokens: 4000 }
            };
        }

        return result.rows[0];
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
