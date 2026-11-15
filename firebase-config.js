// Firebase web config is public client configuration, not a private server secret.
// Create a Firebase project, register a Web app, and replace these placeholders.
// Restrict the API key to Firebase APIs and add your Vercel domain to Authorized domains.
export const firebaseConfig = {
  apiKey: "PASTE_FIREBASE_WEB_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  appId: "YOUR_FIREBASE_APP_ID"
};
