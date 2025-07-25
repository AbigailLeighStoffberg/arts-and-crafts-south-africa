import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    doc,
    deleteDoc,
    updateDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// Firebase config — ensure your storageBucket matches your actual bucket name
const firebaseConfig = {
    apiKey: "AIzaSyDDDYmHs-EVYN6UN81bAboxL83VXqkn8-w",
    authDomain: "arts-and-crafts-sa.firebaseapp.com",
    projectId: "arts-and-crafts-sa",
    storageBucket: "arts-and-crafts-sa.firebasestorage.app",
    messagingSenderId: "858459639939",
    appId: "1:858459639939:web:a9f8820283f0b71de60bb6",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app, 'gs://arts-and-crafts-sa.firebasestorage.app');

// Global variables for editing state
let editingArtistId = null;
let editingArtistImageUrl = null;
let editingProductId = null;
let editingProductImageUrl = null;

// --- UI Elements ---
const loginBtn = document.getElementById("login-btn");
const loginError = document.getElementById("login-error");
const logoutBtn = document.getElementById("logout-btn");

const loginEmailInput = document.getElementById("email");
const loginPasswordInput = document.getElementById("password");

// Artist Section Elements
const addArtistBtn = document.getElementById("add-artist-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");
const artistFormTitle = document.getElementById("artist-form-title");
const artistNameInput = document.getElementById("artist-name");
const artistEmailInput = document.getElementById("artist-email");
const artistPhoneInput = document.getElementById("artist-phone");
const artistCityInput = document.getElementById("artist-city");
const artistCountryInput = document.getElementById("artist-country");
const artistBioInput = document.getElementById("artist-bio");
const artistShippingCheckbox = document.getElementById("artist-shipping");
const artistImageInput = document.getElementById("artist-image");
const currentArtistImage = document.getElementById("current-artist-image");
const artistFacebookLinkInput = document.getElementById("artist-facebook-link");
const artistInstagramLinkInput = document.getElementById("artist-instagram-link");
const artistTwitterLinkInput = document.getElementById("artist-twitter-link");
const submitSuccessMsg = document.getElementById("submit-success");
const submitErrorMsg = document.getElementById("submit-error");
const artistsList = document.getElementById("artists-list");

// Product Section Elements
const addProductBtn = document.getElementById("add-product-btn");
const cancelEditProductBtn = document.getElementById("cancel-edit-product-btn");
const productFormTitle = document.getElementById("product-form-title");
const productNameInput = document.getElementById("product-name");
const productDescriptionInput = document.getElementById("product-description");
const productCategoryInput = document.getElementById("product-category");
const productArtistIdSelect = document.getElementById("product-artist-id");
const productPriceUSDInput = document.getElementById("product-price-usd");
const productPriceZARInput = document.getElementById("product-price-zar");
const productSKUInput = document.getElementById("product-sku");
const productStockInput = document.getElementById("product-stock");
const productSubmitSuccessMsg = document.getElementById("product-submit-success");
const productSubmitErrorMsg = document.getElementById("product-submit-error");
const productsList = document.getElementById("products-list");

// Product Image Elements
const productMainImageInput = document.getElementById("product-main-image");
const productThumbnailImageInput = document.getElementById("product-thumbnail-image");
const productAdditionalImagesInput = document.getElementById("product-additional-images");
const currentProductMainImage = document.getElementById("current-product-main-image");
const currentProductThumbnailImage = document.getElementById("current-product-thumbnail-image");
const currentProductAdditionalImages = document.getElementById("current-product-additional-images");

// --- UTILITY FUNCTIONS ---
function clearArtistForm() {
    artistNameInput.value = "";
    artistEmailInput.value = "";
    artistPhoneInput.value = "";
    artistCityInput.value = "";
    artistCountryInput.value = "";
    artistBioInput.value = "";
    artistImageInput.value = "";
    artistShippingCheckbox.checked = false;
    currentArtistImage.innerHTML = "";

    artistFacebookLinkInput.value = "";
    artistInstagramLinkInput.value = "";
    artistTwitterLinkInput.value = "";

    addArtistBtn.textContent = "Add Artist";
    addArtistBtn.classList.remove("update-mode");
    cancelEditBtn.style.display = "none";
    artistFormTitle.textContent = "Add Artist";
    editingArtistId = null;
    editingArtistImageUrl = null;

    submitSuccessMsg.textContent = "";
    submitErrorMsg.textContent = "";
}

function clearProductForm() {
    productNameInput.value = "";
    productDescriptionInput.value = "";
    productCategoryInput.value = "";
    productArtistIdSelect.value = "";
    productPriceUSDInput.value = "";
    productPriceZARInput.value = "";
    productSKUInput.value = "";
    productStockInput.value = "";
    productMainImageInput.value = "";
    productThumbnailImageInput.value = "";
    productAdditionalImagesInput.value = "";
    currentProductMainImage.innerHTML = "";
    currentProductThumbnailImage.innerHTML = "";
    currentProductAdditionalImages.innerHTML = "";

    addProductBtn.textContent = "Add Product";
    cancelEditProductBtn.style.display = "none";
    productFormTitle.textContent = "Add Product";
    editingProductId = null;
    editingProductImageUrl = null;

    productSubmitSuccessMsg.textContent = "";
    productSubmitErrorMsg.textContent = "";
}

// --- EVENT LISTENERS ---

// LOGIN HANDLER
loginBtn.addEventListener("click", async () => {
    const email = loginEmailInput.value.trim();
    const password = loginPasswordInput.value.trim();
    loginError.textContent = "";

    if (!email || !password) {
        loginError.textContent = "Please enter email and password.";
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
        loginError.textContent = "Login failed. Check your credentials.";
        console.error(err);
    }
});

// LOGOUT HANDLER
logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
});

// ADD/UPDATE ARTIST HANDLER
addArtistBtn.addEventListener("click", async () => {
    const name = artistNameInput.value.trim();
    const email = artistEmailInput.value.trim();
    const phone = artistPhoneInput.value.trim();
    const city = artistCityInput.value.trim();
    const country = artistCountryInput.value.trim();
    const bio = artistBioInput.value.trim();
    const shippingHandledByArtist = artistShippingCheckbox.checked;
    const imageFile = artistImageInput.files[0];

    const facebookLink = artistFacebookLinkInput.value.trim();
    const instagramLink = artistInstagramLinkInput.value.trim();
    const twitterLink = artistTwitterLinkInput.value.trim();

    submitSuccessMsg.textContent = "";
    submitErrorMsg.textContent = "";

    if (!name || !email) {
        submitErrorMsg.textContent = "Name and email are required.";
        return;
    }

    addArtistBtn.disabled = true;

    try {
        let imageUrl = editingArtistImageUrl;

        if (imageFile) {
            if (editingArtistId && editingArtistImageUrl) {
                try {
                    const url = new URL(editingArtistImageUrl);
                    let path = decodeURIComponent(url.pathname.split('/o/')[1]);
                    const oldImageRef = ref(storage, path.split('?')[0]);
                    await deleteObject(oldImageRef);
                    console.log("Old artist image deleted from storage.");
                } catch (delErr) {
                    console.warn("Could not delete old artist image (might not exist or permission issue):", delErr);
                }
            }

            const safeName = name.replace(/\s+/g, "_").toLowerCase();
            const imageRef = ref(storage, `artists/${safeName}_${Date.now()}_${imageFile.name}`);
            await uploadBytes(imageRef, imageFile);
            imageUrl = await getDownloadURL(imageRef);
        } else if (editingArtistId && !imageFile && !currentArtistImage.querySelector('img')) {
            imageUrl = "";
        }

        const artistSocials = {
            facebook: facebookLink,
            instagram: instagramLink,
            twitter: twitterLink,
        };

        const artistData = {
            name,
            email,
            phone,
            address: { city, country },
            bio,
            profileImage: imageUrl,
            shippingHandledByArtist,
            socials: artistSocials,
            updatedAt: new Date(),
        };

        if (editingArtistId) {
            const artistDocRef = doc(db, "artists", editingArtistId);
            await updateDoc(artistDocRef, artistData);
            submitSuccessMsg.textContent = "Artist updated successfully!";
        } else {
            artistData.createdAt = new Date();
            await addDoc(collection(db, "artists"), artistData);
            submitSuccessMsg.textContent = "Artist added successfully!";
        }

        clearArtistForm();
        loadArtists();
        populateArtistDropdown();
    } catch (err) {
        console.error("Error saving artist:", err);
        submitErrorMsg.textContent = "Failed to save artist.";
    } finally {
        addArtistBtn.disabled = false;
    }
});

// ADD/UPDATE PRODUCT HANDLER
addProductBtn.addEventListener("click", async () => {
    const name = productNameInput.value.trim();
    const description = productDescriptionInput.value.trim();
    const category = productCategoryInput.value.trim();
    const artistId = productArtistIdSelect.value;
    const priceUSD = parseFloat(productPriceUSDInput.value);
    const priceZAR = parseFloat(productPriceZARInput.value);
    const sku = productSKUInput.value.trim();
    const stock = parseInt(productStockInput.value);
    const mainImageFile = productMainImageInput.files[0];
    const thumbnailImageFile = productThumbnailImageInput.files[0];
    const additionalImageFiles = productAdditionalImagesInput.files;

    productSubmitSuccessMsg.textContent = "";
    productSubmitErrorMsg.textContent = "";

    if (!name || !description || !category || !artistId || isNaN(priceUSD) || isNaN(priceZAR) || !sku || isNaN(stock)) {
        productSubmitErrorMsg.textContent = "Please fill in all required product fields (Name, Description, Category, Artist, Prices, SKU, Stock).";
        return;
    }
    if (priceUSD < 0 || priceZAR < 0 || stock < 0) {
        productSubmitErrorMsg.textContent = "Prices and Stock cannot be negative.";
        return;
    }

    addProductBtn.disabled = true;

    try {
        // Handle main image upload
        let mainImageUrl = null;
        if (mainImageFile) {
            const safeName = name.replace(/\s+/g, "_").toLowerCase();
            const imageRef = ref(storage, `products/main_${safeName}_${Date.now()}_${mainImageFile.name}`);
            await uploadBytes(imageRef, mainImageFile);
            mainImageUrl = await getDownloadURL(imageRef);
        }

        // Handle thumbnail image upload
        let thumbnailImageUrl = null;
        if (thumbnailImageFile) {
            const safeName = name.replace(/\s+/g, "_").toLowerCase();
            const imageRef = ref(storage, `products/thumb_${safeName}_${Date.now()}_${thumbnailImageFile.name}`);
            await uploadBytes(imageRef, thumbnailImageFile);
            thumbnailImageUrl = await getDownloadURL(imageRef);
        }

        // Handle additional images upload
        let additionalImageUrls = [];
        if (additionalImageFiles && additionalImageFiles.length > 0) {
            const uploadPromises = Array.from(additionalImageFiles).map(async (file, index) => {
                const safeName = name.replace(/\s+/g, "_").toLowerCase();
                const imageRef = ref(storage, `products/add_${index}_${safeName}_${Date.now()}_${file.name}`);
                await uploadBytes(imageRef, file);
                return await getDownloadURL(imageRef);
            });
            additionalImageUrls = await Promise.all(uploadPromises);
        }

        const productData = {
            name,
            description,
            category,
            artistId,
            priceUSD,
            priceZAR,
            sku,
            stock,
            mainImageUrl,
            thumbnailImageUrl,
            additionalImageUrls,
            updatedAt: new Date(),
        };

        if (editingProductId) {
            const productDocRef = doc(db, "products", editingProductId);
            await updateDoc(productDocRef, productData);
            productSubmitSuccessMsg.textContent = "Product updated successfully!";
        } else {
            productData.createdAt = new Date();
            await addDoc(collection(db, "products"), productData);
            productSubmitSuccessMsg.textContent = "Product added successfully!";
        }

        clearProductForm();
        loadProducts();
    } catch (err) {
        console.error("Error saving product:", err);
        productSubmitErrorMsg.textContent = "Failed to save product.";
    } finally {
        addProductBtn.disabled = false;
    }
});

// Cancel Edit Buttons
cancelEditBtn.addEventListener("click", clearArtistForm);
cancelEditProductBtn.addEventListener("click", clearProductForm);

// --- AUTH STATE CHANGE: Show dashboard or login ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById("login-section").style.display = "none";
        document.getElementById("dashboard-section").style.display = "block";
        showSection("artists");
        loadArtists();
        populateArtistDropdown();
    } else {
        document.getElementById("login-section").style.display = "block";
        document.getElementById("dashboard-section").style.display = "none";
        clearArtistForm();
        clearProductForm();
        loginEmailInput.value = "";
        loginPasswordInput.value = "";
        loginError.textContent = "";
    }
});

// --- SECTION SWITCHING + Active Button Styling ---
window.showSection = (id) => {
    document.querySelectorAll(".admin-section").forEach((sec) => (sec.style.display = "none"));
    const section = document.getElementById(id);
    if (section) section.style.display = "block";

    document.querySelectorAll("nav button").forEach((btn) => {
        const onClick = btn.getAttribute("onclick");
        btn.classList.toggle("active", onClick && onClick.includes(`'${id}'`));
    });

    if (id === 'artists') {
        loadArtists();
    } else if (id === 'products') {
        loadProducts();
        populateArtistDropdown();
    }
};

// --- LOAD ARTISTS LIST FROM FIRESTORE ---
async function loadArtists() {
    if (!artistsList) return;
    artistsList.innerHTML = "Loading...";

    try {
        const q = query(collection(db, "artists"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            artistsList.innerHTML = "<p>No artists found.</p>";
            return;
        }

        let html = "<ul style='list-style:none;padding:0'>";
        querySnapshot.forEach((docSnap) => {
            const artist = docSnap.data();
            const artistId = docSnap.id;

            const socials = artist.socials || {};
            const facebook = socials.facebook ? `<a href="${socials.facebook}" target="_blank">Facebook</a>` : '';
            const instagram = socials.instagram ? `<a href="${socials.instagram}" target="_blank">Instagram</a>` : '';
            const twitter = socials.twitter ? `<a href="${socials.twitter}" target="_blank">Twitter</a>` : '';
            const socialLinksHtml = [facebook, instagram, twitter].filter(Boolean).join(' | ');

            html += `<li style="margin-bottom: 20px; border-bottom:1px solid #eee; padding-bottom:10px;">
                <strong>${artist.name}</strong> (${artist.email})<br/>
                Phone: ${artist.phone || "N/A"}<br/>
                Location: ${artist.address?.city || ""}, ${artist.address?.country || ""}<br/>
                Bio: ${artist.bio || ""}<br/>
                ${socialLinksHtml ? `Socials: ${socialLinksHtml}<br/>` : ''} Shipping handled by artist: ${artist.shippingHandledByArtist ? "Yes" : "No"}<br/>
                ${
                    artist.profileImage
                        ? `<img src="${artist.profileImage}" alt="${artist.name}" width="100" style="margin-top:5px; border-radius: 6px;"/>`
                        : ""
                }
                <div style="margin-top: 10px;">
                    <button class="edit-artist-btn" data-id="${artistId}" data-name="${artist.name}"
                            data-email="${artist.email}" data-phone="${artist.phone || ''}"
                            data-city="${artist.address?.city || ''}" data-country="${artist.address?.country || ''}"
                            data-bio="${artist.bio || ''}" data-shipping="${artist.shippingHandledByArtist}"
                            data-image="${artist.profileImage || ''}"
                            data-socials-facebook="${socials.facebook || ''}"
                            data-socials-instagram="${socials.instagram || ''}"
                            data-socials-twitter="${socials.twitter || ''}"
                            >Edit</button>
                    <button class="delete-artist-btn" data-id="${artistId}" data-image="${artist.profileImage || ''}">Delete</button>
                </div>
            </li>`;
        });
        html += "</ul>";
        artistsList.innerHTML = html;

        document.querySelectorAll(".edit-artist-btn").forEach(button => {
            button.addEventListener("click", (e) => {
                const data = e.target.dataset;
                editArtist(data);
            });
        });
        document.querySelectorAll(".delete-artist-btn").forEach(button => {
            button.addEventListener("click", (e) => {
                const artistId = e.target.dataset.id;
                const imageUrl = e.target.dataset.image;
                const artistName = e.target.closest('li').querySelector('strong').textContent.split('(')[0].trim();
                if (confirm(`Are you sure you want to delete ${artistName} and all their products?`)) {
                    deleteArtist(artistId, imageUrl);
                }
            });
        });

    } catch (err) {
        console.error("Error loading artists:", err);
        artistsList.innerHTML = "<p>Failed to load artists.</p>";
    }
}

// --- Populate Artist Dropdown for Products ---
async function populateArtistDropdown() {
    productArtistIdSelect.innerHTML = '<option value="">-- Select an Artist --</option>';
    try {
        const q = query(collection(db, "artists"), orderBy("name", "asc"));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((docSnap) => {
            const artist = docSnap.data();
            const artistId = docSnap.id;
            const option = document.createElement("option");
            option.value = artistId;
            option.textContent = artist.name;
            productArtistIdSelect.appendChild(option);
        });
    } catch (err) {
        console.error("Error populating artist dropdown:", err);
    }
}

// --- LOAD PRODUCTS LIST FROM FIRESTORE ---
async function loadProducts() {
    if (!productsList) return;
    productsList.innerHTML = "Loading...";

    try {
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            productsList.innerHTML = "<p>No products found.</p>";
            return;
        }

        const artistsSnapshot = await getDocs(collection(db, "artists"));
        const artistsMap = new Map();
        artistsSnapshot.forEach(doc => artistsMap.set(doc.id, doc.data().name));

        let html = "<ul style='list-style:none;padding:0'>";
        querySnapshot.forEach((docSnap) => {
            const product = docSnap.data();
            const productId = docSnap.id;
            const artistName = artistsMap.get(product.artistId) || "Unknown Artist";

            html += `<li style="margin-bottom: 20px; border-bottom:1px solid #eee; padding-bottom:10px;">
                <strong>${product.name}</strong> by ${artistName}<br/>
                Category: ${product.category || "N/A"}<br/>
                Description: ${product.description || ""}<br/>
                Price: $${product.priceUSD?.toFixed(2) || "0.00"} / R${product.priceZAR?.toFixed(2) || "0.00"}<br/>
                SKU: ${product.sku || "N/A"}<br/>
                Stock: ${product.stock || 0}<br/>
                ${
                    product.mainImageUrl
                        ? `<img src="${product.mainImageUrl}" alt="${product.name}" width="100" style="margin-top:5px; border-radius: 6px;"/>`
                        : ""
                }
                <div style="margin-top: 10px;">
                    <button class="edit-product-btn" data-id="${productId}" data-name="${product.name}"
                            data-description="${product.description || ''}" data-category="${product.category || ''}"
                            data-artist-id="${product.artistId || ''}" data-price-usd="${product.priceUSD || 0}"
                            data-price-zar="${product.priceZAR || 0}" data-sku="${product.sku || ''}"
                            data-stock="${product.stock || 0}" data-main-image="${product.mainImageUrl || ''}"
                            data-thumbnail-image="${product.thumbnailImageUrl || ''}"
                            data-additional-images="${JSON.stringify(product.additionalImageUrls || [])}"
                            >Edit</button>
                    <button class="delete-product-btn" data-id="${productId}" 
                            data-main-image="${product.mainImageUrl || ''}"
                            data-thumbnail-image="${product.thumbnailImageUrl || ''}"
                            data-additional-images="${JSON.stringify(product.additionalImageUrls || [])}"
                            >Delete</button>
                </div>
            </li>`;
        });
        html += "</ul>";
        productsList.innerHTML = html;

        document.querySelectorAll(".edit-product-btn").forEach(button => {
            button.addEventListener("click", (e) => {
                const data = e.target.dataset;
                editProduct(data);
            });
        });
        document.querySelectorAll(".delete-product-btn").forEach(button => {
            button.addEventListener("click", (e) => {
                const productId = e.target.dataset.id;
                const mainImageUrl = e.target.dataset.mainImage;
                const thumbnailImageUrl = e.target.dataset.thumbnailImage;
                const additionalImages = JSON.parse(e.target.dataset.additionalImages || "[]");
                const productName = e.target.closest('li').querySelector('strong').textContent.split(' by ')[0].trim();
                if (confirm(`Are you sure you want to delete ${productName}?`)) {
                    deleteProduct(productId, mainImageUrl, thumbnailImageUrl, additionalImages);
                }
            });
        });

    } catch (err) {
        console.error("Error loading products:", err);
        productsList.innerHTML = "<p>Failed to load products.</p>";
    }
}

// --- EDIT ARTIST FUNCTION ---
function editArtist(artistData) {
    editingArtistId = artistData.id;
    editingArtistImageUrl = artistData.image;

    artistNameInput.value = artistData.name;
    artistEmailInput.value = artistData.email;
    artistPhoneInput.value = artistData.phone;
    artistCityInput.value = artistData.city;
    artistCountryInput.value = artistData.country;
    artistBioInput.value = artistData.bio;
    artistShippingCheckbox.checked = (artistData.shipping === 'true');
    artistImageInput.value = "";

    artistFacebookLinkInput.value = artistData.socialsFacebook || "";
    artistInstagramLinkInput.value = artistData.socialsInstagram || "";
    artistTwitterLinkInput.value = artistData.socialsTwitter || "";

    currentArtistImage.innerHTML = artistData.image
        ? `Current Image: <img src="${artistData.image}" width="50" style="vertical-align:middle; border-radius:3px;">
           <button id="clear-image-btn" style="margin-left:5px;">Remove Current Image</button>`
        : "No current image.";

    const clearImageBtn = document.getElementById("clear-image-btn");
    if (clearImageBtn) {
        clearImageBtn.addEventListener("click", () => {
            currentArtistImage.innerHTML = "No current image.";
            editingArtistImageUrl = "";
            artistImageInput.value = "";
        });
    }

    addArtistBtn.textContent = "Update Artist";
    addArtistBtn.classList.add("update-mode");
    cancelEditBtn.style.display = "inline-block";
    artistFormTitle.textContent = "Edit Artist";

    artistNameInput.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// EDIT PRODUCT FUNCTION
function editProduct(productData) {
    editingProductId = productData.id;

    productNameInput.value = productData.name;
    productDescriptionInput.value = productData.description;
    productCategoryInput.value = productData.category;
    productArtistIdSelect.value = productData.artistId;
    productPriceUSDInput.value = parseFloat(productData.priceUsd);
    productPriceZARInput.value = parseFloat(productData.priceZar);
    productSKUInput.value = productData.sku;
    productStockInput.value = parseInt(productData.stock);
    productMainImageInput.value = "";
    productThumbnailImageInput.value = "";
    productAdditionalImagesInput.value = "";

    // Display current images
    currentProductMainImage.innerHTML = productData.mainImage
        ? `Current Main Image: <img src="${productData.mainImage}" width="50" style="vertical-align:middle; border-radius:3px;">
           <button id="clear-main-image-btn" style="margin-left:5px;">Remove</button>`
        : "No current main image.";

    currentProductThumbnailImage.innerHTML = productData.thumbnailImage
        ? `Current Thumbnail: <img src="${productData.thumbnailImage}" width="50" style="vertical-align:middle; border-radius:3px;">
           <button id="clear-thumbnail-btn" style="margin-left:5px;">Remove</button>`
        : "No current thumbnail.";

    const additionalImages = JSON.parse(productData.additionalImages || "[]");
    currentProductAdditionalImages.innerHTML = additionalImages.length > 0
        ? `Additional Images (${additionalImages.length}):<br>` + 
          additionalImages.map((img, index) => 
              `<img src="${img}" width="50" style="margin-right:5px; border-radius:3px;">
               <button class="clear-additional-image-btn" data-index="${index}" style="margin-right:10px;">Remove</button>`
          ).join('')
        : "No additional images.";

    // Set up clear buttons
    const clearMainBtn = document.getElementById("clear-main-image-btn");
    if (clearMainBtn) {
        clearMainBtn.addEventListener("click", () => {
            currentProductMainImage.innerHTML = "No current main image.";
            productData.mainImage = "";
            productMainImageInput.value = "";
        });
    }

    const clearThumbBtn = document.getElementById("clear-thumbnail-btn");
    if (clearThumbBtn) {
        clearThumbBtn.addEventListener("click", () => {
            currentProductThumbnailImage.innerHTML = "No current thumbnail.";
            productData.thumbnailImage = "";
            productThumbnailImageInput.value = "";
        });
    }

    document.querySelectorAll(".clear-additional-image-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const index = parseInt(e.target.dataset.index);
            const images = JSON.parse(productData.additionalImages);
            images.splice(index, 1);
            productData.additionalImages = JSON.stringify(images);
            editProduct(productData); // Refresh the display
        });
    });

    addProductBtn.textContent = "Update Product";
    cancelEditProductBtn.style.display = "inline-block";
    productFormTitle.textContent = "Edit Product";

    productNameInput.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- DELETE ARTIST FUNCTION ---
async function deleteArtist(artistId, imageUrl) {
    try {
        const productsByArtistQuery = query(collection(db, "products"), where("artistId", "==", artistId));
        const productsSnapshot = await getDocs(productsByArtistQuery);

        if (!productsSnapshot.empty) {
            const confirmDeleteProducts = confirm(`This artist has ${productsSnapshot.size} product(s) associated with them. Deleting the artist will also delete all their products. Are you sure you want to proceed?`);
            if (!confirmDeleteProducts) {
                submitErrorMsg.textContent = "Artist deletion cancelled.";
                return;
            }

            const deleteProductPromises = [];
            productsSnapshot.forEach(async (productDoc) => {
                const productData = productDoc.data();
                const productId = productDoc.id;
                const productImageUrl = productData.imageUrl;

                deleteProductPromises.push(deleteDoc(doc(db, "products", productId)));
                if (productImageUrl) {
                    try {
                        const url = new URL(productImageUrl);
                        let path = decodeURIComponent(url.pathname.split('/o/')[1]);
                        const queryParamIndex = path.indexOf('?');
                        if (queryParamIndex !== -1) {
                            path = path.substring(0, queryParamIndex);
                        }
                        const imageRef = ref(storage, path);
                        deleteProductPromises.push(deleteObject(imageRef));
                    } catch (storageErr) {
                        console.warn("Failed to delete product image for artist deletion:", storageErr);
                    }
                }
            });
            await Promise.all(deleteProductPromises);
            console.log(`Deleted ${productsSnapshot.size} products and their images.`);
        }

        await deleteDoc(doc(db, "artists", artistId));
        console.log("Artist document deleted from Firestore.");

        if (imageUrl) {
            try {
                const url = new URL(imageUrl);
                let path = decodeURIComponent(url.pathname.split('/o/')[1]);
                const queryParamIndex = path.indexOf('?');
                if (queryParamIndex !== -1) {
                    path = path.substring(0, queryParamIndex);
                }
                const imageRef = ref(storage, path);
                await deleteObject(imageRef);
                console.log("Artist profile image deleted from Storage.");
            } catch (storageErr) {
                console.warn("Failed to delete artist image from storage (might not exist or URL parsing issue):", storageErr);
            }
        }

        submitSuccessMsg.textContent = "Artist and associated products deleted successfully!";
        loadArtists();
        loadProducts();
        clearArtistForm();
    } catch (err) {
        console.error("Error deleting artist:", err);
        submitErrorMsg.textContent = "Failed to delete artist.";
    }
}

// DELETE PRODUCT FUNCTION
async function deleteProduct(productId, mainImageUrl, thumbnailImageUrl, additionalImageUrls = []) {
    try {
        await deleteDoc(doc(db, "products", productId));

        // Delete all associated images
        const deletePromises = [];

        if (mainImageUrl) {
            try {
                const url = new URL(mainImageUrl);
                let path = decodeURIComponent(url.pathname.split('/o/')[1]);
                path = path.split('?')[0];
                const imageRef = ref(storage, path);
                deletePromises.push(deleteObject(imageRef));
            } catch (err) {
                console.warn("Failed to delete main product image:", err);
            }
        }

        if (thumbnailImageUrl) {
            try {
                const url = new URL(thumbnailImageUrl);
                let path = decodeURIComponent(url.pathname.split('/o/')[1]);
                path = path.split('?')[0];
                const imageRef = ref(storage, path);
                deletePromises.push(deleteObject(imageRef));
            } catch (err) {
                console.warn("Failed to delete thumbnail image:", err);
            }
        }

        additionalImageUrls.forEach(url => {
            try {
                const parsedUrl = new URL(url);
                let path = decodeURIComponent(parsedUrl.pathname.split('/o/')[1]);
                path = path.split('?')[0];
                const imageRef = ref(storage, path);
                deletePromises.push(deleteObject(imageRef));
            } catch (err) {
                console.warn("Failed to delete additional product image:", err);
            }
        });

        await Promise.all(deletePromises);

        productSubmitSuccessMsg.textContent = "Product deleted successfully!";
        loadProducts();
        clearProductForm();
    } catch (err) {
        console.error("Error deleting product:", err);
        productSubmitErrorMsg.textContent = "Failed to delete product.";
    }
}