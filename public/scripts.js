// --- Imports from Firebase and other libraries ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getFirestore,
    collection,
    getDocs,
    doc,
    getDoc,
    query,
    setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// --- Firebase Configuration and Initialization ---
const firebaseConfig = {
  apiKey: "AIzaSyDDDYmHs-EVYN6UN81bAboxL83VXqkn8-w",
  authDomain: "arts-and-crafts-sa.firebaseapp.com",
  projectId: "arts-and-crafts-sa",
  storageBucket: "arts-and-crafts-sa.firebasestorage.app",
  messagingSenderId: "858459639939",
  appId: "1:858459639939:web:a9f8820283f0b71de60bb6",
  measurementId: "G-JCJEJ30Q80"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);


// --- UI Element References ---
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const errorMessageDisplay = document.getElementById('error-message');

// Get the new dropdown elements
const dropdownLoginLink = document.getElementById('dropdown-login-link');
const dropdownSignupLink = document.getElementById('dropdown-signup-link');
const dropdownMyAccountLink = document.getElementById('dropdown-my-account-link');
const dropdownLogoutButton = document.getElementById('dropdown-logout-button');
const dropdownDivider = document.getElementById('dropdown-divider');

// UI elements for the my-account page
const userNameDisplay = document.getElementById('user-name');
const userEmailDisplay = document.getElementById('user-email');
const logoutButton = document.getElementById('logout-button');


// --- Tab Switching Logic ---
window.openForm = function(evt, formName) {
    // Check if the tab elements exist on the current page
    const tabcontent = document.getElementsByClassName("tabcontent");
    const tablinks = document.getElementsByClassName("tablinks");

    if (tabcontent.length > 0 && tablinks.length > 0) {
        var i;
        for (i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
        }
        for (i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(" active", "");
        }
        document.getElementById(formName).style.display = "block";
        if (evt) {
            evt.currentTarget.className += " active";
        }
    } else {
        // Fallback: If elements don't exist, navigate to the login page with a parameter
        window.location.href = `user-login.html?form=${formName.toLowerCase()}`;
    }
};


// --- Helper Functions for UI and Error Handling ---
const displayError = (message) => {
    if (errorMessageDisplay) {
        errorMessageDisplay.textContent = message;
        errorMessageDisplay.style.display = 'block';
    }
};

const clearError = () => {
    if (errorMessageDisplay) {
        errorMessageDisplay.textContent = '';
        errorMessageDisplay.style.display = 'none';
    }
};


// --- Authentication State Listener (Core of Dynamic Navbar) ---
onAuthStateChanged(auth, (user) => {
    // Logic for the entire site (hiding/showing navbar links)
    if (user) {
        if (dropdownLoginLink) dropdownLoginLink.classList.add('d-none');
        if (dropdownSignupLink) dropdownSignupLink.classList.add('d-none');
        if (dropdownMyAccountLink) dropdownMyAccountLink.classList.remove('d-none');
        if (dropdownLogoutButton) dropdownLogoutButton.classList.remove('d-none');
        if (dropdownDivider) dropdownDivider.classList.remove('d-none');
    } else {
        if (dropdownLoginLink) dropdownLoginLink.classList.remove('d-none');
        if (dropdownSignupLink) dropdownSignupLink.classList.remove('d-none');
        if (dropdownMyAccountLink) dropdownMyAccountLink.classList.add('d-none');
        if (dropdownLogoutButton) dropdownLogoutButton.classList.add('d-none');
        if (dropdownDivider) dropdownDivider.classList.add('d-none');
    }

    // Logic specifically for the my-account page
    const pathname = window.location.pathname;
    if (pathname.endsWith('my-account.html')) {
        if (user) {
            if (userNameDisplay && user.displayName) {
                userNameDisplay.textContent = user.displayName;
            }
            if (userEmailDisplay && user.email) {
                userEmailDisplay.textContent = user.email;
            }
        } else {
            // User is signed out, redirect to login page
            window.location.href = 'user-login.html';
        }
    }
});


// --- Logout Logic ---
if (dropdownLogoutButton) {
    dropdownLogoutButton.addEventListener('click', (e) => {
        e.preventDefault();
        signOut(auth).then(() => {
            window.location.href = "index.html";
        }).catch((error) => {
            console.error("Logout error:", error);
        });
    });
}

if (logoutButton) {
    logoutButton.addEventListener('click', (e) => {
        e.preventDefault();
        signOut(auth).then(() => {
            window.location.href = "index.html";
        }).catch((error) => {
            console.error("Logout error:", error);
        });
    });
}


// --- Form Submission Logic ---
if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        clearError();
        const name = signupForm['signup-name'].value;
        const email = signupForm['signup-email'].value;
        const password = signupForm['signup-password'].value;
        const confirmPassword = signupForm['signup-confirm-password'].value;

        if (password !== confirmPassword) {
            displayError("Passwords do not match.");
            return;
        }

        createUserWithEmailAndPassword(auth, email, password)
            .then(async (userCredential) => {
                const user = userCredential.user;
                await updateProfile(user, { displayName: name });
                await setDoc(doc(db, "users", user.uid), {
                    name: name,
                    email: email,
                    createdAt: new Date()
                });
                window.location.href = "my-account.html";
            })
            .catch((error) => {
                displayError(error.message);
            });
    });
}

if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        clearError();

        const email = loginForm['login-email'].value;
        const password = loginForm['login-password'].value;

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                console.log("User logged in:", user);
                // Redirect user to account page (or homepage if you prefer)
                window.location.href = "my-account.html"; 
            })
            .catch((error) => {
                console.error("Login Error:", error.code, error.message);
                displayError(error.message);
            });
    });
}

// Global variable to store the phone input instance
let iti;

// All code that needs to run after the DOM is ready
document.addEventListener("DOMContentLoaded", function () {
    // Initialize EmailJS
    emailjs.init("tR2FJfdpRvtSQ3bdC");

    // International telephone input
    const input = document.querySelector("#full-phone");
    if (input) {
        iti = window.intlTelInput(input, {
            utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@18.1.1/build/js/utils.js",
        });
    }

    // Update totals when shipping option changes
    const shippingElement = document.getElementById('shipping');
    if (shippingElement) {
        shippingElement.addEventListener('change', updateCartTotals);
    }

    // The main checkout form submission logic
    const checkoutForm = document.querySelector(".checkout-form");
    if (checkoutForm) {
        checkoutForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const cartItems = [];
            document.querySelectorAll(".cart-item").forEach(item => {
                const title = item.querySelector(".item-title").textContent;
                const price = item.querySelector(".item-price").textContent;
                const qty = item.querySelector(".qty-input").value;
                cartItems.push(`${qty} x ${title} @ ${price}`);
            });

            const form = e.target;
            const firstName = form.querySelector("input[placeholder='John']").value;
            const lastName = form.querySelector("input[placeholder='Doe']").value;
            const email = form.querySelector("input[type='email']").value;
            const phone = iti ? iti.getNumber() : '';
            const country = form.querySelector("input[placeholder='South Africa']").value;
            const city = form.querySelector("input[placeholder='Cape Town']").value;
            const state = form.querySelector("input[placeholder='Western Cape']").value;
            const postalCode = form.querySelector("input[placeholder='8001']").value;
            const address1 = form.querySelector("input[placeholder='123 Long Street']").value;
            const address2 = form.querySelector("input[placeholder='Apartment, suite, etc.']").value;
            const notes = form.querySelector("textarea").value;
            const shippingOption = document.getElementById("shipping");
            const shippingCost = parseInt(shippingOption.selectedOptions[0].dataset.price);
            const subtotal = parseFloat(document.getElementById("subtotal").textContent.replace(/[^0-9.]/g, ''));
            const total = subtotal + shippingCost;
            const orderId = "ORDER-" + Date.now();

            const templateParams = {
                orderId,
                firstName,
                lastName,
                email,
                phone,
                country,
                city,
                state,
                postalCode,
                address1,
                address2,
                notes,
                cartItems: cartItems.join("\n"),
                subtotal: subtotal.toFixed(2),
                shipping: shippingCost.toFixed(2),
                total: total.toFixed(2),
                timestamp: new Date().toISOString()
            };

            try {
                // Save the order to a 'orders' collection in Firestore
                await setDoc(doc(db, "orders", orderId), templateParams);
                // Send the order confirmation email to the customer
                await emailjs.send("service_pov3btk", "template_3c2942s", templateParams);
                // Send the order notification email to the owner
                await emailjs.send("service_pov3btk", "template_9fqdmwl", templateParams);
                alert("Order placed successfully! A confirmation email has been sent.");
                form.reset();
                localStorage.removeItem('shoppingCart');
                updateCartCount();
                window.location.href = 'index.html'; // Redirect to homepage
            } catch (err) {
                console.error("Error processing order:", err);
                alert("Sorry, we couldn't complete the order. Please try again.");
            }
        });
    }

    // Conditional page-specific initializations
    const path = window.location.pathname;
    if (path.endsWith("product-details.html")) {
        loadProductDetails();
    } else if (path.endsWith("artist-details.html")) {
        loadArtistDetails();
    } else if (path.endsWith("products.html")) {
        initStorePage();
    } else if (path.endsWith("index.html") || path === "/") {
        initHomePage();
        populateShopDropdown();
    } else if (path.endsWith("cart-and-checkout.html")) {
        initCartPage();
    }

    // This must be outside the conditional logic to show the cart count on every page.
    updateCartCount();
});

// A new function to update the cart summary without re-rendering the whole page
function updateCartTotals() {
    let subtotal = 0;
    const updatedCart = [];

    document.querySelectorAll(".cart-item").forEach(item => {
        const itemId = item.dataset.id;
        const priceElement = item.querySelector(".item-price");
        const qtyInput = item.querySelector(".qty-input");

        if (priceElement && qtyInput) {
            const price = parseFloat(priceElement.textContent.replace(/[^0-9.]/g, ''));
            const qty = parseInt(qtyInput.value);
            subtotal += price * qty;

            updatedCart.push({
                id: itemId,
                name: item.querySelector(".item-title").textContent,
                price: price,
                image: item.querySelector("img").src,
                details: item.querySelector(".item-sub").textContent,
                quantity: qty
            });
        }
    });

    localStorage.setItem('shoppingCart', JSON.stringify(updatedCart));
    document.getElementById("subtotal").textContent = `R${subtotal.toFixed(2)}`;

    const checkoutSummarySubtotal = document.querySelector('.checkout-summary .checkout-row:first-child span:last-child');
    if (checkoutSummarySubtotal) {
        checkoutSummarySubtotal.textContent = `R${subtotal.toFixed(2)}`;
    }

    const shippingSelect = document.getElementById("shipping");
    let shippingCost = 0;
    if (shippingSelect) {
        shippingCost = parseInt(shippingSelect.selectedOptions[0].dataset.price);
        document.getElementById("shipping-price").textContent = `R${shippingCost.toFixed(2)}`;
    }

    const totalElement = document.getElementById("total-price");
    if (totalElement) {
        totalElement.textContent = `R${(subtotal + shippingCost).toFixed(2)}`;
    }
    
    updateCartCount();
}

// Global cart helper functions
function getCart() {
    return JSON.parse(localStorage.getItem('shoppingCart')) || [];
}

function addToCart(productToAdd, id) {
    const cart = getCart();
    const existingProductIndex = cart.findIndex(item => item.id === id);

    if (existingProductIndex > -1) {
        cart[existingProductIndex].quantity += 1;
    } else {
        const cartItem = {
            id: id,
            name: productToAdd.name,
            price: productToAdd.priceZar,
            image: productToAdd.mainImage,
            details: productToAdd.description ?
                productToAdd.description.split('\n')[0] : 'No details',
            quantity: 1
        };
        cart.push(cartItem);
    }
    localStorage.setItem('shoppingCart', JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    const cart = getCart();
    const count = cart.reduce((total, item) => total + item.quantity, 0);

    const cartIcons = document.querySelectorAll('.cart-icon');
    cartIcons.forEach(iconLink => {
        let countBadge = iconLink.querySelector('.cart-count');

        if (count > 0) {
            if (!countBadge) {
                countBadge = document.createElement('span');
                countBadge.classList.add(
                    'cart-count',
                    'position-absolute',
                    'top-0',
                    'start-100',
                    'translate-middle',
                    'badge',
                    'rounded-pill',
                    'bg-danger'
                );
                iconLink.appendChild(countBadge);
            }
            countBadge.textContent = count;
        } else {
            if (countBadge) {
                countBadge.remove();
            }
        }
    });
}

function initCartPage() {
    const cart = getCart();
    const cartWrapper = document.querySelector('.cart-left');

    if (!cartWrapper) {
        console.error("Cart wrapper not found. Is this the cart page?");
        return;
    }

    // Clear existing dynamic items
    const dynamicItems = cartWrapper.querySelectorAll('.cart-item');
    dynamicItems.forEach(item => item.remove());

    if (cart.length === 0) {
        cartWrapper.innerHTML = '<h2 class="cart-title">My Cart</h2><p>Your cart is empty.</p>';
        const cartRight = document.querySelector('.cart-right');
        if (cartRight) {
            cartRight.style.display = 'none';
        }
        return;
    }

    // Add dynamic items
    const updateCartContainer = document.querySelector('.update-cart-container');
    if (updateCartContainer) {
        cart.forEach(item => {
            const cartItemHTML = `
                <div class="cart-item" data-id="${item.id}">
                    <img src="${item.image}" alt="${item.name}" style="width: 70px; height: 70px; object-fit: cover;"/>
                    <div class="item-details">
                        <p class="item-title">${item.name}</p>
                        <p class="item-sub">${item.details}</p>
                    </div>
                    <input type="number" value="${item.quantity}" class="qty-input" min="1" />
                    <p class="item-price">R${item.price.toFixed(2)}</p>
                    <div class="remove-item"><i class="fa-solid fa-trash-can"></i></div>
                </div>
            `;
            updateCartContainer.insertAdjacentHTML('beforebegin', cartItemHTML);
        });
    }

    // Attach event listeners after items are added
    document.querySelectorAll(".remove-item").forEach(btn => {
        btn.addEventListener("click", function () {
            const itemId = this.closest(".cart-item").dataset.id;
            let currentCart = getCart().filter(item => item.id !== itemId);
            localStorage.setItem('shoppingCart', JSON.stringify(currentCart));
            
            this.closest(".cart-item").remove();
            
            if (currentCart.length === 0) {
                initCartPage(); 
            } else {
                updateCartTotals();
            }
        });
    });

    const updateCartBtn = document.querySelector(".update-cart-btn");
    if (updateCartBtn) {
        updateCartBtn.addEventListener("click", updateCartTotals);
    }
    
    document.querySelectorAll(".qty-input").forEach(input => {
        input.addEventListener("change", updateCartTotals);
    });
    
    updateCartTotals();
}

async function loadProductDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get("id");
    if (!productId) {
        console.error("No product ID found in URL for product details page.");
        return;
    }

    try {
        const artistsSnapshot = await getDocs(collection(db, "artists"));
        const artistsMap = {};
        artistsSnapshot.forEach(doc => {
            artistsMap[doc.id] = doc.data().name || "Unknown Artist";
        });
        const productRef = doc(db, "products", productId);
        const productSnap = await getDoc(productRef);
        if (!productSnap.exists()) {
            console.error("Product not found with ID:", productId);
            document.querySelector(".product-details-heading").textContent = "Product Not Found";
            document.querySelector("#product-details-artist-name").textContent = "";
            document.querySelector(".product-details-list").innerHTML = "<li>This product could not be loaded.</li>";
            document.querySelector(".product-images-gallery").innerHTML = '<img class="main-product-image" src="https://via.placeholder.com/400?text=Product+Not+Found" alt="Product not found">';
            return;
        }

        const product = productSnap.data();
        const titleEl = document.querySelector(".product-details-heading");
        if (titleEl) titleEl.textContent = product.name || "Unnamed Product";

        const artistNameEl = document.getElementById("product-details-artist-name");
        if (artistNameEl) {
            const artistId = product.artistId;
            const artistName = artistsMap[artistId] || "Unknown Artist";
            artistNameEl.textContent = artistName;
            artistNameEl.href = `artist-details.html?id=${artistId}`;
        }

        const detailsListEl = document.querySelector(".product-details-list");
        if (detailsListEl) {
            detailsListEl.innerHTML = "";
            const detailLines = (product.description || "").split("\n").filter(line => line.trim() !== "");
            detailLines.forEach(line => {
                const li = document.createElement("li");
                li.textContent = line;
                detailsListEl.appendChild(li);
            });
        }

        const priceEls = document.querySelectorAll(".price-stock-info");
        if (priceEls.length >= 2) {
            priceEls[0].textContent = `Price: R${product.priceZar || "N/A"} excluding delivery`;
            const stockValue = product.stock !== undefined ?
                product.stock :
                (product.quantity !== undefined ? product.quantity : 0);
            priceEls[1].textContent = stockValue > 0 ? `In Stock` : `Out of Stock`;
        }

        const galleryContainer = document.querySelector(".product-images-gallery");
        if (galleryContainer && product.mainImage) {
            galleryContainer.innerHTML = "";
            const mainImage = document.createElement("img");
            mainImage.className = "main-product-image";
            mainImage.src = product.mainImage;
            mainImage.alt = product.name || "Product image";
            galleryContainer.appendChild(mainImage);
            const thumbsWrapper = document.createElement("div");
            thumbsWrapper.className = "thumbnail-row";

            const thumb = document.createElement("img");
            thumb.className = "thumbnail active";
            thumb.src = product.mainImage;
            thumb.alt = `${product.name} thumbnail`;
            thumb.dataset.full = product.mainImage;

            thumb.addEventListener("click", () => {
                mainImage.classList.add("fade-out");
                setTimeout(() => {
                    mainImage.src = thumb.dataset.full;
                    mainImage.classList.remove("fade-out");
                    mainImage.classList.add("fade-in");
                    setTimeout(() => mainImage.classList.remove("fade-in"), 150);
                }, 150);
            });
            thumbsWrapper.appendChild(thumb);
            galleryContainer.appendChild(thumbsWrapper);
        }

        const addToCartBtn = document.querySelector('.add-to-cart-btn');
        if (addToCartBtn) {
            const stockValue = product.stock !== undefined ?
                product.stock :
                (product.quantity !== undefined ? product.quantity : 0);
            if (stockValue > 0) {
                addToCartBtn.addEventListener('click', () => {
                    addToCart(product, productId);
                    addToCartBtn.textContent = 'ADDED!';
                    addToCartBtn.disabled = true;
                    setTimeout(() => {
                        addToCartBtn.textContent = 'ADD TO CART';
                        addToCartBtn.disabled = false;
                    }, 2000);
                    updateCartCount();
                });
            } else {
                addToCartBtn.textContent = 'OUT OF STOCK';
                addToCartBtn.disabled = true;
            }
        }

    } catch (err) {
        console.error("Error loading product details:", err);
        document.querySelector(".product-details-heading").textContent = "Error Loading Product";
        document.querySelector(".product-details-list").innerHTML = "<li>An error occurred while loading product information. Please try again later.</li>";
    }
}

async function loadArtistDetails() {
    console.log("loadArtistDetails function started.");
    const urlParams = new URLSearchParams(window.location.search);
    const artistId = urlParams.get("id");

    console.log("Artist ID from URL:", artistId);
    if (!artistId) {
        console.error("No artist ID found in URL for artist details page.");
        document.querySelector('.artist-header h1').textContent = "Artist Not Found";
        document.querySelector('.artist-header h2').textContent = "";
        document.querySelector('.artist-bio').textContent = "Please ensure you have a valid artist ID in the URL (e.g., artist-details.html?id=YOUR_ARTIST_ID).";
        const artistImageEl = document.getElementById("artist-profile-image");
        if (artistImageEl) artistImageEl.src = "https://via.placeholder.com/300?text=No+Artist+ID";
        document.querySelector('.social-icons').innerHTML = '';
        return;
    }

    try {
        console.log(`Attempting to fetch artist with ID: ${artistId}`);
        const artistRef = doc(db, "artists", artistId);
        const artistSnap = await getDoc(artistRef);

        console.log("Artist Snapshot exists:", artistSnap.exists());
        if (!artistSnap.exists()) {
            console.error(`Artist with ID ${artistId} not found in Firestore.`);
            document.querySelector('.artist-header h1').textContent = "Artist Not Found";
            document.querySelector('.artist-header h2').textContent = "";
            document.querySelector('.artist-bio').textContent = `The artist with ID "${artistId}" does not exist or their profile is not available.`;
            const artistImageEl = document.getElementById("artist-profile-image");
            if (artistImageEl) artistImageEl.src = "https://via.placeholder.com/300?text=Artist+Not+Found";
            document.querySelector('.social-icons').innerHTML = '';
            return;
        }

        const artistData = artistSnap.data();
        console.log("Artist Data fetched:", artistData);

        const artistNameH1 = document.querySelector('.artist-header h1');
        if (artistNameH1) artistNameH1.textContent = artistData.name || "Unknown Artist";
        console.log("Artist Name Set:", artistNameH1 ? artistNameH1.textContent : "Not found");

        const artistHeaderH2 = document.querySelector('.artist-header h2');
        if (artistHeaderH2) artistHeaderH2.textContent = "Meet the Artist";

        const artistBioP = document.querySelector('.artist-bio');
        if (artistBioP) artistBioP.textContent = artistData.bio ||
            "No biography available for this artist.";
        console.log("Artist Bio Set:", artistBioP ? artistBioP.textContent.substring(0, 50) + "..." : "Not found");
        const artistImage = document.getElementById('artist-profile-image');
        if (artistImage) {
            artistImage.src = artistData.profileImage ||
                "https://via.placeholder.com/300?text=No+Profile+Image";
        }
        console.log("Artist Image Source Set to:", artistImage ? artistImage.src : "Not found");
        const socialIconsContainer = document.querySelector('.social-icons');
        console.log("Social Icons Container:", socialIconsContainer);

        if (socialIconsContainer) {
            const socialIconElements = socialIconsContainer.querySelectorAll('.social-icon');
            console.log("Found social icon elements (NodeList):", socialIconElements);

            socialIconElements.forEach(iconElement => {
                const dataLink = iconElement.dataset.link;
                console.log(`Processing icon with data-link: ${dataLink}`);

                if (dataLink && artistData.socials && artistData.socials[dataLink]) {
                    iconElement.href = (dataLink === "email") ? `mailto:${artistData.socials[dataLink]}` : artistData.socials[dataLink];
                    iconElement.classList.remove('hidden');
                    console.log(`-> Showing icon: ${dataLink}. Link set to: ${iconElement.href}. ClassList after remove:`, iconElement.classList.contains('hidden'));
                } else {
                    iconElement.classList.add('hidden');
                    console.log(`-> Hiding icon: ${dataLink}. ClassList after add:`, iconElement.classList.contains('hidden'));
                }
            });
        }

    } catch (err) {
        console.error("Error loading artist details:", err);
        document.querySelector('.artist-header h1').textContent = "Error Loading Artist";
        document.querySelector('.artist-header h2').textContent = "";
        document.querySelector('.artist-bio').textContent = "An unexpected error occurred while loading artist information. Please try again later.";
        const artistImageEl = document.getElementById("artist-profile-image");
        if (artistImageEl) artistImageEl.src = "https://via.placeholder.com/300?text=Error";
        document.querySelector('.social-icons').innerHTML = '';
    }
}

async function initHomePage() {
    const carouselGrid = document.querySelector('.carousel-grid');
    if (!carouselGrid) {
        console.warn("Carousel grid not found on homepage.");
        return;
    }

    let categories = [];
    let currentPage = 0;
    const cardsPerPage = 4;
    try {
        const categoriesSnapshot = await getDocs(collection(db, "categories"));
        categories = categoriesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        renderCategoryPage();

        // Get all button elements (main and small)
        const prevBtns = [
            document.getElementById('prevCategory'),
            document.getElementById('prevCategorySmall')
        ].filter(Boolean); // Filter out null elements

        const nextBtns = [
            document.getElementById('nextCategory'),
            document.getElementById('nextCategorySmall')
        ].filter(Boolean);
        // Add event listeners to all prev buttons
        prevBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (currentPage > 0) {
                    currentPage--;
                    renderCategoryPage();
                }
            });
        });
        // Add event listeners to all next buttons
        nextBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const maxPage = Math.ceil(categories.length / cardsPerPage) - 1;
                if (currentPage < maxPage) {
                    currentPage++;
                    renderCategoryPage();
                }
            });
        });
        function renderCategoryPage() {
            carouselGrid.innerHTML = "";
            const start = currentPage * cardsPerPage;
            const end = start + cardsPerPage;
            const visibleCategories = categories.slice(start, end);
            visibleCategories.forEach(category => {
                const categorySlug = category.slug || category.id;
                const categoryDisplayName = category.displayName || categorySlug;
                const categoryImage = category.image || 'images/placeholder-category.png';

                const card = document.createElement("a");
                card.href = `products.html?category=${categorySlug.toLowerCase()}`;
                card.className = "category-item";

                card.innerHTML = `
                    <div class="product-card">
                    <img class="product-image" src="${categoryImage}" alt="${categoryDisplayName}" loading="lazy">
                    <p class="category-name">${categoryDisplayName}</p>
                    <div/>
                `;
                carouselGrid.appendChild(card);
            });
            updateCategoryArrows();
        }

        function updateCategoryArrows() {
            const maxPage = Math.ceil(categories.length / cardsPerPage) - 1;
            const allPrevBtns = [
                document.getElementById('prevCategory'),
                document.getElementById('prevCategorySmall')
            ].filter(Boolean);
            const allNextBtns = [
                document.getElementById('nextCategory'),
                document.getElementById('nextCategorySmall')
            ].filter(Boolean);
            allPrevBtns.forEach(btn => {
                btn.style.opacity = currentPage === 0 ? '0.5' : '1';
                btn.style.cursor = currentPage === 0 ? 'not-allowed' : 'pointer';
            });
            allNextBtns.forEach(btn => {
                btn.style.opacity = currentPage === maxPage ? '0.5' : '1';
                btn.style.cursor = currentPage === maxPage ? 'not-allowed' : 'pointer';
            });
        }

    } catch (error) {
        console.error("Error loading homepage categories from Firestore:", error);
        carouselGrid.innerHTML = '<p>Error loading categories. Please try again later.</p>';
    }
}

async function populateShopDropdown() {
    const dropdownMenu = document.querySelector(".navbar-nav .dropdown-menu");
    if (!dropdownMenu) {
        console.warn("Shop dropdown menu not found.");
        return;
    }

    const allProductsLi = dropdownMenu.querySelector('li > a[href="products.html"]')?.parentElement;
    const hrLi = dropdownMenu.querySelector('li > hr.dropdown-divider')?.parentElement;
    let currentItem = dropdownMenu.firstElementChild;
    while (currentItem) {
        if (currentItem !== allProductsLi && currentItem !== hrLi && !currentItem.querySelector('hr.dropdown-divider')) {
            const nextItem = currentItem.nextElementSibling;
            dropdownMenu.removeChild(currentItem);
            currentItem = nextItem;
        } else {
            currentItem = currentItem.nextElementSibling;
        }
    }

    try {
        const categoriesCollectionRef = collection(db, "categories");
        const q = query(categoriesCollectionRef);
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.warn("No categories found to populate shop dropdown.");
            return;
        }

        const fragment = document.createDocumentFragment();
        snapshot.forEach(docSnap => {
            const category = docSnap.data();
            const categorySlug = category.slug || docSnap.id;
            const categoryDisplayName = category.displayName || category.slug || "Unnamed Category";

            const li = document.createElement("li");
            const a = document.createElement("a");
            a.classList.add("dropdown-item");
            a.href = `products.html?category=${categorySlug.toLowerCase()}`;
            a.textContent = categoryDisplayName;
            li.appendChild(a);
            fragment.appendChild(li);
        });

        if (hrLi) {
            dropdownMenu.insertBefore(fragment, hrLi);
        } else if (allProductsLi) {
            dropdownMenu.insertBefore(fragment, allProductsLi);
        } else {
            dropdownMenu.appendChild(fragment);
        }

    } catch (error) {
        console.error("Error populating shop dropdown from Firestore:", error);
    }
}

function initCarouselLogic() {
    const carouselGrid = document.querySelector('.carousel-grid');
    if (!carouselGrid) return;

    const prevButtons = [
        document.getElementById('prevCategory'),
        document.getElementById('prevCategorySmall')
    ].filter(Boolean);
    const nextButtons = [
        document.getElementById('nextCategory'),
        document.getElementById('nextCategorySmall')
    ].filter(Boolean);
    const scrollAmount = 300;

    const updateCarouselButtons = () => {
        prevButtons.forEach(btn => {
            btn.style.opacity = carouselGrid.scrollLeft === 0 ? '0.5' : '1';
            btn.style.cursor = carouselGrid.scrollLeft === 0 ? 'not-allowed' : 'pointer';
        });
        nextButtons.forEach(btn => {
            const isAtEnd = Math.round(carouselGrid.scrollLeft + carouselGrid.clientWidth) >= carouselGrid.scrollWidth;
            btn.style.opacity = isAtEnd ? '0.5' : '1';
            btn.style.cursor = isAtEnd ? 'not-allowed' : 'pointer';
        });
    };

    nextButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            carouselGrid.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });
    });
    prevButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            carouselGrid.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        });
    });
    carouselGrid.addEventListener('scroll', updateCarouselButtons);
    setTimeout(updateCarouselButtons, 100);
}

async function initStorePage() {
    const productCards = document.querySelectorAll('.product-card');
    const prevButtons = [
        document.getElementById('prevCategory'),
        document.getElementById('prevCategorySmall')
    ].filter(Boolean);
    const nextButtons = [
        document.getElementById('nextCategory'),
        document.getElementById('nextCategorySmall')
    ].filter(Boolean);
    const cardsToShow = 4;
    let currentCarouselPage = 0;
    const totalCarouselPages = Math.ceil(productCards.length / cardsToShow);
    function updateCarousel() {
        productCards.forEach(card => card.style.display = 'none');
        const startIndex = currentCarouselPage * cardsToShow;
        const endIndex = startIndex + cardsToShow;
        for (let i = startIndex; i < endIndex && i < productCards.length; i++) {
            productCards[i].style.display = 'inline-block';
        }

        prevButtons.forEach(btn => {
            btn.style.opacity = currentCarouselPage === 0 ? '0.5' : '1';
            btn.style.cursor = currentCarouselPage === 0 ? 'not-allowed' : 'pointer';
        });
        nextButtons.forEach(btn => {
            btn.style.opacity = currentCarouselPage === totalCarouselPages - 1 ? '0.5' : '1';
            btn.style.cursor = currentCarouselPage === totalCarouselPages - 1 ? 'not-allowed' : 'pointer';
        });
    }

    nextButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentCarouselPage < totalCarouselPages - 1) {
                currentCarouselPage++;
                updateCarousel();
            }
        });
    });
    prevButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentCarouselPage > 0) {
                currentCarouselPage--;
                updateCarousel();
            }
        });
    });

    updateCarousel();
    window.addEventListener('resize', updateCarousel);
    const grid = document.getElementById("productsGrid");
    const paginationContainer = document.getElementById("paginationControls");

    const categoryFilter = document.getElementById('categoryFilter');
    const artistFilter = document.getElementById('artistFilter');
    const sortOptions = document.getElementById('sortOptions');
    const productsPerPage = 16;
    let currentFirestorePage = 1;
    let allProducts = [];

    let artistsMap = {};
    let categoriesSet = new Set();

    async function fetchArtists() {
        const artistSnapshot = await getDocs(collection(db, "artists"));
        artistSnapshot.forEach(doc => {
            const artistData = doc.data();
            artistsMap[doc.id] = artistData.name || "Unknown Artist";
        });
    }

    async function fetchProducts() {
        await fetchArtists();
        const querySnapshot = await getDocs(collection(db, "products"));
        allProducts = querySnapshot.docs.map(doc => {
            return {
                id: doc.id,
                ...doc.data()
            };
        });
        populateFilters();

        const urlParams = new URLSearchParams(window.location.search);
        const initialCategory = urlParams.get('category');
        const initialArtist = urlParams.get('artist');
        if (categoryFilter && initialCategory) {
            categoryFilter.value = initialCategory;
        }
        if (artistFilter && initialArtist) {
            artistFilter.value = initialArtist;
        }

        filterAndRender();
    }

    function populateFilters() {
        if (!categoryFilter || !artistFilter) return;
        categoryFilter.innerHTML = `<option value="">All Categories</option>`;
        artistFilter.innerHTML = `<option value="">All Artists</option>`;

        categoriesSet = new Set(allProducts.map(p => p.category).filter(Boolean));
        categoriesSet.forEach(category => {
            const opt = document.createElement('option');
            opt.value = category;
            opt.textContent = category;
            categoryFilter.appendChild(opt);
        });
        Object.entries(artistsMap).forEach(([id, name]) => {
            const opt = document.createElement('option');
            opt.value = id;
            opt.textContent = name;
            artistFilter.appendChild(opt);
        });
    }

    function filterAndRender() {
        if (!categoryFilter || !artistFilter || !sortOptions) return;
        const selectedCategory = categoryFilter.value;
        const selectedArtistId = artistFilter.value;
        const selectedSort = sortOptions.value;
        let filtered = allProducts.filter(product => {
            const categoryMatch = !selectedCategory || product.category === selectedCategory;
            const artistMatch = !selectedArtistId || product.artistId === selectedArtistId;
            return categoryMatch && artistMatch;
        });
        if (selectedSort === 'name-asc') {
            filtered.sort((a, b) => a.name.localeCompare(b.name));
        } else if (selectedSort === 'name-desc') {
            filtered.sort((a, b) => b.name.localeCompare(b.name));
        } else if (selectedSort === 'price-low-high') {
            filtered.sort((a, b) => (a.priceZar || 0) - (b.priceZar || 0));
        } else if (selectedSort === 'price-high-low') {
            filtered.sort((a, b) => (b.priceZar || 0) - (a.priceZar || 0));
        }

        renderFilteredPage(filtered, 1);
    }

    function renderFilteredPage(products, page) {
        currentFirestorePage = page;
        if (!grid) return;
        grid.innerHTML = "";

        const start = (page - 1) * productsPerPage;
        const end = start + productsPerPage;
        const productsToShow = products.slice(start, end);

        productsToShow.forEach(product => {
            const mainImage = product.mainImage || "placeholder.jpg";
            const artistName = artistsMap[product.artistId] || "Unknown Artist";

            const card = document.createElement("div");
            card.className = "product-card-products-page";
            card.innerHTML = `
                <a href="product-details.html?id=${product.id}" class="product-link">
                    <img class="product-image-products-page" src="${mainImage}" alt="${product.name}">
                    <p class="item-name">${product.name}</p>
                    <small class="artist-name-product-card">${artistName}</small>
                    <p class="item-price">R${product.priceZar || "N/A"}</p>
                </a>
            `;
            grid.appendChild(card);
        });
        renderFilteredPagination(products);
        updateFilteredChevronState(products);
    }

    function renderFilteredPage(filtered, pageNumber) {
    const start = (pageNumber - 1) * productsPerPage;
    const end = start + productsPerPage;
    const pageItems = filtered.slice(start, end);

    const container = document.getElementById('products-container');
    container.innerHTML = '';

    pageItems.forEach(product => {
        const img = document.createElement('img');

        // Choose image size depending on context
        img.src = product.images?.listing || product.images?.original; 
        img.alt = product.name;

        const div = document.createElement('div');
        div.classList.add('product-card');
        div.appendChild(img);
        div.appendChild(document.createTextNode(product.name));

        container.appendChild(div);
    });
}


    function updateFilteredChevronState(filteredProducts) {
        const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
        const prevFirestoreBtn = document.getElementById('prevCategory');
        const nextFirestoreBtn = document.getElementById('nextCategory');

        if (prevFirestoreBtn) {
            prevFirestoreBtn.style.opacity = currentFirestorePage === 1 ?
                '0.5' : '1';
            prevFirestoreBtn.style.cursor = currentFirestorePage === 1 ? 'not-allowed' : 'pointer';
        }

        if (nextFirestoreBtn) {
            nextFirestoreBtn.style.opacity = currentFirestorePage === totalPages ?
                '0.5' : '1';
            nextFirestoreBtn.style.cursor = currentFirestorePage === totalPages ? 'not-allowed' : 'pointer';
        }
    }

    const prevFirestoreBtn = document.getElementById('prevCategory');
    const nextFirestoreBtn = document.getElementById('nextCategory');

    if (prevFirestoreBtn) {
        prevFirestoreBtn.addEventListener('click', () => {
            if (currentFirestorePage > 1) {
                const selectedCategory = categoryFilter.value;
                const selectedArtistId = artistFilter.value;
                let filtered = allProducts.filter(product => {
                    return (!selectedCategory || product.category === selectedCategory) &&
                        (!selectedArtistId || product.artistId === selectedArtistId);
                });
                renderFilteredPage(filtered, currentFirestorePage - 1);
            }
        });
    }

    if (nextFirestoreBtn) {
        nextFirestoreBtn.addEventListener('click', () => {
            const selectedCategory = categoryFilter.value;
            const selectedArtistId = artistFilter.value;
            let filtered = allProducts.filter(product => {
                return (!selectedCategory || product.category === selectedCategory) &&
                    (!selectedArtistId || product.artistId === selectedArtistId);
            });
            const totalPages = Math.ceil(filtered.length / productsPerPage);

            if (currentFirestorePage < totalPages) {
                renderFilteredPage(filtered, currentFirestorePage + 1);
            }
        });
    }

    if (categoryFilter) categoryFilter.addEventListener('change', filterAndRender);
    if (artistFilter) artistFilter.addEventListener('change', filterAndRender);
    if (sortOptions) sortOptions.addEventListener('change', filterAndRender);
    fetchProducts();
}

        function openCity(evt, cityName) {
            var i, tabcontent, tablinks;
            tabcontent = document.getElementsByClassName("tabcontent");
            for (i = 0; i < tabcontent.length; i++) {
                tabcontent[i].style.display = "none";
            }
            tablinks = document.getElementsByClassName("tablinks");
            for (i = 0; i < tablinks.length; i++) {
                tablinks[i].className = tablinks[i].className.replace(" active", "");
            }
            document.getElementById(cityName).style.display = "block";
            evt.currentTarget.className += " active";
        }

        document.getElementById("defaultOpen").click();
