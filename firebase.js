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

const PARTICIPANT_ID_KEY = "bbdc_p2_participantId";
const LEGACY_PARTICIPANT_ID_KEY = "participantId";
const PARTICIPANT_COLLECTION = "participants_p2";
const SESSION_COLLECTION = "sessions_p2";

function makeParticipantId() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "p";
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

function safeGetLocalStorage(key) {
  try { return localStorage.getItem(key); } catch (_) { return null; }
}

function safeSetLocalStorage(key, value) {
  try { localStorage.setItem(key, value); } catch (_) { /* ignore */ }
}

async function ensureSignedIn() {
  if (!auth.currentUser) await signInAnonymously(auth);
  return auth.currentUser.uid;
}

// P2 identity: anonymous uid -> participants_p2/{uid}.participantId, mirrored to P2 localStorage.
// The session participantId is treated as the source of truth when an upload has already been created by logger.js.
async function ensureIdentity(preferredParticipantId = null) {
  const uid = await ensureSignedIn();
  const refUser = doc(db, PARTICIPANT_COLLECTION, uid);
  const storedParticipantId = safeGetLocalStorage(PARTICIPANT_ID_KEY) || safeGetLocalStorage(LEGACY_PARTICIPANT_ID_KEY);
  let participantId = preferredParticipantId || storedParticipantId || makeParticipantId();

  try {
    const snap = await getDoc(refUser);
    if (!preferredParticipantId && snap.exists() && snap.data().participantId) {
      participantId = snap.data().participantId;
    }
  } catch (err) {
    console.warn("Participant lookup unavailable; continuing with local participantId", err);
  }

  safeSetLocalStorage(PARTICIPANT_ID_KEY, participantId);

  try {
    await setDoc(refUser, {
      participantId,
      prototype: "p2",
      participantStorageKey: PARTICIPANT_ID_KEY,
      lastSeenAt: serverTimestamp(),
      createdAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.warn("Participant document write unavailable; session upload can still continue", err);
  }

  return { uid, participantId, participantCollection: PARTICIPANT_COLLECTION };
}

// Upload: raw session JSON -> Storage, plus a metadata doc -> Firestore.
async function uploadSessionToFirebase(session) {
  const sid = session && session.sessionId;
  if (!sid) throw new Error("Missing sessionId");

  const identity = await ensureIdentity(session.participantId || null);
  if (!session.participantId) session.participantId = identity.participantId;

  session.uploadAttemptedAtIso ||= new Date().toISOString();
  session.uploadMethod ||= "firebase_storage_firestore";
  session.uploadStatus ||= "attempting";
  session.firebaseUid = identity.uid;
  session.participantCollection = PARTICIPANT_COLLECTION;

  const blob = new Blob([JSON.stringify(session)], { type: "application/json;charset=utf-8" });
  const storagePath = `sessions_p2/${sid}/session.json`;

  await uploadBytes(ref(storage, storagePath), blob);

  await addDoc(collection(db, SESSION_COLLECTION), {
    sessionId: sid,
    uid: identity.uid,
    participantId: session.participantId ?? null,
    participantCollection: PARTICIPANT_COLLECTION,
    participantDocPath: `${PARTICIPANT_COLLECTION}/${identity.uid}`,
    sessionIndex: session.sessionIndex ?? null,
    schemaVersion: session.schemaVersion ?? null,
    appVersion: session.appVersion ?? null,
    appMode: session.appMode ?? null,
    consentVersion: session.context?.consentVersion ?? session.config?.consentVersion ?? null,
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

  session.uploadCompletedAtIso = new Date().toISOString();
  session.uploadStatus = "success";
  session.firebaseStoragePath = storagePath;

  return { uid: identity.uid, participantId: session.participantId, sessionId: sid, storagePath };
}

window.bbdcFirebase = { ensureIdentity, uploadSessionToFirebase };
