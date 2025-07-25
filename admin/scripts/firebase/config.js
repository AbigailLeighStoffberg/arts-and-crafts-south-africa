// scripts/firebase/config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyDDDYmHs-EVYN6UN81bAboxL83VXqkn8-w",
  authDomain: "arts-and-crafts-sa.firebaseapp.com",
  projectId: "arts-and-crafts-sa",
  storageBucket: "arts-and-crafts-sa.appspot.com",
  messagingSenderId: "858459639939",
  appId: "1:858459639939:web:a9f8820283f0b71de60bb6",
  measurementId: "G-JCJEJ30Q80"
};

export const app = initializeApp(firebaseConfig);
