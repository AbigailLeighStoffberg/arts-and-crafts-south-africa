// products.js

import { db, storage } from './firebase.js';
import {
    collection, addDoc, getDocs, getDoc, query, orderBy, doc, updateDoc, where, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
    ref, uploadBytes, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

let editingProductId = null;
let editingProductOriginalImage = null;

// ----------------------
// Product Form Setup
// ----------------------
export function setupProductForm() {
    const addProductBtn = document.getElementById("add-product-btn");
    const cancelEditBtn = document.getElementById("cancel-edit-product-btn");
    const artistFilterSelect = document.getElementById("artist-filter");

    addProductBtn?.addEventListener("click", handleProductSubmit);
    cancelEditBtn?.addEventListener("click", clearProductForm);

    artistFilterSelect?.addEventListener("change", async () => {
        await loadProducts(artistFilterSelect.value);
    });

    populateCategoriesDropdown();
    populateArtistDropdownForProductForm();
    populateArtistFilter();
}

// ----------------------
// Clear Form
// ----------------------
export function clearProductForm() {
    const fields = ["product-name", "product-description", "product-category",
        "product-price-usd", "product-price-zar", "product-stock"];
    fields.forEach(id => document.getElementById(id).value = "");

    document.getElementById("product-artist-id").selectedIndex = 0;
    document.getElementById("product-main-image").value = "";
    document.getElementById("current-product-main-image").innerHTML = "";

    document.getElementById("add-product-btn").textContent = "Add Product";
    document.getElementById("add-product-btn").classList.remove("update-mode");
    document.getElementById("cancel-edit-product-btn").style.display = "none";
    document.getElementById("product-form-title").textContent = "Add Product";

    editingProductId = null;
    editingProductOriginalImage = null;

    document.getElementById("product-submit-success").textContent = "";
    document.getElementById("product-submit-error").textContent = "";
}

// ----------------------
// Submit Product
// ----------------------
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
        let originalImageUrl = editingProductOriginalImage;

        // Upload new image if selected
        if (imageFile) {
            if (editingProductOriginalImage) {
                // Delete old image
                try {
                    const url = new URL(editingProductOriginalImage);
                    const path = decodeURIComponent(url.pathname.split('/o/')[1]).split('?')[0];
                    await deleteObject(ref(storage, path));
                } catch(e){ console.warn("Could not delete old image", e); }
            }

            const safeName = name.replace(/\s+/g,"_").toLowerCase();
            const imageRef = ref(storage, `products/originals/${safeName}_${Date.now()}_${imageFile.name}`);
            await uploadBytes(imageRef, imageFile);
            originalImageUrl = await getDownloadURL(imageRef);
        }

        const productData = {
            name,
            description,
            priceUsd,
            priceZar: isNaN(priceZar)?null:priceZar,
            quantity: isNaN(quantity)?null:quantity,
            artistId,
            category,
            originalImage: originalImageUrl,
            updatedAt: new Date(),
        };

        if (editingProductId) {
            const docRef = doc(db,"products",editingProductId);
            await updateDoc(docRef, productData);
            successMessageEl.textContent = "Product updated!";
        } else {
            productData.createdAt = new Date();
            const docRef = await addDoc(collection(db,"products"),productData);
            successMessageEl.textContent = "Product added!";

            // Preview new product image immediately
            if(originalImageUrl){
                document.getElementById("current-product-main-image").innerHTML =
                    `<img src="${originalImageUrl}" width="80" style="margin-top:8px;border:1px solid #ccc;">`;
            }
        }

        clearProductForm();
        await loadProducts();

    } catch(err) {
        console.error(err);
        errorMessageEl.textContent = "Failed to save product: "+(err.message||err);
    } finally {
        addUpdateBtn.disabled = false;
    }
}

// ----------------------
// Load Products
// ----------------------
export async function loadProducts(artistFilterId="") {
    const listEl = document.getElementById("products-list");
    if(!listEl) return;
    listEl.innerHTML = "Loading products...";

    try {
        let productsQueryRef = collection(db,"products");
        let q = query(productsQueryRef, orderBy("createdAt","desc"));
        if(artistFilterId) q = query(q, where("artistId","==",artistFilterId));

        const snapshot = await getDocs(q);
        if(snapshot.empty){ listEl.innerHTML="<p>No products found.</p>"; return; }

        const artistsSnap = await getDocs(collection(db,"artists"));
        const artistsMap = {};
        artistsSnap.forEach(doc=>{ artistsMap[doc.id]=doc.data().name || "Unnamed Artist"; });

        const categoriesSnap = await getDocs(collection(db,"categories"));
        const categoriesMap = new Map();
        categoriesSnap.forEach(doc=>categoriesMap.set(doc.data().slug, doc.data().displayName));

        let html = "<ul style='list-style:none;padding:0'>";
        snapshot.forEach(docSnap=>{
            const product = docSnap.data();
            const id = docSnap.id;
            const artistName = artistsMap[product.artistId] || "Unknown Artist";
            const categoryDisplayName = categoriesMap.get(product.category) || product.category || "N/A";

            // Use 200x200 thumbnail if exists
            const thumb200 = product.thumbnail200 || product.originalImage || "";
            html += `<li style="margin-bottom:20px; border:1px solid #eee; padding:10px; border-radius:5px;">
                <strong>${product.name}</strong><br/>
                Artist: ${artistName}<br/>
                Price: $${typeof product.priceUsd==='number'?product.priceUsd.toFixed(2):"N/A"}<br/>
                Price (ZAR): R${typeof product.priceZar==='number'?product.priceZar.toFixed(2):"N/A"}<br/>
                Quantity: ${product.quantity||0}<br/>
                Category: ${categoryDisplayName}<br/>
                ${thumb200 ? `<div><img src="${thumb200}" width="80" style="margin-top:5px;border-radius:3px;"/></div>` : ""}
                <div style="margin-top:10px;">
                    <button class="edit-product-btn" data-id="${id}">Edit</button>
                    <button class="delete-product-btn" data-id="${id}">Delete</button>
                </div>
            </li>`;
        });
        html += "</ul>";
        listEl.innerHTML = html;

        document.querySelectorAll(".edit-product-btn").forEach(btn=>{
            btn.addEventListener("click",()=>editProduct(btn.dataset.id));
        });
        document.querySelectorAll(".delete-product-btn").forEach(btn=>{
            btn.addEventListener("click",()=>{ 
                if(confirm("Are you sure?")) deleteProduct(btn.dataset.id); 
            });
        });

    } catch(err){
        console.error(err);
        listEl.innerHTML="<p>Failed to load products.</p>";
    }
}

// ----------------------
// Edit Product
// ----------------------
async function editProduct(id){
    const docRef = doc(db,"products",id);
    const snap = await getDoc(docRef);
    if(!snap.exists()){ document.getElementById("product-submit-error").textContent="Product not found."; return; }
    const product = snap.data();

    editingProductId = id;
    editingProductOriginalImage = product.originalImage;

    await populateCategoriesDropdown();
    await populateArtistDropdownForProductForm();

    document.getElementById("product-name").value = product.name||"";
    document.getElementById("product-description").value = product.description||"";
    document.getElementById("product-price-usd").value = product.priceUsd||"";
    document.getElementById("product-price-zar").value = product.priceZar||"";
    document.getElementById("product-stock").value = product.quantity||"";
    document.getElementById("product-artist-id").value = product.artistId||"";
    document.getElementById("product-category").value = product.category||"";

    document.getElementById("product-form-title").textContent="Edit Product";
    document.getElementById("add-product-btn").textContent="Update Product";
    document.getElementById("add-product-btn").classList.add("update-mode");
    document.getElementById("cancel-edit-product-btn").style.display="inline-block";

    document.getElementById("current-product-main-image").innerHTML = product.originalImage
        ? `<img src="${product.originalImage}" width="80" style="margin-top:8px;border:1px solid #ccc;">`
        : "<p>No main image.</p>";

    document.getElementById("product-submit-success").textContent = "";
    document.getElementById("product-submit-error").textContent = "";

    window.scrollTo({top:0, behavior:'smooth'});
}

// ----------------------
// Delete Product
// ----------------------
async function deleteProduct(id){
    try{
        const docRef = doc(db,"products",id);
        const snap = await getDoc(docRef);
        const product = snap.data();

        // Delete all images
        const imagesToDelete = [product.originalImage, product.thumbnail200, product.thumbnail400, product.thumbnail800];
        for(const url of imagesToDelete){
            if(url){
                try{
                    const path = decodeURIComponent(new URL(url).pathname.split('/o/')[1].split('?')[0]);
                    await deleteObject(ref(storage,path));
                }catch(e){console.warn("Failed to delete image",e);}
            }
        }

        await deleteDoc(docRef);
        document.getElementById("product-submit-success").textContent="Product deleted!";
        await loadProducts();
    }catch(err){ console.error(err); document.getElementById("product-submit-error").textContent="Failed to delete product."; }
}

// ----------------------
// Populate Dropdowns
// ----------------------
export async function populateArtistFilter(){
    const selectEl = document.getElementById("artist-filter");
    if(!selectEl) return;
    const curVal = selectEl.value;
    selectEl.innerHTML='<option value="">All Artists</option>';
    const artistsSnap = await getDocs(collection(db,"artists"));
    artistsSnap.forEach(doc=>{
        const artist=doc.data();
        const opt = document.createElement("option");
        opt.value = doc.id;
        opt.textContent = artist.name||"Unnamed Artist";
        selectEl.appendChild(opt);
    });
    selectEl.value = curVal || "";
}

async function populateArtistDropdownForProductForm(){
    const selectEl = document.getElementById("product-artist-id");
    if(!selectEl) return;
    const curVal = selectEl.value;
    selectEl.innerHTML='<option value="">-- Select an Artist --</option>';
    const artistsSnap = await getDocs(collection(db,"artists"));
    artistsSnap.forEach(doc=>{
        const artist = doc.data();
        const opt = document.createElement("option");
        opt.value = doc.id;
        opt.textContent = artist.name||"Unnamed Artist";
        selectEl.appendChild(opt);
    });
    selectEl.value = curVal;
}

export async function populateCategoriesDropdown(){
    const selectEl = document.getElementById("product-category");
    if(!selectEl) return;
    const curVal = selectEl.value;
    selectEl.innerHTML='<option value="">-- Select Category --</option>';
    const snapshot = await getDocs(query(collection(db,"categories"),orderBy("displayName")));
    snapshot.forEach(doc=>{
        const cat = doc.data();
        const opt = document.createElement("option");
        opt.value = cat.slug||doc.id;
        opt.textContent = cat.displayName||cat.slug||"Unnamed Category";
        selectEl.appendChild(opt);
    });
    selectEl.value = curVal;
}

// ----------------------
// Initialize
// ----------------------
document.addEventListener('DOMContentLoaded',()=>{
    setupProductForm();
    loadProducts();
});
