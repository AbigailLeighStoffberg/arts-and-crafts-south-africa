// categories.js

import { db, storage } from './firebase.js'; // Import db and storage directly from your firebase.js initialization

import {
    collection,
    getDocs,
    doc,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    where // Added where in case you need it later, though not used in direct CRUD
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";


// DOM Elements
const categoryFormTitle = document.getElementById("category-form-title");
const categoryDisplayNameInput = document.getElementById("category-display-name");
const categorySlugInput = document.getElementById("category-slug");
const currentCategoryImageDiv = document.getElementById("current-category-image");
const categoryImageInput = document.getElementById("category-image");
const addCategoryBtn = document.getElementById("add-category-btn");
const cancelEditCategoryBtn = document.getElementById("cancel-edit-category-btn");
const categorySubmitSuccess = document.getElementById("category-submit-success");
const categorySubmitError = document.getElementById("category-submit-error");
const categoriesListDiv = document.getElementById("categories-list");

// Global variable to store the ID of the category being edited and its current image URL
let editingCategoryId = null;
let editingCategoryImageUrl = null;

/**
 * Helper function to extract the storage path from a Firebase Storage download URL.
 * @param {string} url - The full Firebase Storage download URL.
 * @returns {string|null} The storage path, or null if the URL is not a valid Firebase Storage URL.
 */
function getStoragePathFromUrl(url) {
    if (!url || typeof url !== 'string') return null;
    try {
        const decodedUrl = decodeURIComponent(url);
        const startIndex = decodedUrl.indexOf('/o/') + 3;
        const endIndex = decodedUrl.indexOf('?');
        if (startIndex === -1 || endIndex === -1) {
            console.warn("URL does not seem to be a Firebase Storage URL or is malformed:", url);
            return null;
        }
        return decodedUrl.substring(startIndex, endIndex);
    } catch (e) {
        console.error("Error decoding URL:", e);
        return null;
    }
}


/**
 * Loads existing categories from Firestore and displays them in the admin interface.
 */
export async function loadCategories() {
    categoriesListDiv.innerHTML = "Loading categories...";
    try {
        const q = query(collection(db, "categories"), orderBy("displayName"));
        const querySnapshot = await getDocs(q);
        categoriesListDiv.innerHTML = "";

        if (querySnapshot.empty) {
            categoriesListDiv.innerHTML = "<p>No categories found.</p>";
            return;
        }

        querySnapshot.forEach((doc) => {
            const category = doc.data();
            const categoryId = doc.id;

            const categoryCard = document.createElement("div");
            categoryCard.className = "item-card"; // Use a class for consistent styling
            categoryCard.style.cssText = "margin-bottom:20px; border: 1px solid #eee; padding: 10px; border-radius: 5px;"; // Inline style for demonstration
            categoryCard.innerHTML = `
                <p><strong>Display Name:</strong> ${category.displayName || "N/A"}</p>
                <p><strong>Slug:</strong> ${category.slug || "N/A"}</p>
                ${category.image ? `<img src="${category.image}" alt="${category.displayName}" style="max-width: 100px; max-height: 100px; border-radius: 5px; margin-top: 5px;">` : ''}
                <div class="card-actions" style="margin-top: 10px;">
                    <button class="edit-btn" data-id="${categoryId}">Edit</button>
                    <button class="delete-btn" data-id="${categoryId}">Delete</button>
                </div>
            `;
            categoriesListDiv.appendChild(categoryCard);
        });

        categoriesListDiv.querySelectorAll(".edit-btn").forEach((button) => {
            button.addEventListener("click", (e) => editCategory(e.target.dataset.id));
        });
        categoriesListDiv.querySelectorAll(".delete-btn").forEach((button) => {
            button.addEventListener("click", (e) => {
                if (confirm("Are you sure you want to delete this category? This will also remove the category from any products that use it, but will NOT delete the products themselves.")) {
                    deleteCategory(e.target.dataset.id);
                }
            });
        });

    } catch (error) {
        console.error("Error loading categories:", error);
        categoriesListDiv.innerHTML = "<p style='color:red;'>Error loading categories.</p>";
    }
}

/**
 * Handles the submission of the category form (add or update).
 */
async function handleCategoryFormSubmit() {
    categorySubmitSuccess.textContent = "";
    categorySubmitError.textContent = "";
    addCategoryBtn.disabled = true; // Disable button to prevent double submission

    const displayName = categoryDisplayNameInput.value.trim();
    const slug = categorySlugInput.value.trim();
    const imageFile = categoryImageInput.files[0];

    if (!displayName || !slug) {
        categorySubmitError.textContent = "Category Display Name and Slug are required.";
        addCategoryBtn.disabled = false;
        return;
    }

    let categoryData = {
        displayName,
        slug,
    };

    try {
        let newImageUrl = editingCategoryImageUrl; // Start with the existing image URL

        // Handle image upload if a new file is selected
        if (imageFile) {
            // If editing and there was an old image, attempt to delete it
            if (editingCategoryId && editingCategoryImageUrl) {
                const oldImagePath = getStoragePathFromUrl(editingCategoryImageUrl);
                if (oldImagePath) {
                    try {
                        await deleteObject(ref(storage, oldImagePath));
                        console.log("Old category image deleted successfully from storage.");
                    } catch (deleteError) {
                        console.warn("Could not delete old category image from storage (might not exist or permission issue):", deleteError);
                    }
                }
            }
            // Upload the new image
            // Use slug for organization, and a timestamp for uniqueness
            const storageRef = ref(storage, `category_images/${slug.toLowerCase().replace(/[^a-z0-9]/g, '-')}_${Date.now()}_${imageFile.name}`);
            await uploadBytes(storageRef, imageFile);
            newImageUrl = await getDownloadURL(storageRef); // Get the new download URL
        } else if (editingCategoryId && !currentCategoryImageDiv.querySelector('img')) {
            // If editing, no new file, and 'Remove Image' was clicked
            newImageUrl = null;
            // Also, delete the image from storage if it previously existed
            if (editingCategoryImageUrl) {
                const oldImagePath = getStoragePathFromUrl(editingCategoryImageUrl);
                if (oldImagePath) {
                    try {
                        await deleteObject(ref(storage, oldImagePath));
                        console.log("Existing category image removed successfully from storage.");
                    } catch (deleteError) {
                        console.warn("Could not delete existing category image on form submission (might not exist or permission issue):", deleteError);
                    }
                }
            }
        }
        // If no new image and no removal, newImageUrl remains editingCategoryImageUrl (the original)

        categoryData.image = newImageUrl; // Assign the final image URL

        if (editingCategoryId) {
            // Update existing category
            const categoryRef = doc(db, "categories", editingCategoryId);
            await updateDoc(categoryRef, categoryData);
            categorySubmitSuccess.textContent = "Category updated successfully!";
        } else {
            // Add new category
            await addDoc(collection(db, "categories"), categoryData);
            categorySubmitSuccess.textContent = "Category added successfully!";
        }

        clearCategoryForm(); // Clear form and reset state
        await loadCategories(); // Reload the list
        // Call a function to update the product category dropdowns if it exists globally
        if (window.populateProductDropdowns) { // This is the function exposed in main.js
            window.populateProductDropdowns();
        }

    } catch (error) {
        console.error("Error saving category:", error);
        categorySubmitError.textContent = "Error saving category: " + error.message;
    } finally {
        addCategoryBtn.disabled = false; // Re-enable button
    }
}

/**
 * Populates the category form with data for editing a specific category.
 * @param {string} categoryId - The ID of the category to edit.
 */
async function editCategory(categoryId) {
    categorySubmitSuccess.textContent = "";
    categorySubmitError.textContent = "";

    try {
        const categoryRef = doc(db, "categories", categoryId);
        const categorySnap = await getDoc(categoryRef);

        if (!categorySnap.exists()) {
            categorySubmitError.textContent = "Category not found for editing.";
            return;
        }

        const category = categorySnap.data();
        editingCategoryId = categoryId; // Set current editing ID
        editingCategoryImageUrl = category.image || null; // Store current image URL

        categoryFormTitle.textContent = "Edit Category";
        addCategoryBtn.textContent = "Update Category";
        cancelEditCategoryBtn.style.display = "inline-block";

        categoryDisplayNameInput.value = category.displayName || "";
        categorySlugInput.value = category.slug || "";
        categoryImageInput.value = ""; // Clear file input

        // Display current image preview
        currentCategoryImageDiv.innerHTML = '';
        if (category.image) {
            const img = document.createElement('img');
            img.src = category.image;
            img.style.maxWidth = '100px';
            img.style.maxHeight = '100px';
            img.style.borderRadius = '5px';
            img.style.marginRight = '10px';
            currentCategoryImageDiv.appendChild(img);

            const removeImgBtn = document.createElement('button');
            removeImgBtn.textContent = 'Remove Image';
            removeImgBtn.type = 'button'; // Prevent form submission
            removeImgBtn.classList.add('remove-image-btn');
            removeImgBtn.addEventListener('click', () => {
                currentCategoryImageDiv.innerHTML = ''; // Remove image preview
                editingCategoryImageUrl = null; // Mark image as removed for submission
                categoryImageInput.value = ''; // Clear file input
            });
            currentCategoryImageDiv.appendChild(removeImgBtn);
        } else {
            currentCategoryImageDiv.innerHTML = 'No current image.';
        }

        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top for easy editing

    } catch (error) {
        console.error("Error fetching category for edit:", error);
        categorySubmitError.textContent = "Error loading category for edit: " + error.message;
    }
}

/**
 * Deletes a category from Firestore and its associated image from Storage.
 * Also updates any products that were assigned to this category to remove the association.
 * @param {string} categoryId - The ID of the category to delete.
 */
async function deleteCategory(categoryId) {
    categorySubmitSuccess.textContent = "";
    categorySubmitError.textContent = "";

    try {
        const categoryDocRef = doc(db, "categories", categoryId);
        const categoryDocSnap = await getDoc(categoryDocRef);
        const categoryData = categoryDocSnap.data();

        // 1. Delete associated image from Storage
        if (categoryData && categoryData.image) {
            const imagePath = getStoragePathFromUrl(categoryData.image);
            if (imagePath) {
                try {
                    await deleteObject(ref(storage, imagePath));
                    console.log("Category image successfully deleted from storage.");
                } catch (err) {
                    console.warn("Could not delete category image from storage (it might not exist or the URL is malformed):", err);
                }
            }
        }

        // 2. Remove this category's association from any products
        // Query products that have this category ID
        const productsWithCategoryQuery = query(collection(db, "products"), where("category", "==", categoryData.slug || categoryId)); // Use slug or ID for consistency
        const productsSnapshot = await getDocs(productsWithCategoryQuery);

        const productUpdatePromises = [];
        productsSnapshot.forEach(productDoc => {
            // Update product to remove the category reference
            productUpdatePromises.push(updateDoc(doc(db, "products", productDoc.id), {
                category: null // Set category to null or an empty string, or even delete the field
            }).catch(e => console.error(`Failed to update product ${productDoc.id} after category deletion:`, e)));
        });
        await Promise.all(productUpdatePromises);
        console.log(`Removed category association from ${productsSnapshot.docs.length} products.`);


        // 3. Delete the category document itself
        await deleteDoc(categoryDocRef);
        categorySubmitSuccess.textContent = "Category deleted successfully!";
        await loadCategories(); // Reload the list

        // Call a function to update the product category dropdowns if it exists globally
        if (window.populateProductDropdowns) {
            window.populateProductDropdowns();
        }

    } catch (error) {
        console.error("Error deleting category:", error);
        categorySubmitError.textContent = "Error deleting category: " + error.message;
    }
}

/**
 * Clears the category form fields and resets it to "Add Category" mode.
 */
export function clearCategoryForm() {
    editingCategoryId = null;
    editingCategoryImageUrl = null; // Clear image URL state
    categoryFormTitle.textContent = "Add Category";
    addCategoryBtn.textContent = "Add Category";
    cancelEditCategoryBtn.style.display = "none";

    categoryDisplayNameInput.value = "";
    categorySlugInput.value = "";
    categoryImageInput.value = ""; // Clear file input
    currentCategoryImageDiv.innerHTML = ''; // Clear image preview
    categorySubmitSuccess.textContent = "";
    categorySubmitError.textContent = "";
}

/**
 * Sets up event listeners for the category form.
 */
export function setupCategoryForm() {
    if (addCategoryBtn) addCategoryBtn.addEventListener("click", handleCategoryFormSubmit);
    if (cancelEditCategoryBtn) cancelEditCategoryBtn.addEventListener("click", clearCategoryForm);
}

/**
 * Fetches all categories. Used by other modules (e.g., products) to populate dropdowns.
 * @returns {Array<Object>} An array of category objects.
 */
export async function getCategoriesForDropdown() {
    try {
        // Order by displayName for consistent dropdown ordering
        const q = query(collection(db, "categories"), orderBy("displayName"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching categories for dropdown:", error);
        return [];
    }
}