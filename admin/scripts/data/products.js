// scripts/data/products.js
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { app } from "../firebase/config.js";

const db = getFirestore(app);
const productsCol = collection(db, "products");

export async function getProducts() {
  const snapshot = await getDocs(productsCol);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getProductById(id) {
  const docRef = doc(db, "products", id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) throw new Error("Product not found");
  return { id: docSnap.id, ...docSnap.data() };
}

export async function addProduct(data) {
  const docRef = await addDoc(productsCol, data);
  return docRef.id;
}

export async function updateProduct(id, data) {
  const docRef = doc(db, "products", id);
  await updateDoc(docRef, data);
}

export async function deleteProduct(id) {
  const docRef = doc(db, "products", id);
  await deleteDoc(docRef);
}
