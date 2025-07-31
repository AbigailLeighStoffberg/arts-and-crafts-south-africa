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
    if (window.location.pathname.endsWith("product-details.html")) {
        loadProductDetails();
    } else {
        initStorePage();
    }

    async function loadProductDetails() {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get("id");
        if (!productId) {
            console.error("No product ID found in URL");
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
                console.error("Product not found");
                return;
            }

            const product = productSnap.data();

            const titleEl = document.querySelector(".product-details-heading");
            if (titleEl) titleEl.textContent = product.name || "Unnamed Product";

            const artistNameEl = document.getElementById("product-details-artist-name");
            if (artistNameEl) artistNameEl.textContent = artistsMap[product.artistId] || "Unknown Artist";

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
                priceEls[1].textContent = `Stock: ${product.stock || 0}`;
            }

            // --- Updated image section using only mainImage ---
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

        } catch (err) {
            console.error("Error loading product details:", err);
        }
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

        const productsPerPage = 12;
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
                filtered.sort((a, b) => b.name.localeCompare(a.name));
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

        function renderFilteredPagination(filteredProducts) {
            if (!paginationContainer) return;

            const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
            paginationContainer.innerHTML = "";

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
});
