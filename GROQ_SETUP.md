# Setting Up Groq API Key

## Quick Setup

1. **Get API Key from Groq:**
   - Visit https://console.groq.com/keys
   - Create a new API key
   - Copy the key

2. **Set Environment Variable:**

   **Option A: Using .env file (Recommended)**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env and set: GROQ_API_KEY=your_actual_key_here
   ```

   **Option B: Set in docker-compose.yml**
   ```yaml
   backend:
     environment:
       - GROQ_API_KEY=your_actual_key_here
   ```

   **Option C: Export in shell**
   ```bash
   export GROQ_API_KEY="your_actual_key_here"
   docker-compose up --build
   ```

3. **Restart Backend:**
   ```bash
   docker-compose restart backend-service
   ```

## Verify Setup

Check backend logs:
```bash
docker logs backend-service --tail 20
```

You should NOT see "Invalid API Key" errors when generating assessments.

## Troubleshooting

- **401 Invalid API Key**: Key not set or wrong
- **Rate Limit**: Free tier has limits, wait or upgrade
- **Model Error**: Check if llama-3.3-70b-versatile is available in your region
