# How to Expose Assesy to the Internet

Since Assesy has two parts (Frontend and Backend), you cannot just expose one. You must expose **both** and tell the Frontend where to find the Backend.

## The Challenge
1.  **Backend (Port 3000)**: Handles data, saving assessments, running code.
2.  **Frontend (Port 5173)**: The UI that runs in the user's browser.
3.  **Connection**: The Frontend code needs to send requests to the Backend. If you just share the Frontend link, the code running on the candidate's computer will try to hit `localhost:3000` (which is *their* computer, not yours!) and fail.

---

## Method 1: Cloudflare Tunnel (Recommended)
This method uses Cloudflare's free "Quick Tunnel" (TryCloudflare). No account required for basic usage.

### Step 1: Expose the Backend
1.  Open a new terminal.
2.  Run `cloudflared` to expose port 3000:
    ```bash
    cloudflared tunnel --url http://localhost:3000
    ```
3.  Look for the URL in the output ending in `.trycloudflare.com`.
    *   *Example*: `https://cool-api.trycloudflare.com`
    *   **Copy this URL. This is your PUBLIC BACKEND URL.**

### Step 2: Configure and Start Frontend
1.  Stop your runnning Frontend server (Ctrl+C).
2.  Start it again, but tell it the Public Backend URL:
    *   **Linux/Mac**:
        ```bash
        export VITE_API_URL=https://cool-api.trycloudflare.com
        npm run dev
        ```
    *   **Windows (PowerShell)**:
        ```powershell
        $env:VITE_API_URL="https://cool-api.trycloudflare.com"
        npm run dev
        ```

### Step 3: Expose the Frontend
1.  Open another new terminal.
2.  Run `cloudflared` to expose port 5173:
    ```bash
    cloudflared tunnel --url http://localhost:5173
    ```
3.  Look for the URL in the output.
    *   *Example*: `https://shiny-app.trycloudflare.com`
    *   **Copy this URL. This is your PUBLIC CANDIDATE URL.**

### Step 4: Configure the Dashboard (CRITICAL)
1.  Go to your Admin Dashboard (`http://localhost:5173/admin`).
2.  Navigate to **Settings** (Sidebar).
3.  Paste the **Public Candidate URL** (from Step 3) into the "Public Candidate URL" field.
4.  Paste the **Public Backend URL** (from Step 1) into the "Public Backend URL" field.
5.  Click **Save Configurations**.

*Why?* This ensures that when you click "Copy Link" on a session, it generates a link starting with `https://candidate-app...` instead of `localhost`.

### Step 5: Share
Send the **Frontend URL** (`https://shiny-app.trycloudflare.com`) to the candidate.
*   They will load the page.
*   Their browser will send API requests to `https://cool-api.trycloudflare.com` (your backend).
*   Everything works!

---

## Method 2: Ngrok (Alternative)
Similar process, different tool.

1.  **Expose Backend**:
    ```bash
    ngrok http 3000
    ```
    *   Copy the URL (e.g., `https://abc-123.ngrok-free.app`).

2.  **Configure Frontend**:
    ```bash
    export VITE_API_URL=https://abc-123.ngrok-free.app
    npm run dev
    ```

3.  **Expose Frontend**:
    ```bash
    ngrok http 5173
    ```
    *   Copy this URL.

4.  **Share**: Send the Frontend URL.

---

## Important Notes
*   **Transient URLs**: These free URLs change every time you restart the tunnel.
*   **Persistent URLs**: To get a permanent URL (like `assesy.yourdomain.com`), you need to:
    1.  Buy a domain.
    2.  Create a Cloudflare account.
    3.  Set up a tailored Cloudflare Tunnel (requires `config.yml` setup).
*   **Security**: Anyone with the link can access your local app while the tunnel is running.
