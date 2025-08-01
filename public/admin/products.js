// products.js

// Import necessary Firebase modules and services
import { db, storage } from './firebase.js'; // This 'firebase.js' should initialize Firebase for your admin dashboard

import {
    collection, addDoc, getDocs, getDoc,
    query, orderBy, doc, deleteDoc, updateDoc, where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    ref, uploadBytes, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// Global variables to manage product editing state
let editingProductId = null;
let editingProductImageUrl = null;

/**
 * Sets up event listeners for the product form buttons.
 */
export function setupProductForm() {
    const addProductBtn = document.getElementById("add-product-btn");
    const cancelEditBtn = document.getElementById("cancel-edit-product-btn");
    const artistFilterSelect = document.getElementById("artist-filter");

    // Event listeners for adding/updating and canceling product edits
    addProductBtn?.addEventListener("click", handleProductSubmit);
    cancelEditBtn?.addEventListener("click", clearProductForm);

    // Event listener for filtering products by artist
    artistFilterSelect?.addEventListener("change", async () => {
        const selectedArtistId = artistFilterSelect.value;
        await loadProducts(selectedArtistId);
    });

    // Dynamically populate dropdowns when the form is set up
    populateCategoriesDropdown();
    populateArtistDropdownForProductForm(); // For the artist selection in the product form itself
    populateArtistFilter(); // For filtering the product list
}

/**
 * Clears all input fields in the product form and resets button states.
 */
export function clearProductForm() {
    // List of input fields to clear
    const fields = [
        "product-name", "product-description", "product-category",
        "product-price-usd", "product-price-zar", "product-stock",
    ];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });

    // Reset specific elements
    document.getElementById("product-artist-id").selectedIndex = 0; // Reset artist dropdown
    document.getElementById("product-main-image").value = ""; // Clear file input
    document.getElementById("current-product-main-image").innerHTML = ""; // Clear current image preview

    // Reset button texts and visibility
    document.getElementById("add-product-btn").textContent = "Add Product";
    document.getElementById("add-product-btn").classList.remove("update-mode");
    document.getElementById("cancel-edit-product-btn").style.display = "none";
    document.getElementById("product-form-title").textContent = "Add Product";

    // Reset editing state variables
    editingProductId = null;
    editingProductImageUrl = null;

    // Clear submission messages
    document.getElementById("product-submit-success").textContent = "";
    document.getElementById("product-submit-error").textContent = "";
}

/**
 * Handles the submission of the product form (add or update).
 */
async function handleProductSubmit() {
    // Get values from form fields, trimming whitespace
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

    // Clear previous messages
    successMessageEl.textContent = "";
    errorMessageEl.textContent = "";

    // Basic form validation
    if (!name || !artistId || isNaN(priceUsd) || !category) {
        errorMessageEl.textContent = "Product Name, Price (USD), Artist, and Category are required fields.";
        return;
    }

    const addUpdateBtn = document.getElementById("add-product-btn");
    addUpdateBtn.disabled = true; // Disable button to prevent multiple submissions

    try {
        let mainImageUrl = editingProductImageUrl; // Start with existing image if editing

        // Sanitize product name for image storage path
        const safeName = name.replace(/\s+/g, "_").toLowerCase();

        // Handle image upload if a new file is selected
        if (imageFile) {
            // If an old image exists and a new one is uploaded, delete the old one
            if (editingProductImageUrl) {
                try {
                    // Extract path from Firebase Storage URL
                    const url = new URL(editingProductImageUrl);
                    const path = decodeURIComponent(url.pathname.split('/o/')[1]).split('?')[0];
                    await deleteObject(ref(storage, path));
                    console.log("Old product image successfully deleted from storage.");
                } catch (e) {
                    console.warn("Could not delete old product image from storage. It might not exist or the URL is malformed.", e);
                }
            }
            // Upload the new image
            const imageRef = ref(storage, `products/${safeName}_${Date.now()}_${imageFile.name}`);
            await uploadBytes(imageRef, imageFile);
            mainImageUrl = await getDownloadURL(imageRef); // Get the new download URL
        }

        // Prepare product data for Firestore
        const productData = {
            name,
            description,
            priceUsd,
            priceZar: isNaN(priceZar) ? null : priceZar, // Store as null if not a valid number
            quantity: isNaN(quantity) ? null : quantity, // Store as null if not a valid number
            artistId,
            category,
            mainImage: mainImageUrl, // Use the updated URL or existing one
            updatedAt: new Date(), // Always update 'updatedAt' timestamp
        };

        // Determine if we are adding a new product or updating an existing one
        if (editingProductId) {
            const docRef = doc(db, "products", editingProductId);
            const snap = await getDoc(docRef);
            if (!snap.exists()) {
                errorMessageEl.textContent = "Product you are trying to edit no longer exists.";
                return;
            }
            await updateDoc(docRef, productData); // Update existing document
            successMessageEl.textContent = "Product updated successfully!";
        } else {
            productData.createdAt = new Date(); // Set 'createdAt' only for new products
            await addDoc(collection(db, "products"), productData); // Add new document
            successMessageEl.textContent = "Product added successfully!";
        }

        // After successful operation, clear the form and reload the product list
        clearProductForm();
        await loadProducts();

    } catch (err) {
        console.error("Product submission failed:", err);
        errorMessageEl.textContent = `Failed to save product: ${err.message || "An unknown error occurred."}`;
    } finally {
        addUpdateBtn.disabled = false; // Re-enable the button
    }
}

/**
 * Loads and displays the list of products, optionally filtered by artist.
 * @param {string} artistFilterId - Optional ID of an artist to filter by.
 */
export async function loadProducts(artistFilterId = "") {
    const listElement = document.getElementById("products-list");
    if (!listElement) return;

    listElement.innerHTML = "Loading products..."; // Show loading message

    try {
        let productsQueryRef = collection(db, "products");
        let productsQuery = query(productsQueryRef, orderBy("createdAt", "desc"));

        // Apply artist filter if specified
        if (artistFilterId) {
            productsQuery = query(productsQuery, where("artistId", "==", artistFilterId));
        }

        const productSnapshot = await getDocs(productsQuery);

        if (productSnapshot.empty) {
            listElement.innerHTML = "<p>No products found.</p>";
            return;
        }

        // Fetch all artists to map IDs to names for display
        const artistsSnapshot = await getDocs(collection(db, "artists"));
        const artistsMap = {};
        artistsSnapshot.forEach(doc => {
            artistsMap[doc.id] = doc.data().name || "Unnamed Artist";
        });

        // Fetch all categories to map slugs to display names
        const categoriesSnapshot = await getDocs(collection(db, "categories"));
        const categoriesMap = new Map();
        categoriesSnapshot.forEach(doc => {
            const catData = doc.data();
            categoriesMap.set(catData.slug, catData.displayName);
        });

        let htmlContent = "<ul style='list-style:none;padding:0'>";

        productSnapshot.forEach(docSnap => {
            const product = docSnap.data();
            const productId = docSnap.id;

            const artistName = artistsMap[product.artistId] || "Unknown Artist";
            // Get display name for category, fallback to slug or "N/A"
            const categoryDisplayName = categoriesMap.get(product.category) || product.category || "N/A";

            htmlContent += `<li style="margin-bottom:20px; border: 1px solid #eee; padding: 10px; border-radius: 5px;">
                <strong>${product.name}</strong><br/>
                Artist: ${artistName}<br/>
                Price: $${typeof product.priceUsd === 'number' ? product.priceUsd.toFixed(2) : "N/A"}<br/>
                Price (ZAR): R${typeof product.priceZar === 'number' ? product.priceZar.toFixed(2) : "N/A"}<br/>
                Quantity: ${product.quantity || 0}<br/>
                Category: ${categoryDisplayName}<br/>
                ${product.mainImage ? `<div><strong>Main Image:</strong><br/><img src="${product.mainImage}" width="80" style="margin-top: 5px; border-radius: 3px;"/></div>` : ""}
                <div style="margin-top: 10px;">
                    <button class="edit-product-btn" data-id="${productId}">Edit</button>
                    <button class="delete-product-btn" data-id="${productId}">Delete</button>
                </div>
            </li>`;
        });

        htmlContent += "</ul>";
        listElement.innerHTML = htmlContent;

        // Attach event listeners to Edit buttons
        document.querySelectorAll(".edit-product-btn").forEach(btn => {
            btn.addEventListener("click", () => editProduct(btn.dataset.id));
        });

        // Attach event listeners to Delete buttons
        document.querySelectorAll(".delete-product-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                if (confirm("Are you sure you want to delete this product? This action cannot be undone and will also delete its image from storage.")) {
                    deleteProduct(btn.dataset.id);
                }
            });
        });

    } catch (err) {
        console.error("Failed to load products:", err);
        listElement.innerHTML = "<p>Failed to load products.</p>";
    }
}

/**
 * Populates the product form with data of a selected product for editing.
 * @param {string} id - The ID of the product to edit.
 */
async function editProduct(id) {
    const productDocRef = doc(db, "products", id);
    const productDocSnap = await getDoc(productDocRef);

    if (!productDocSnap.exists()) {
        document.getElementById("product-submit-error").textContent = "Product not found for editing.";
        return;
    }

    const productData = productDocSnap.data();
    editingProductId = id; // Set the global editing ID
    editingProductImageUrl = productData.mainImage; // Store the current image URL

    // Ensure dropdowns are populated before setting their values
    await populateCategoriesDropdown();
    await populateArtistDropdownForProductForm();

    // Populate form fields with product data
    document.getElementById("product-name").value = productData.name || "";
    document.getElementById("product-description").value = productData.description || "";
    document.getElementById("product-price-usd").value = productData.priceUsd || "";
    document.getElementById("product-price-zar").value = productData.priceZar || "";
    document.getElementById("product-stock").value = productData.quantity || "";
    document.getElementById("product-artist-id").value = productData.artistId || ""; // Set selected artist
    document.getElementById("product-category").value = productData.category || ""; // Set selected category

    // Update form title and button text/style
    document.getElementById("product-form-title").textContent = "Edit Product";
    document.getElementById("add-product-btn").textContent = "Update Product";
    document.getElementById("add-product-btn").classList.add("update-mode");
    document.getElementById("cancel-edit-product-btn").style.display = "inline-block";

    // Display current main image preview
    document.getElementById("current-product-main-image").innerHTML = productData.mainImage
        ? `<img src="${productData.mainImage}" width="80" style="margin-top: 8px; border: 1px solid #ccc;">`
        : "<p>No main image.</p>";

    // Clear any previous submission messages
    document.getElementById("product-submit-success").textContent = "";
    document.getElementById("product-submit-error").textContent = "";

    // Scroll to the top of the page for easy editing
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Deletes a product from Firestore and its associated image from Storage.
 * @param {string} id - The ID of the product to delete.
 */
async function deleteProduct(id) {
    try {
        const productDocRef = doc(db, "products", id);
        const productDocSnap = await getDoc(productDocRef);
        const productData = productDocSnap.data();

        // If a main image exists, attempt to delete it from Firebase Storage
        if (productData && productData.mainImage) {
            try {
                const url = new URL(productData.mainImage);
                const path = decodeURIComponent(url.pathname.split('/o/')[1]).split('?')[0];
                await deleteObject(ref(storage, path));
                console.log("Product image successfully deleted from storage.");
            } catch (e) {
                console.warn("Could not delete product image from storage (it might not exist or the URL is malformed):", e);
            }
        }

        // Delete the product document from Firestore
        await deleteDoc(productDocRef);
        document.getElementById("product-submit-success").textContent = "Product deleted successfully!";
        await loadProducts(); // Reload the product list after deletion

    } catch (err) {
        console.error("Failed to delete product:", err);
        document.getElementById("product-submit-error").textContent = "Failed to delete product.";
    }
}

/**
 * Populates the "Filter by Artist" dropdown for filtering the product list.
 */
export async function populateArtistFilter() {
    const selectElement = document.getElementById("artist-filter");
    if (!selectElement) return;

    // Clear existing options, but keep the default "All Artists"
    const currentValue = selectElement.value; // Store current value to restore after repopulating
    selectElement.innerHTML = '<option value="">All Artists</option>';

    try {
        const artistsSnapshot = await getDocs(collection(db, "artists"));
        artistsSnapshot.forEach(doc => {
            const artist = doc.data();
            const option = document.createElement("option");
            option.value = doc.id; // Store artist ID as option value
            option.textContent = artist.name || "Unnamed Artist"; // Display artist name
            selectElement.appendChild(option);
        });

        // Restore the previously selected value, or ensure "All Artists" is selected if no match
        selectElement.value = currentValue || "";

    } catch (err) {
        console.error("Failed to populate artist filter dropdown:", err);
    }
}

/**
 * Populates the "Artist" dropdown within the product add/edit form.
 */
async function populateArtistDropdownForProductForm() {
    const selectElement = document.getElementById("product-artist-id");
    if (!selectElement) return;

    // Store current value to re-select if repopulating during an edit
    const currentValue = selectElement.value;

    // Clear existing options, keeping the default
    selectElement.innerHTML = '<option value="">-- Select an Artist --</option>';

    try {
        const artistsSnapshot = await getDocs(collection(db, "artists"));
        artistsSnapshot.forEach(doc => {
            const artist = doc.data();
            const option = document.createElement("option");
            option.value = doc.id;
            option.textContent = artist.name || "Unnamed Artist";
            selectElement.appendChild(option);
        });

        // Restore the previously selected value
        selectElement.value = currentValue;

    } catch (err) {
        console.error("Failed to populate artist dropdown for product form:", err);
    }
}

/**
 * Populates the "Category" dropdown in the product add/edit form from Firestore.
 */
export async function populateCategoriesDropdown() {
    const selectElement = document.getElementById("product-category");
    if (!selectElement) return;

    // Store current value to re-select if repopulating during an edit
    const currentValue = selectElement.value;

    // Clear existing options, keeping the default
    selectElement.innerHTML = '<option value="">-- Select Category --</option>';

    try {
        const categoriesCollectionRef = collection(db, "categories");
        const q = query(categoriesCollectionRef, orderBy("displayName")); // Order by displayName for consistency

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.warn("No categories found in Firestore for dropdown.");
            const option = document.createElement("option");
            option.value = "";
            option.textContent = "No categories available";
            option.disabled = true;
            selectElement.appendChild(option);
            return;
        }

        snapshot.forEach(docSnap => {
            const categoryData = docSnap.data();
            const option = document.createElement("option");
            option.value = categoryData.slug || docSnap.id; // Use slug as value, fallback to document ID
            option.textContent = categoryData.displayName || categoryData.slug || "Unnamed Category"; // Display name, fallback to slug
            selectElement.appendChild(option);
        });

        // Restore the previously selected value
        selectElement.value = currentValue;

    } catch (err) {
        console.error("Failed to populate categories dropdown from Firestore:", err);
        document.getElementById("product-submit-error").textContent = "Failed to load categories for form.";
    }
}

// Ensure form setup and initial data loading happens once the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', () => {
    setupProductForm();
    loadProducts(); // Initial load of all products
});