# 🌐 How to Deploy HUSH AI Live for Free (Vercel + Render)

Because **Vercel** is a serverless platform, it hosts your React frontend on a fast global CDN, but does not run persistent Node.js background processes (`server.js`). 

To connect real people around the world from any phone or computer, follow this **3-minute free setup**:

---

## 🏗️ Architecture
- **Frontend (UI & Chat Client)**: Hosted on **Vercel** (`https://your-app.vercel.app`)
- **Backend (Real-Time WebSocket Server)**: Hosted on **Render.com** (Free Web Service) (`wss://your-backend.onrender.com`)

---

## Step 1: Deploy Backend to Render (100% Free)

1. Go to [render.com](https://render.com) and sign up / log in with your GitHub account.
2. Click **New +** ➔ **Web Service**.
3. Connect your HUSH AI GitHub repository.
4. Fill in these settings:
   - **Name**: `hush-ai-backend` (or any name you choose)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`
5. Click **Create Web Service**.
6. Once deployed, Render will give you a public URL like:
   `https://hush-ai-backend.onrender.com`
7. Your secure WebSocket URL is simply changing `https://` to `wss://`:
   `wss://hush-ai-backend.onrender.com`

---

## Step 2: Connect Frontend on Vercel

1. Open your Vercel Dashboard and go to your **HUSH AI project**.
2. Click **Settings** ➔ **Environment Variables**.
3. Add a new variable:
   - **Key**: `VITE_WS_URL`
   - **Value**: `wss://your-backend-name.onrender.com` *(replace with your Render URL from Step 1)*
4. Click **Save**.
5. Go to **Deployments** ➔ click the `...` menu on your latest deployment ➔ click **Redeploy**.

---

## 🎉 That's It!
- When anyone visits `https://your-app.vercel.app` on their phone, laptop, or tablet, the app will automatically connect over secure WebSockets (`wss://`) to your Render server.
- Real users across different cities, networks, and Wi-Fis will now match instantly!
