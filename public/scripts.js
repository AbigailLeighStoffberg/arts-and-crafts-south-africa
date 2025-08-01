import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getFirestore,
    collection,
    getDocs,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDDDYmHs-EVYN6UN81bAboxL83VXqkn8-w",
    authDomain: "arts-and-crafts-sa.firebaseapp.com",
    projectId: "arts-and-crafts-sa",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
    // Determine which page we are on based on the URL pathname
    if (window.location.pathname.endsWith("product-details.html")) {
        loadProductDetails();
    } else if (window.location.pathname.endsWith("artist-details.html")) {
        loadArtistDetails();
    } else {
        // This will be for the main store/products listing page
        initStorePage();
    }

    // --- Product Details Page Logic ---
    async function loadProductDetails() {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get("id");
        if (!productId) {
            console.error("No product ID found in URL for product details page.");
            return;
        }

        try {
            // Fetch all artists to create a map for easy lookup
            const artistsSnapshot = await getDocs(collection(db, "artists"));
            const artistsMap = {};
            artistsSnapshot.forEach(doc => {
                artistsMap[doc.id] = doc.data().name || "Unknown Artist";
            });

            // Fetch the specific product details
            const productRef = doc(db, "products", productId);
            const productSnap = await getDoc(productRef);

            if (!productSnap.exists()) {
                console.error("Product not found with ID:", productId);
                // Optionally display a "Product not found" message on the page
                document.querySelector(".product-details-heading").textContent = "Product Not Found";
                document.querySelector("#product-details-artist-name").textContent = "";
                document.querySelector(".product-details-list").innerHTML = "<li>This product could not be loaded.</li>";
                document.querySelector(".product-images-gallery").innerHTML = '<img class="main-product-image" src="https://via.placeholder.com/400?text=Product+Not+Found" alt="Product not found">';
                return;
            }

            const product = productSnap.data();

            // Populate product details elements
            const titleEl = document.querySelector(".product-details-heading");
            if (titleEl) titleEl.textContent = product.name || "Unnamed Product";

            const artistNameEl = document.getElementById("product-details-artist-name");
            if (artistNameEl) {
                const artistId = product.artistId;
                const artistName = artistsMap[artistId] || "Unknown Artist";
                artistNameEl.textContent = artistName;
                // Update the href to link to artist-details.html with artistId
                artistNameEl.href = `artist-details.html?id=${artistId}`;
            }

            const detailsListEl = document.querySelector(".product-details-list");
            if (detailsListEl) {
                detailsListEl.innerHTML = ""; // Clear existing content
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
                priceEls[1].textContent = `Stock: ${product.stock || 0}`;
            }

            // --- Updated image section using only mainImage ---
            const galleryContainer = document.querySelector(".product-images-gallery");
            if (galleryContainer && product.mainImage) {
                galleryContainer.innerHTML = ""; // Clear existing gallery content

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
                    // Simple fade effect for image transition
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

        } catch (err) {
            console.error("Error loading product details:", err);
            // Display a general error message on the page
            document.querySelector(".product-details-heading").textContent = "Error Loading Product";
            document.querySelector(".product-details-list").innerHTML = "<li>An error occurred while loading product information. Please try again later.</li>";
        }
    }

     async function loadArtistDetails() {
        console.log("loadArtistDetails function started."); // Log 1

        const urlParams = new URLSearchParams(window.location.search);
        const artistId = urlParams.get("id"); // Get the artist ID from the URL

        console.log("Artist ID from URL:", artistId); // Log 2

        if (!artistId) {
            console.error("No artist ID found in URL for artist details page.");
            // Display an error message if no ID is provided
            document.querySelector('.artist-header h1').textContent = "Artist Not Found";
            document.querySelector('.artist-header h2').textContent = "";
            document.querySelector('.artist-bio').textContent = "Please ensure you have a valid artist ID in the URL (e.g., artist-details.html?id=YOUR_ARTIST_ID).";
            // Make sure to select the img tag for placeholder if no ID
            const artistImageEl = document.getElementById("artist-profile-image");
            if (artistImageEl) artistImageEl.src = "https://via.placeholder.com/300?text=No+Artist+ID";
            document.querySelector('.social-icons').innerHTML = ''; // Clear social icons
            return;
        }

        try {
            // Fetch the specific artist document from Firestore
            console.log(`Attempting to fetch artist with ID: ${artistId}`); // Log 3
            const artistRef = doc(db, "artists", artistId);
            const artistSnap = await getDoc(artistRef);

            console.log("Artist Snapshot exists:", artistSnap.exists()); // Log 4

            if (!artistSnap.exists()) {
                console.error(`Artist with ID ${artistId} not found in Firestore.`);
                // Display a "Artist not found" message on the page
                document.querySelector('.artist-header h1').textContent = "Artist Not Found";
                document.querySelector('.artist-header h2').textContent = "";
                document.querySelector('.artist-bio').textContent = `The artist with ID "${artistId}" does not exist or their profile is not available.`;
                const artistImageEl = document.getElementById("artist-profile-image");
                if (artistImageEl) artistImageEl.src = "https://via.placeholder.com/300?text=Artist+Not+Found";
                document.querySelector('.social-icons').innerHTML = ''; // Clear social icons
                return;
            }

            const artistData = artistSnap.data();
            console.log("Artist Data fetched:", artistData); // Log 5

            // Populate artist details elements
            const artistNameH1 = document.querySelector('.artist-header h1');
            if (artistNameH1) artistNameH1.textContent = artistData.name || "Unknown Artist";
            console.log("Artist Name Set:", artistNameH1 ? artistNameH1.textContent : "Not found"); // Log 6

            // Setting h2 (Meet the Artist) back to its original value or an empty string
            const artistHeaderH2 = document.querySelector('.artist-header h2');
            if (artistHeaderH2) artistHeaderH2.textContent = "Meet the Artist";


            const artistBioP = document.querySelector('.artist-bio');
            if (artistBioP) artistBioP.textContent = artistData.bio || "No biography available for this artist.";
            console.log("Artist Bio Set:", artistBioP ? artistBioP.textContent.substring(0, 50) + "..." : "Not found"); // Log 7 (truncate bio for log)

            const artistImage = document.getElementById('artist-profile-image'); // Using the ID as per our previous discussion
            if (artistImage) {
                // Corrected: Use profileImage instead of profilePicture
                artistImage.src = artistData.profileImage || "https://via.placeholder.com/300?text=No+Profile+Image";
            }
            console.log("Artist Image Source Set to:", artistImage ? artistImage.src : "Not found"); // Log 8


            // Dynamically show/hide social icons based on Firestore data
            const socialIconsContainer = document.querySelector('.social-icons');
            console.log("Social Icons Container:", socialIconsContainer); // Log 9

            if (socialIconsContainer) {
                // Get all social icon elements within the container
                const socialIconElements = socialIconsContainer.querySelectorAll('.social-icon');
                console.log("Found social icon elements (NodeList):", socialIconElements); // Log 10

                socialIconElements.forEach(iconElement => {
                    const dataLink = iconElement.dataset.link; // e.g., "instagram", "facebook", "email"
                    console.log(`Processing icon with data-link: ${dataLink}`); // Log 11

                    // Check if the artistData has a 'socials' object and if it contains a link for this specific platform
                    if (dataLink && artistData.socials && artistData.socials[dataLink]) {
                        // Special handling for email links (mailto:)
                        iconElement.href = (dataLink === "email") ? `mailto:${artistData.socials[dataLink]}` : artistData.socials[dataLink];
                        iconElement.classList.remove('hidden'); // Show the icon by removing the 'hidden' class
                        console.log(`-> Showing icon: ${dataLink}. Link set to: ${iconElement.href}. ClassList after remove:`, iconElement.classList.contains('hidden')); // Log 12
                    } else {
                        // If no link exists in Firestore for this platform, ensure the icon is hidden
                        iconElement.classList.add('hidden');
                        console.log(`-> Hiding icon: ${dataLink}. ClassList after add:`, iconElement.classList.contains('hidden')); // Log 13
                    }
                });
            }

        } catch (err) {
            console.error("Error loading artist details:", err); // Log 14 (catch-all error)
            // Display a general error message on the page for unexpected errors
            document.querySelector('.artist-header h1').textContent = "Error Loading Artist";
            document.querySelector('.artist-header h2').textContent = "";
            document.querySelector('.artist-bio').textContent = "An unexpected error occurred while loading artist information. Please try again later.";
            const artistImageEl = document.getElementById("artist-profile-image");
            if (artistImageEl) artistImageEl.src = "https://via.placeholder.com/300?text=Error";
            document.querySelector('.social-icons').innerHTML = '';
        }
    }
    
    // --- Store Page Logic (for main products listing) ---
    async function initStorePage() {
        // Carousel logic for specific product cards (if present on the store page)
        const productCards = document.querySelectorAll('.product-card'); // Assumes these are part of a carousel on the store page

        const prevButtons = [
            document.getElementById('prevCategory'),
            document.getElementById('prevCategorySmall')
        ].filter(Boolean); // Filter out null if elements don't exist

        const nextButtons = [
            document.getElementById('nextCategory'),
            document.getElementById('nextCategorySmall')
        ].filter(Boolean); // Filter out null if elements don't exist

        const cardsToShow = 4; // Number of cards to display in the carousel
        let currentCarouselPage = 0;
        const totalCarouselPages = Math.ceil(productCards.length / cardsToShow);

        function updateCarousel() {
            productCards.forEach(card => card.style.display = 'none'); // Hide all cards initially
            const startIndex = currentCarouselPage * cardsToShow;
            const endIndex = startIndex + cardsToShow;
            for (let i = startIndex; i < endIndex && i < productCards.length; i++) {
                productCards[i].style.display = 'inline-block'; // Display cards for the current page
            }

            // Update button opacity/cursor based on carousel position
            prevButtons.forEach(btn => {
                btn.style.opacity = currentCarouselPage === 0 ? '0.5' : '1';
                btn.style.cursor = currentCarouselPage === 0 ? 'not-allowed' : 'pointer';
            });

            nextButtons.forEach(btn => {
                btn.style.opacity = currentCarouselPage === totalCarouselPages - 1 ? '0.5' : '1';
                btn.style.cursor = currentCarouselPage === totalCarouselPages - 1 ? 'not-allowed' : 'pointer';
            });
        }

        // Add event listeners for carousel navigation
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

        updateCarousel(); // Initial render of carousel
        window.addEventListener('resize', updateCarousel); // Re-render on resize

        // Product Grid and Pagination Logic
        const grid = document.getElementById("productsGrid");
        const paginationContainer = document.getElementById("paginationControls");

        const categoryFilter = document.getElementById('categoryFilter');
        const artistFilter = document.getElementById('artistFilter');
        const sortOptions = document.getElementById('sortOptions');

        const productsPerPage = 12; // Number of products per page in the main grid
        let currentFirestorePage = 1;
        let allProducts = []; // Stores all fetched products

        let artistsMap = {}; // Map to store artist IDs to names
        let categoriesSet = new Set(); // Set to store unique categories

        // Fetch artists data from Firestore
        async function fetchArtists() {
            const artistSnapshot = await getDocs(collection(db, "artists"));
            artistSnapshot.forEach(doc => {
                const artistData = doc.data();
                artistsMap[doc.id] = artistData.name || "Unknown Artist";
            });
        }

        // Fetch products data from Firestore
        async function fetchProducts() {
            await fetchArtists(); // Ensure artists are fetched before products

            const querySnapshot = await getDocs(collection(db, "products"));
            allProducts = querySnapshot.docs.map(doc => {
                return {
                    id: doc.id,
                    ...doc.data()
                };
            });

            populateFilters(); // Populate dropdown filters
            filterAndRender(); // Initial render of filtered products
        }

        // Populate category and artist filter dropdowns
        function populateFilters() {
            if (!categoryFilter || !artistFilter) return;

            categoryFilter.innerHTML = `<option value="">All Categories</option>`;
            artistFilter.innerHTML = `<option value="">All Artists</option>`;

            // Collect unique categories from products
            categoriesSet = new Set(allProducts.map(p => p.category).filter(Boolean));

            categoriesSet.forEach(category => {
                const opt = document.createElement('option');
                opt.value = category;
                opt.textContent = category;
                categoryFilter.appendChild(opt);
            });

            // Populate artist filter using the artistsMap
            Object.entries(artistsMap).forEach(([id, name]) => {
                const opt = document.createElement('option');
                opt.value = id;
                opt.textContent = name;
                artistFilter.appendChild(opt);
            });
        }

        // Filter and sort products based on selected options, then render
        function filterAndRender() {
            if (!categoryFilter || !artistFilter || !sortOptions) return;

            const selectedCategory = categoryFilter.value;
            const selectedArtistId = artistFilter.value;
            const selectedSort = sortOptions.value;

            // Apply filters
            let filtered = allProducts.filter(product => {
                const categoryMatch = !selectedCategory || product.category === selectedCategory;
                const artistMatch = !selectedArtistId || product.artistId === selectedArtistId;
                return categoryMatch && artistMatch;
            });

            // Apply sorting
            if (selectedSort === 'name-asc') {
                filtered.sort((a, b) => a.name.localeCompare(b.name));
            } else if (selectedSort === 'name-desc') {
                filtered.sort((a, b) => b.name.localeCompare(a.name));
            } else if (selectedSort === 'price-low-high') {
                filtered.sort((a, b) => (a.priceZar || 0) - (b.priceZar || 0));
            } else if (selectedSort === 'price-high-low') {
                filtered.sort((a, b) => (b.priceZar || 0) - (a.priceZar || 0));
            }

            renderFilteredPage(filtered, 1); // Render the first page of filtered results
        }

        // Render products for the current page
        function renderFilteredPage(products, page) {
            currentFirestorePage = page;
            if (!grid) return;
            grid.innerHTML = ""; // Clear existing product cards

            const start = (page - 1) * productsPerPage;
            const end = start + productsPerPage;
            const productsToShow = products.slice(start, end);

            productsToShow.forEach(product => {
                const mainImage = product.mainImage || "placeholder.jpg"; // Default image if none
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

            renderFilteredPagination(products); // Update pagination buttons
            updateFilteredChevronState(products); // Update chevron button states
        }

        // Render pagination buttons
        function renderFilteredPagination(filteredProducts) {
            if (!paginationContainer) return;

            const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
            paginationContainer.innerHTML = ""; // Clear existing pagination

            for (let i = 1; i <= totalPages; i++) {
                const btn = document.createElement("button");
                btn.textContent = i;
                btn.classList.add("btn", "btn-branding", "pagination-btn");
                if (i === currentFirestorePage) {
                    btn.style.backgroundColor = "var(--highlight-color)";
                    btn.style.color = "var(--color-darkest)";
                }
                btn.addEventListener("click", () => {
                    renderFilteredPage(filteredProducts, i);
                });
                paginationContainer.appendChild(btn);
            }
        }

        // Update state of pagination chevron buttons (prev/next)
        function updateFilteredChevronState(filteredProducts) {
            const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

            if (prevFirestoreBtn) {
                prevFirestoreBtn.style.opacity = currentFirestorePage === 1 ? '0.5' : '1';
                prevFirestoreBtn.style.cursor = currentFirestorePage === 1 ? 'not-allowed' : 'pointer';
            }

            if (nextFirestoreBtn) {
                nextFirestoreBtn.style.opacity = currentFirestorePage === totalPages ? '0.5' : '1';
                nextFirestoreBtn.style.cursor = currentFirestorePage === totalPages ? 'not-allowed' : 'pointer';
            }
        }

        // Get chevron buttons for main product grid pagination
        const prevFirestoreBtn = document.getElementById('prevCategory');
        const nextFirestoreBtn = document.getElementById('nextCategory');

        // Add event listeners for main product grid chevron navigation
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

        // Add event listeners for filter and sort dropdowns
        if (categoryFilter) categoryFilter.addEventListener('change', filterAndRender);
        if (artistFilter) artistFilter.addEventListener('change', filterAndRender);
        if (sortOptions) sortOptions.addEventListener('change', filterAndRender);

        fetchProducts(); // Initial fetch of all products and artists when store page loads
    }
});