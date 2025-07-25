// scripts/firebase/firestore.js
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { app } from "./config.js";

const db = getFirestore(app);

export const artistsCollection = collection(db, "artists");
export const productsCollection = collection(db, "products");

export async function addArtist(artistData) {
  return await addDoc(artistsCollection, artistData);
}

export async function getArtists() {
  const snapshot = await getDocs(artistsCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function addProduct(productData) {
  return await addDoc(productsCollection, productData);
}

export async function getProducts() {
  const snapshot = await getDocs(productsCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Add updateDoc and deleteDoc functions as needed
