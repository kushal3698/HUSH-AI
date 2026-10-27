/**
 * HUSH AI — Firebase Integration Configuration (Free Spark Plan)
 *
 * To connect your live Firebase project:
 * 1. Visit https://console.firebase.google.com and create a free project.
 * 2. In Project Settings > General > "Your apps", register a Web App.
 * 3. Copy the firebaseConfig object into this file or provide them as environment variables (VITE_FIREBASE_*).
 * 4. Enable Authentication > Sign-in method > Anonymous (Toggle Enabled).
 * 5. Enable Cloud Firestore in "Test mode" (or apply the production rules below).
 */

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSy_SAMPLE_REPLACE_WITH_YOUR_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "hush-ai-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "hush-ai-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "hush-ai-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:000000000000:web:000000000000"
};

export const isFirebaseConfigured = (): boolean => {
  return (
    Boolean(import.meta.env.VITE_FIREBASE_API_KEY) &&
    !import.meta.env.VITE_FIREBASE_API_KEY.includes("SAMPLE")
  );
};

/**
 * RECOMMENDED FIRESTORE SECURITY RULES (Copy to Firestore > Rules):
 * 
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     // Users collection: only user can read/write their own session document
 *     match /users/{userId} {
 *       allow read, write: if request.auth != null && request.auth.uid == userId;
 *     }
 *     
 *     // Chat rooms: only active participants can read/write
 *     match /chatRooms/{roomId} {
 *       allow read, update: if request.auth != null && (
 *         resource.data.participants.hasAny([request.auth.uid])
 *       );
 *       allow create: if request.auth != null;
 *       
 *       match /messages/{messageId} {
 *         allow read: if request.auth != null && 
 *           get(/databases/$(database)/documents/chatRooms/$(roomId)).data.participants.hasAny([request.auth.uid]);
 *         allow create: if request.auth != null && 
 *           request.resource.data.senderId == request.auth.uid;
 *       }
 *     }
 *     
 *     // Queue collection for random matching
 *     match /waitingQueue/{queueId} {
 *       allow read, write: if request.auth != null;
 *     }
 *   }
 * }
 */
