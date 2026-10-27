# 🚀 HUSH AI — Anonymous Chat + AI

> *"No names. No judgment. Just conversations."*

HUSH AI is a modern, responsive anonymous chat web application designed for mobile and desktop browsers. It allows people to meet strangers, connect through shared moods and interests, chat in real time, and use an AI wingman to break the ice.

---

## 🌟 Core Features

1. **100% Real Human Matchmaking**: Connects real people over WebSocket (`ws://localhost:3001`). If no partner is available, shows queue radar instead of fake bots.
2. **🤝 Mutual Reveal Protocol**: 3-message threshold protects privacy; users can selectively share name, social handle, college, or bio with zero asymmetric risk.
3. **🎮 In-Chat Anonymous Mini-Games**:
   - **Would You Rather?**: Dilemma cards with real-time synchronized voting and percentage bars.
   - **Two Truths & A Lie**: Host presents 3 statements; partner guesses the lie with live feedback.
4. **✓ & ✓✓ Live Message Delivery Receipts**: Sent, delivered, and read status indicators.
5. **💡 Conversation Rescue**: Silence detector suggests icebreakers/games after 25s of stalled chat.
6. **✨ AI Wingman (4 Tone Modes)**: 😂 Funny, 💭 Deep, 😊 Friendly, 🧠 Intellectual. AI never acts as a stranger.
7. **🎯 VibeMatch Multi-Interest Tagging**: Select primary mood + up to 3 sub-tags.
8. **🔐 Anonymous Identity Vault**: Mutual reconnect codes (`HUSH-XXXX`) saved locally.
9. **Safety & Moderation**: Report user, block stranger, community guidelines, and session reset.

---

## 🛠️ Tech Stack

- **Frontend**: React 18 (TypeScript), Vite, Tailwind CSS, Lucide React
- **Real-Time Backend**: Node.js WebSocket Server (`ws`, `http`)
- **State & Sync**: Modular services (`chatService`, `aiService`, `gameService`)

---

## 🚀 Quickstart: Run Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Both Vite & WebSocket Server
```bash
npm run dev
```
- Frontend: **`http://localhost:5173`**
- WebSocket Matchmaking Server: **`ws://localhost:3001`** (listening on `0.0.0.0:3001`)

To test 2-person chat, open **`http://localhost:5173`** in two separate browser tabs or windows and click **"Start Matching"**.

### 3. Build for Production
```bash
npm run build
```
This generates an optimized static bundle in the `dist/` folder ready for free hosting anywhere.

---

## 🌐 Free Online Deployment Guide

### Option A: Firebase Hosting (Spark Free Tier)
1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```
2. Log in and initialize:
   ```bash
   firebase login
   firebase init hosting
   ```
   - Choose your Firebase project.
   - Set public directory to: `dist`
   - Configure as single-page app: `Yes`
3. Build and deploy:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```
   *Your app is live with a free SSL certificate on `your-project.web.app`!*

### Option B: Vercel / Netlify / GitHub Pages
- Simply connect your GitHub repository to Vercel or Netlify.
- Build command: `npm run build`
- Output directory: `dist`

---

## ⚡ Connecting Live Firebase (Real Multi-User Chat)

When you're ready to switch from simulation mode to live cross-device messaging:

1. **Go to Firebase Console**: [https://console.firebase.google.com](https://console.firebase.google.com)
2. **Create a Free Project** (e.g. `hush-ai-live`).
3. **Enable Anonymous Authentication**:
   - Navigate to *Build* > *Authentication* > *Sign-in method*.
   - Click on **Anonymous** and toggle it to **Enabled**.
4. **Create Cloud Firestore Database**:
   - Navigate to *Build* > *Firestore Database* > *Create Database*.
   - Start in Test mode or apply the security rules below.
5. **Paste Firestore Security Rules**:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Users
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       
       // Chat rooms
       match /chatRooms/{roomId} {
         allow read, update: if request.auth != null && (
           resource.data.participants.hasAny([request.auth.uid])
         );
         allow create: if request.auth != null;
         
         match /messages/{messageId} {
           allow read: if request.auth != null && 
             get(/databases/$(database)/documents/chatRooms/$(roomId)).data.participants.hasAny([request.auth.uid]);
           allow create: if request.auth != null && 
             request.resource.data.senderId == request.auth.uid;
         }
       }
       
       // Matching queue
       match /waitingQueue/{queueId} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```
6. **Set Credentials in [src/services/firebaseConfig.ts](file:///d:/chatting/src/services/firebaseConfig.ts)**:
   Paste your web app's `firebaseConfig` keys from Project Settings.

---

## 🤖 Connecting Google AI Studio (Free Gemini API)

1. Get a free API key at [Google AI Studio](https://aistudio.google.com/).
2. You can test live dynamic AI icebreakers by passing your API key into `aiService.generateCustomPrompt(topic, apiKey)` or defining `VITE_GEMINI_API_KEY` in a `.env` file.
3. *Note*: Never commit your private API keys to public GitHub repositories!
