// firebase.js  —  Prototype 2 (load as <script type="module">)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, collection, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyARJOjG8qenV7E5EzhNFYeTJdLoZrxM_E4",
  authDomain: "behavioural-biometrics-b52e4.firebaseapp.com",
  projectId: "behavioural-biometrics-b52e4",
  storageBucket: "behavioural-biometrics-b52e4.firebasestorage.app",
  messagingSenderId: "335083928247",
  appId: "1:335083928247:web:c872ba3278a7b49f892b32",
  measurementId: "G-N310K3ZT4M"
};

const fbApp = initializeApp(firebaseConfig);
const auth = getAuth(fbApp);
const db = getFirestore(fbApp);
const storage = getStorage(fbApp);

function makeParticipantId() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "p";
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

// P1-style identity: anonymous uid -> participants/{uid}.participantId, mirrored to localStorage.
async function ensureIdentity() {
  await signInAnonymously(auth);
  const uid = auth.currentUser.uid;
  const refUser = doc(db, "participants", uid);
  const snap = await getDoc(refUser);

  let participantId;
  if (snap.exists() && snap.data().participantId) {
    participantId = snap.data().participantId;
  } else {
    participantId = localStorage.getItem("participantId") || makeParticipantId();
    await setDoc(refUser, { participantId, createdAt: serverTimestamp() }, { merge: true });
  }
  localStorage.setItem("participantId", participantId);
  return { uid, participantId };
}

// P1-style upload: raw session JSON -> Storage, plus a metadata doc -> Firestore (separate sessions_p2 namespace).
async function uploadSessionToFirebase(session) {
  if (!auth.currentUser) await signInAnonymously(auth);
  const sid = session && session.sessionId;
  if (!sid) throw new Error("Missing sessionId");

  const blob = new Blob([JSON.stringify(session)], { type: "application/json;charset=utf-8" });
  const storagePath = `sessions_p2/${sid}/session.json`;

  await uploadBytes(ref(storage, storagePath), blob);

  await addDoc(collection(db, "sessions_p2"), {
    sessionId: sid,
    uid: auth.currentUser.uid,
    participantId: session.participantId ?? null,
    sessionIndex: session.sessionIndex ?? null,
    schemaVersion: session.schemaVersion ?? null,
    appVersion: session.appVersion ?? null,
    appMode: session.appMode ?? null,
    createdAt: serverTimestamp(),
    sessionDurationMs: session.sessionDurationMs ?? null,
    completedNormally: session.completedNormally ?? null,
    eventCount: Array.isArray(session.events) ? session.events.length : null,
    taskCount: Array.isArray(session.taskSummary) ? session.taskSummary.length : null,
    usableForSignalExtraction: session.qualitySummary?.usableForSignalExtraction ?? null,
    deviceFamily: session.device?.deviceFamily ?? null,
    devicePlatform: session.context?.devicePlatform ?? null,
    deviceModel: session.context?.deviceModel ?? null,
    storagePath
  });

  return { uid: auth.currentUser.uid, sessionId: sid, storagePath };
}

window.bbdcFirebase = { ensureIdentity, uploadSessionToFirebase };