import { db, storage } from './firebase.js';
import {
  collection, addDoc, getDocs, getDoc,
  query, orderBy, doc, deleteDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  ref, uploadBytes, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

let editingProductId = null;
let editingProductImageUrl = null;

export function setupProductForm() {
  const addProductBtn = document.getElementById("add-product-btn");
  const cancelEditBtn = document.getElementById("cancel-edit-product-btn");
  addProductBtn?.addEventListener("click", handleProductSubmit);
  cancelEditBtn?.addEventListener("click", clearProductForm);
}

export function clearProductForm() {
  const fields = [
    "product-name", "product-description", "product-category",
    "product-price-usd", "product-price-zar", "product-sku", "product-stock",
    "product-subcategory"
  ];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  document.getElementById("product-artist-id").selectedIndex = 0;
  document.getElementById("product-main-image").value = "";
  document.getElementById("product-thumbnail-image").value = "";
  document.getElementById("product-additional-images").value = "";
  document.getElementById("current-product-main-image").innerHTML = "";
  document.getElementById("current-product-additional-images").innerHTML = "";
  document.getElementById("current-product-thumbnail-image").innerHTML = "";

  document.getElementById("add-product-btn").textContent = "Add Product";
  document.getElementById("add-product-btn").classList.remove("update-mode");
  document.getElementById("cancel-edit-product-btn").style.display = "none";
  document.getElementById("product-form-title").textContent = "Add Product";

  editingProductId = null;
  editingProductImageUrl = null;

  document.getElementById("product-submit-success").textContent = "";
  document.getElementById("product-submit-error").textContent = "";
}

async function handleProductSubmit() {
  const name = document.getElementById("product-name").value.trim();
  const description = document.getElementById("product-description").value.trim();
  const priceUsd = parseFloat(document.getElementById("product-price-usd").value.trim());
  const priceZar = parseFloat(document.getElementById("product-price-zar").value.trim());
  const quantity = parseInt(document.getElementById("product-stock").value.trim(), 10);
  const artistId = document.getElementById("product-artist-id").value;
  const category = document.getElementById("product-category").value.trim();
  const subcategory = document.getElementById("product-subcategory")?.value.trim() || "";
  const imageFile = document.getElementById("product-main-image").files[0];
  const thumbnailFile = document.getElementById("product-thumbnail-image").files[0];
  const additionalFiles = document.getElementById("product-additional-images").files;

  const success = document.getElementById("product-submit-success");
  const error = document.getElementById("product-submit-error");

  success.textContent = "";
  error.textContent = "";

  if (!name || !artistId || isNaN(priceUsd)) {
    error.textContent = "Name, price (USD), and artist are required.";
    return;
  }

  const addBtn = document.getElementById("add-product-btn");
  addBtn.disabled = true;

  try {
    let imageUrl = editingProductImageUrl;
    let thumbnailUrl = "";
    let additionalImageUrls = [];

    const safeName = name.replace(/\s+/g, "_").toLowerCase();

    if (imageFile) {
      if (editingProductImageUrl) {
        try {
          const url = new URL(editingProductImageUrl);
          const path = decodeURIComponent(url.pathname.split('/o/')[1]).split('?')[0];
          await deleteObject(ref(storage, path));
        } catch (e) {
          console.warn("Could not delete old product image", e);
        }
      }
      const imageRef = ref(storage, `products/${safeName}_${Date.now()}_${imageFile.name}`);
      await uploadBytes(imageRef, imageFile);
      imageUrl = await getDownloadURL(imageRef);
    }

    if (thumbnailFile) {
      const thumbRef = ref(storage, `products/thumbnail/${safeName}_${Date.now()}_${thumbnailFile.name}`);
      await uploadBytes(thumbRef, thumbnailFile);
      thumbnailUrl = await getDownloadURL(thumbRef);
    }

    for (let file of additionalFiles) {
      const addRef = ref(storage, `products/additional/${safeName}_${Date.now()}_${file.name}`);
      await uploadBytes(addRef, file);
      const url = await getDownloadURL(addRef);
      additionalImageUrls.push(url);
    }

    const productData = {
      name,
      description,
      priceUsd,
      priceZar,
      quantity,
      artistId,
      category,
      subcategory,
      imageUrl,
      thumbnailUrl,
      additionalImageUrls,
      updatedAt: new Date(),
    };

    if (editingProductId) {
      const docRef = doc(db, "products", editingProductId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        error.textContent = "Product no longer exists.";
        return;
      }
      await updateDoc(docRef, productData);
      success.textContent = "Product updated!";
    } else {
      productData.createdAt = new Date();
      await addDoc(collection(db, "products"), productData);
      success.textContent = "Product added!";
    }

    clearProductForm();
    await loadProducts();

  } catch (err) {
    console.error("Product submit error", err);
    error.textContent = "Failed to save product.";
  } finally {
    addBtn.disabled = false;
  }
}

export async function loadProducts() {
  const list = document.getElementById("products-list");
  if (!list) return;

  list.innerHTML = "Loading...";
  try {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      list.innerHTML = "<p>No products found.</p>";
      return;
    }

    let html = "<ul style='list-style:none;padding:0'>";
    snapshot.forEach(docSnap => {
      const product = docSnap.data();
      const id = docSnap.id;

      html += `<li style="margin-bottom:20px;">
        <strong>${product.name}</strong><br/>
        Price: $${typeof product.priceUsd === 'number' ? product.priceUsd.toFixed(2) : "N/A"}<br/>
        Quantity: ${product.quantity}<br/>
        Category: ${product.category || "N/A"}<br/>
        ${product.imageUrl ? `<div><strong>Main:</strong><br/><img src="${product.imageUrl}" width="80"/></div>` : ""}
        ${product.thumbnailUrl ? `<div><strong>Thumbnail:</strong><br/><img src="${product.thumbnailUrl}" width="60"/></div>` : ""}
        ${Array.isArray(product.additionalImageUrls) && product.additionalImageUrls.length > 0 ? `
          <div><strong>Additional Images:</strong><br/>
            ${product.additionalImageUrls.map(url => `<img src="${url}" width="60" style="margin:4px;">`).join("")}
          </div>` : ""}
        <div>
          <button class="edit-product-btn" data-id="${id}">Edit</button>
          <button class="delete-product-btn" data-id="${id}">Delete</button>
        </div>
      </li>`;
    });
    html += "</ul>";
    list.innerHTML = html;

    document.querySelectorAll(".edit-product-btn").forEach(btn => {
      btn.addEventListener("click", () => editProduct(btn.dataset.id));
    });

    document.querySelectorAll(".delete-product-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        if (confirm("Delete this product?")) deleteProduct(btn.dataset.id);
      });
    });

  } catch (err) {
    console.error("Load products failed", err);
    list.innerHTML = "<p>Failed to load products.</p>";
  }
}

async function editProduct(id) {
  const docRef = doc(db, "products", id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return;

  const data = docSnap.data();
  editingProductId = id;
  editingProductImageUrl = data.imageUrl;

  document.getElementById("product-name").value = data.name || "";
  document.getElementById("product-description").value = data.description || "";
  document.getElementById("product-price-usd").value = data.priceUsd || "";
  document.getElementById("product-price-zar").value = data.priceZar || "";
  document.getElementById("product-stock").value = data.quantity || "";
  document.getElementById("product-artist-id").value = data.artistId || "";
  document.getElementById("product-category").value = data.category || "";
  document.getElementById("product-subcategory").value = data.subcategory || "";

  document.getElementById("product-form-title").textContent = "Edit Product";
  document.getElementById("add-product-btn").textContent = "Update Product";
  document.getElementById("add-product-btn").classList.add("update-mode");
  document.getElementById("cancel-edit-product-btn").style.display = "inline-block";

  document.getElementById("current-product-main-image").innerHTML = data.imageUrl
    ? `<img src="${data.imageUrl}" width="80" style="margin-top: 8px; border: 1px solid #ccc;">`
    : "<p>No main image.</p>";

  document.getElementById("current-product-thumbnail-image").innerHTML = data.thumbnailUrl
    ? `<img src="${data.thumbnailUrl}" width="60" style="margin-top: 8px; border: 1px solid #ccc;">`
    : "<p>No thumbnail image.</p>";

  const addImagesDiv = document.getElementById("current-product-additional-images");
  addImagesDiv.innerHTML = Array.isArray(data.additionalImageUrls) && data.additionalImageUrls.length > 0
    ? `<p><strong>Current Additional Images:</strong></p>
       <div>${data.additionalImageUrls.map(url => `<img src="${url}" width="60" style="margin:4px;">`).join("")}</div>`
    : "<p>No additional images.</p>";

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteProduct(id) {
  try {
    await deleteDoc(doc(db, "products", id));
    await loadProducts();
  } catch (err) {
    console.error("Delete product failed", err);
  }
}
