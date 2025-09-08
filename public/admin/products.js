// products.js

import { db, storage } from './firebase.js';
import {
  collection, addDoc, getDocs, getDoc, query, orderBy, doc, deleteDoc, updateDoc, where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  ref, uploadBytes, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// Global editing state
let editingProductId = null;
let editingProductImages = {}; // { original, thumb200, thumb400 }

const THUMB_SIZES = [200, 400]; // We will generate these sizes in addition to original

// --- FORM SETUP ---
export function setupProductForm() {
  const addProductBtn = document.getElementById("add-product-btn");
  const cancelEditBtn = document.getElementById("cancel-edit-product-btn");
  const artistFilterSelect = document.getElementById("artist-filter");

  addProductBtn?.addEventListener("click", handleProductSubmit);
  cancelEditBtn?.addEventListener("click", clearProductForm);
  artistFilterSelect?.addEventListener("change", async () => {
    const selectedArtistId = artistFilterSelect.value;
    await loadProducts(selectedArtistId);
  });

  populateCategoriesDropdown();
  populateArtistDropdownForProductForm();
  populateArtistFilter();
}

// --- CLEAR FORM ---
export function clearProductForm() {
  [
    "product-name", "product-description", "product-category",
    "product-price-usd", "product-price-zar", "product-stock"
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  document.getElementById("product-artist-id").selectedIndex = 0;
  document.getElementById("product-main-image").value = "";
  document.getElementById("current-product-main-image").innerHTML = "";

  document.getElementById("add-product-btn").textContent = "Add Product";
  document.getElementById("add-product-btn").classList.remove("update-mode");
  document.getElementById("cancel-edit-product-btn").style.display = "none";
  document.getElementById("product-form-title").textContent = "Add Product";

  editingProductId = null;
  editingProductImages = {};

  document.getElementById("product-submit-success").textContent = "";
  document.getElementById("product-submit-error").textContent = "";
}

// --- IMAGE UPLOAD HELPERS ---
async function uploadImage(file, path) {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

/**
 * Generate resized images in the browser
 * @param {File} file
 * @param {Array} sizes array of widths in px
 * @returns {Object} {200: blob, 400: blob}
 */
async function generateThumbnails(file, sizes) {
  const img = document.createElement("img");
  img.src = URL.createObjectURL(file);

  await new Promise(resolve => {
    img.onload = () => resolve();
  });

  const canvas = document.createElement("canvas");
  const result = {};

  for (let size of sizes) {
    const scale = size / Math.max(img.width, img.height);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise(res => canvas.toBlob(res, file.type, 0.85));
    result[size] = blob;
  }

  return result;
}

// --- HANDLE PRODUCT SUBMIT ---
async function handleProductSubmit() {
  const name = document.getElementById("product-name").value.trim();
  const description = document.getElementById("product-description").value.trim();
  const priceUsd = parseFloat(document.getElementById("product-price-usd").value.trim());
  const priceZar = parseFloat(document.getElementById("product-price-zar").value.trim());
  const quantity = parseInt(document.getElementById("product-stock").value.trim(), 10);
  const artistId = document.getElementById("product-artist-id").value;
  const category = document.getElementById("product-category").value.trim();
  const imageFile = document.getElementById("product-main-image").files[0];

  const successMessageEl = document.getElementById("product-submit-success");
  const errorMessageEl = document.getElementById("product-submit-error");
  successMessageEl.textContent = "";
  errorMessageEl.textContent = "";

  if (!name || !artistId || isNaN(priceUsd) || !category) {
    errorMessageEl.textContent = "Product Name, Price (USD), Artist, and Category are required.";
    return;
  }

  const addUpdateBtn = document.getElementById("add-product-btn");
  addUpdateBtn.disabled = true;

  try {
    let originalUrl = editingProductImages.original || null;
    let thumb200Url = editingProductImages.thumb200 || null;
    let thumb400Url = editingProductImages.thumb400 || null;

    const safeName = name.replace(/\s+/g, "_").toLowerCase();

    if (imageFile) {
      // Delete old images if editing
      if (editingProductId && editingProductImages.original) {
        for (let key of ["original", "thumb200", "thumb400"]) {
          if (editingProductImages[key]) {
            try {
              const url = new URL(editingProductImages[key]);
              const path = decodeURIComponent(url.pathname.split('/o/')[1]).split('?')[0];
              await deleteObject(ref(storage, path));
            } catch (e) {
              console.warn("Could not delete old image:", e);
            }
          }
        }
      }

      // Upload original
      originalUrl = await uploadImage(imageFile, `products/originals/${safeName}_${Date.now()}_${imageFile.name}`);

      // Generate and upload thumbnails
      const thumbs = await generateThumbnails(imageFile, THUMB_SIZES);
      thumb200Url = await uploadImage(thumbs[200], `products/200x200/${safeName}_${Date.now()}_${imageFile.name}`);
      thumb400Url = await uploadImage(thumbs[400], `products/400x400/${safeName}_${Date.now()}_${imageFile.name}`);

      editingProductImages = { original: originalUrl, thumb200: thumb200Url, thumb400: thumb400Url };
    }

    const productData = {
      name,
      description,
      priceUsd,
      priceZar: isNaN(priceZar) ? null : priceZar,
      quantity: isNaN(quantity) ? null : quantity,
      artistId,
      category,
      originalImage: originalUrl,
      thumbnail200: thumb200Url,
      thumbnail400: thumb400Url,
      updatedAt: new Date()
    };

    if (editingProductId) {
      const docRef = doc(db, "products", editingProductId);
      await updateDoc(docRef, productData);
      successMessageEl.textContent = "Product updated successfully!";
    } else {
      productData.createdAt = new Date();
      await addDoc(collection(db, "products"), productData);
      successMessageEl.textContent = "Product added successfully!";
    }

    clearProductForm();
    await loadProducts();

  } catch (err) {
    console.error("Product submission failed:", err);
    errorMessageEl.textContent = `Failed to save product: ${err.message || "Unknown error"}`;
  } finally {
    addUpdateBtn.disabled = false;
  }
}

// --- LOAD PRODUCTS ---
export async function loadProducts(artistFilterId = "") {
  const listElement = document.getElementById("products-list");
  if (!listElement) return;
  listElement.innerHTML = "Loading products...";

  try {
    let productsQueryRef = collection(db, "products");
    let productsQuery = query(productsQueryRef, orderBy("createdAt", "desc"));

    if (artistFilterId) {
      productsQuery = query(productsQuery, where("artistId", "==", artistFilterId));
    }

    const snapshot = await getDocs(productsQuery);
    if (snapshot.empty) {
      listElement.innerHTML = "<p>No products found.</p>";
      return;
    }

    const artistsSnapshot = await getDocs(collection(db, "artists"));
    const artistsMap = {};
    artistsSnapshot.forEach(doc => artistsMap[doc.id] = doc.data().name || "Unnamed Artist");

    const categoriesSnapshot = await getDocs(collection(db, "categories"));
    const categoriesMap = new Map();
    categoriesSnapshot.forEach(doc => {
      const cat = doc.data();
      categoriesMap.set(cat.slug, cat.displayName);
    });

    let htmlContent = "<ul style='list-style:none;padding:0'>";

    snapshot.forEach(docSnap => {
      const product = docSnap.data();
      const productId = docSnap.id;
      const artistName = artistsMap[product.artistId] || "Unknown Artist";
      const categoryDisplayName = categoriesMap.get(product.category) || product.category || "N/A";

      const displayImage = product.thumbnail200 || product.originalImage;

      htmlContent += `<li style="margin-bottom:20px;border:1px solid #eee;padding:10px;border-radius:5px;">
        <strong>${product.name}</strong><br/>
        Artist: ${artistName}<br/>
        Price: $${typeof product.priceUsd === 'number' ? product.priceUsd.toFixed(2) : "N/A"}<br/>
        Price (ZAR): R${typeof product.priceZar === 'number' ? product.priceZar.toFixed(2) : "N/A"}<br/>
        Quantity: ${product.quantity || 0}<br/>
        Category: ${categoryDisplayName}<br/>
        ${displayImage ? `<div><strong>Image:</strong><br/><img src="${displayImage}" width="80" style="margin-top:5px;border-radius:3px;"></div>` : ""}
        <div style="margin-top:10px;">
          <button class="edit-product-btn" data-id="${productId}">Edit</button>
          <button class="delete-product-btn" data-id="${productId}">Delete</button>
        </div>
      </li>`;
    });

    htmlContent += "</ul>";
    listElement.innerHTML = htmlContent;

    document.querySelectorAll(".edit-product-btn").forEach(btn => {
      btn.addEventListener("click", () => editProduct(btn.dataset.id));
    });
    document.querySelectorAll(".delete-product-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        if (confirm("Delete this product and all its images?")) deleteProduct(btn.dataset.id);
      });
    });

  } catch (err) {
    console.error("Failed to load products:", err);
    listElement.innerHTML = "<p>Failed to load products.</p>";
  }
}

// --- EDIT PRODUCT ---
async function editProduct(id) {
  const productDocRef = doc(db, "products", id);
  const snap = await getDoc(productDocRef);
  if (!snap.exists()) {
    document.getElementById("product-submit-error").textContent = "Product not found for editing.";
    return;
  }

  const product = snap.data();
  editingProductId = id;
  editingProductImages = {
    original: product.originalImage,
    thumb200: product.thumbnail200,
    thumb400: product.thumbnail400
  };

  await populateCategoriesDropdown();
  await populateArtistDropdownForProductForm();

  document.getElementById("product-name").value = product.name || "";
  document.getElementById("product-description").value = product.description || "";
  document.getElementById("product-price-usd").value = product.priceUsd || "";
  document.getElementById("product-price-zar").value = product.priceZar || "";
  document.getElementById("product-stock").value = product.quantity || "";
  document.getElementById("product-artist-id").value = product.artistId || "";
  document.getElementById("product-category").value = product.category || "";

  document.getElementById("product-form-title").textContent = "Edit Product";
  document.getElementById("add-product-btn").textContent = "Update Product";
  document.getElementById("add-product-btn").classList.add("update-mode");
  document.getElementById("cancel-edit-product-btn").style.display = "inline-block";

  document.getElementById("current-product-main-image").innerHTML = product.originalImage
    ? `<img src="${product.originalImage}" width="80" style="margin-top:8px;border:1px solid #ccc;">`
    : "<p>No main image.</p>";

  document.getElementById("product-submit-success").textContent = "";
  document.getElementById("product-submit-error").textContent = "";

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- DELETE PRODUCT ---
async function deleteProduct(id) {
  try {
    const productDocRef = doc(db, "products", id);
    const snap = await getDoc(productDocRef);
    const product = snap.data();

    if (product) {
      for (let key of ["originalImage", "thumbnail200", "thumbnail400"]) {
        if (product[key]) {
          try {
            const url = new URL(product[key]);
            const path = decodeURIComponent(url.pathname.split('/o/')[1]).split('?')[0];
            await deleteObject(ref(storage, path));
          } catch (e) {
            console.warn("Could not delete image:", e);
          }
        }
      }
    }

    await deleteDoc(productDocRef);
    document.getElementById("product-submit-success").textContent = "Product deleted successfully!";
    await loadProducts();

  } catch (err) {
    console.error("Failed to delete product:", err);
    document.getElementById("product-submit-error").textContent = "Failed to delete product.";
  }
}

// --- DROPDOWNS ---
export async function populateArtistFilter() {
  const select = document.getElementById("artist-filter");
  if (!select) return;

  const current = select.value;
  select.innerHTML = '<option value="">All Artists</option>';

  try {
    const artists = await getDocs(collection(db, "artists"));
    artists.forEach(doc => {
      const option = document.createElement("option");
      option.value = doc.id;
      option.textContent = doc.data().name || "Unnamed Artist";
      select.appendChild(option);
    });
    select.value = current || "";
  } catch (e) {
    console.error("Failed to populate artist filter:", e);
  }
}

async function populateArtistDropdownForProductForm() {
  const select = document.getElementById("product-artist-id");
  if (!select) return;

  const current = select.value;
  select.innerHTML = '<option value="">-- Select an Artist --</option>';

  try {
    const artists = await getDocs(collection(db, "artists"));
    artists.forEach(doc => {
      const option = document.createElement("option");
      option.value = doc.id;
      option.textContent = doc.data().name || "Unnamed Artist";
      select.appendChild(option);
    });
    select.value = current;
  } catch (e) {
    console.error("Failed to populate artist dropdown:", e);
  }
}

export async function populateCategoriesDropdown() {
  const select = document.getElementById("product-category");
  if (!select) return;
  const current = select.value;
  select.innerHTML = '<option value="">-- Select Category --</option>';

  try {
    const snapshot = await getDocs(query(collection(db, "categories"), orderBy("displayName")));
    if (snapshot.empty) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "No categories available";
      option.disabled = true;
      select.appendChild(option);
      return;
    }

    snapshot.forEach(doc => {
      const cat = doc.data();
      const option = document.createElement("option");
      option.value = cat.slug || doc.id;
      option.textContent = cat.displayName || cat.slug || "Unnamed Category";
      select.appendChild(option);
    });

    select.value = current;

  } catch (e) {
    console.error("Failed to populate categories dropdown:", e);
    document.getElementById("product-submit-error").textContent = "Failed to load categories.";
  }
}

// --- INITIAL LOAD ---
document.addEventListener('DOMContentLoaded', () => {
  setupProductForm();
  loadProducts();
});
