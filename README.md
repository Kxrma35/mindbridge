# MindBridge — Setup Guide

A mental health support app with real-time messaging, help signals, and a recovery tracker.

---

## Step 1 — Create a Firebase project

1. Go to https://console.firebase.google.com and click **Add project**
2. Name it "mindbridge" (or anything you like)
3. Disable Google Analytics if prompted (not needed)

---

## Step 2 — Enable Authentication

1. In your Firebase project, go to **Build → Authentication**
2. Click **Get started**
3. Under **Sign-in method**, enable **Email/Password**
4. Save

---

## Step 3 — Create a Firestore database

1. Go to **Build → Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode** (you'll apply the rules below)
4. Pick a region close to you (e.g. `europe-west1` for Africa)
5. After creation, go to the **Rules** tab and paste the contents of `firestore.rules`
6. Click **Publish**

---

## Step 4 — Get your Firebase config

1. In Firebase, go to **Project settings** (gear icon) → **General**
2. Scroll to **Your apps** → click the `</>` (Web) icon
3. Register the app (name it "mindbridge-web")
4. Copy the `firebaseConfig` object — you'll need these values

---

## Step 5 — Configure environment variables

1. In this project folder, copy `.env.example` to a new file called `.env`
2. Fill in your values from the Firebase config:

```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

---

## Step 6 — Install and run

You need Node.js installed (https://nodejs.org — download the LTS version).

Open a terminal in this folder and run:

```bash
npm install
npm run dev
```

Then open http://localhost:5173 in your browser.

---

## How the app works

### Reach Out tab
- See all contacts you've added
- Tap a contact + tap **Send a signal** to notify them
- Optionally tick feelings chips and write a note — these get sent with the signal

### Inbox tab
- **Received**: All signals sent TO you. Tap any to open a live chat with that person.
- **Sent**: All signals you've sent. Tap to open the chat.
- Red dot = unread

### Chat
- Real-time messaging with the other person
- Both sides see messages appear instantly

### Recovery tab
- Enter what you're tracking and when you stopped
- Live timer counting every second, saved to your account
- Milestone celebrations at 1, 3, 7, 14, 30, 60, 90, 180, 365 days

### Profile tab
- Add contacts by email (they must have a MindBridge account)
- Set the relationship label (e.g. "Mum", "Best friend")
- Remove contacts or sign out

---

## Deploying (optional)

To put this online so others can use it:

```bash
npm run build
```

Then deploy the `dist/` folder to any static host. The easiest free option:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

---

## Need help?

Ask Claude to help you with any step — just share the error message and it can walk you through it.
