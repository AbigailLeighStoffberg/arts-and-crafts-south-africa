import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDDDYmHs-EVYN6UN81bAboxL83VXqkn8-w",
  authDomain: "arts-and-crafts-sa.firebaseapp.com",
  projectId: "arts-and-crafts-sa",
  storageBucket: "arts-and-crafts-sa.firebasestorage.app",
  messagingSenderId: "858459639939",
  appId: "1:858459639939:web:a9f8820283f0b71de60bb6",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app, "gs://arts-and-crafts-sa.firebasestorage.app");
