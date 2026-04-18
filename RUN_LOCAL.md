# How to Run AdaptiGrowth Locally

Follow these steps to start the application and test the OpenAI integration.

## Prerequisites

- **Node.js** (v18 or higher recommended)
- **Firebase CLI** (`npm install -g firebase-tools`)
- **Git**

## 1. Setup & Install

Open your terminal in the project root:

```bash
npm install
cd web
npm install
cd ../functions
npm install
cd ..
```

## 2. Start the App

To run the frontend (connected to the **Live Deployed Backend**):

```bash
npm run dev
```

- Open [http://localhost:5173](http://localhost:5173) in your browser.
- Login with your account.

## 3. Test OpenAI Connection

1. In the app, go to **Settings** (Sidebar) or navigate to `/app/diagnostics` directly.
2. Click **Test Connection**.
3. You should see a **Test Passed ✅** message with latency stats.

## Diagnostics & Troubleshooting

- **"Tutor Service is not configured"**: This means the API Key is missing on the server.
  - **Fix**: The backend secret `OPENAI_API_KEY` has been set during setup. If it fails, redeploy using: `firebase deploy --only functions`.
- **"Permission Denied"**: Sign out and sign back in to refresh your token.

## Backend Development (Optional)

This setup runs the frontend locally but talks to the **deployed** Cloud Functions on Firebase (Google Cloud).

- **Pros**: Easy setup, no Java required, uses real data/secrets.
- **Cons**: Backend changes require `firebase deploy --only functions` to take effect.
