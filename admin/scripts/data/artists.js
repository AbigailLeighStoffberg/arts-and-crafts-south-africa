// data/artists.js
import { app } from "../firebase/config.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const db = getFirestore(app);
const artistsCol = collection(db, "artists");

export async function getArtists() {
  const snapshot = await getDocs(artistsCol);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getArtistById(id) {
  const docRef = doc(db, "artists", id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) throw new Error("Artist not found");
  return { id: docSnap.id, ...docSnap.data() };
}

export async function addArtist(data) {
  const docRef = await addDoc(artistsCol, data);
  return docRef.id;
}

export async function updateArtist(id, data) {
  const docRef = doc(db, "artists", id);
  await updateDoc(docRef, data);
}

export async function deleteArtist(id) {
  const docRef = doc(db, "artists", id);
  await deleteDoc(docRef);
}
