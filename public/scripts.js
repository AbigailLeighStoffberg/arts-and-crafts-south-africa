import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 🛠 Replace with your Firebase config:
const firebaseConfig = {
  apiKey: "AIzaSyDDDYmHs-EVYN6UN81bAboxL83VXqkn8-w",
  authDomain: "arts-and-crafts-sa.firebaseapp.com",
  projectId: "arts-and-crafts-sa",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
  // --- CAROUSEL LOGIC for index.html ---
  const productCards = document.querySelectorAll('.product-card');

  const prevButtons = [
    document.getElementById('prevCategory'),
    document.getElementById('prevCategorySmall')
  ].filter(Boolean);  // filter out null if some don't exist

  const nextButtons = [
    document.getElementById('nextCategory'),
    document.getElementById('nextCategorySmall')
  ].filter(Boolean);

  const cardsToShow = 4;
  let currentCarouselPage = 0;
  const totalCarouselPages = Math.ceil(productCards.length / cardsToShow);

  function updateCarousel() {
    productCards.forEach(card => {
      card.style.display = 'none';
    });

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

  // --- FIRESTORE PAGINATION & FILTER & SORT LOGIC for products page ---
  const grid = document.getElementById("productsGrid");
  const paginationContainer = document.getElementById("paginationControls");

  const categoryFilter = document.getElementById('categoryFilter');
  const artistFilter = document.getElementById('artistFilter');
  const sortOptions = document.getElementById('sortOptions');

  const productsPerPage = 12;
  let currentFirestorePage = 1;
  let allProducts = [];

  // Map of artistId -> artistName
  let artistsMap = {};

  // Store categories for filter dropdown
  let categoriesSet = new Set();

  // Fetch all artists and build the map
  async function fetchArtists() {
    const artistSnapshot = await getDocs(collection(db, "artists"));
    artistSnapshot.forEach(doc => {
      const artistData = doc.data();
      artistsMap[doc.id] = artistData.name || "Unknown Artist";
    });
  }

  async function fetchProducts() {
    await fetchArtists(); // fetch artists first

    const querySnapshot = await getDocs(collection(db, "products"));
    allProducts = querySnapshot.docs.map(doc => doc.data());

    populateFilters();
    filterAndRender();
  }

  function populateFilters() {
    // Clear filters first
    categoryFilter.innerHTML = `<option value="">All Categories</option>`;
    artistFilter.innerHTML = `<option value="">All Artists</option>`;

    // Collect unique categories
    categoriesSet = new Set(allProducts.map(p => p.category).filter(Boolean));

    categoriesSet.forEach(category => {
      const opt = document.createElement('option');
      opt.value = category;
      opt.textContent = category;
      categoryFilter.appendChild(opt);
    });

    // Populate artist filter dropdown with artist names and IDs
    Object.entries(artistsMap).forEach(([id, name]) => {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = name;
      artistFilter.appendChild(opt);
    });
  }

  function filterAndRender() {
    const selectedCategory = categoryFilter.value;
    const selectedArtistId = artistFilter.value;
    const selectedSort = sortOptions.value;

    let filtered = allProducts.filter(product => {
      const categoryMatch = !selectedCategory || product.category === selectedCategory;
      const artistMatch = !selectedArtistId || product.artistId === selectedArtistId;
      return categoryMatch && artistMatch;
    });

    // Sorting logic
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

  // Render products page with filtered products and pagination
  function renderFilteredPage(products, page) {
    currentFirestorePage = page;
    grid.innerHTML = "";

    const start = (page - 1) * productsPerPage;
    const end = start + productsPerPage;
    const productsToShow = products.slice(start, end);

    productsToShow.forEach(product => {
      const mainImage = product.mainImage ? product.mainImage : "placeholder.jpg";
      const artistName = artistsMap[product.artistId] || "Unknown Artist";

      const card = document.createElement("div");
      card.className = "product-card-products-page";
      card.innerHTML = `
        <img class="product-image-products-page" src="${mainImage}" alt="${product.name}">
        <p class="item-name">${product.name}</p>
        <small class="artist-name-product-card">${artistName}</small>
        <p class="item-price">R${product.priceZar || "N/A"}</p>
      `;
      grid.appendChild(card);
    });

    renderFilteredPagination(products);
    updateFilteredChevronState(products);
  }

  // Render pagination buttons for filtered products
  function renderFilteredPagination(filteredProducts) {
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

  // Update chevron button states based on filtered pagination
  function updateFilteredChevronState(filteredProducts) {
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

    if (prevFirestoreBtn) {
      if (currentFirestorePage === 1) {
        prevFirestoreBtn.style.opacity = '0.5';
        prevFirestoreBtn.style.cursor = 'not-allowed';
      } else {
        prevFirestoreBtn.style.opacity = '1';
        prevFirestoreBtn.style.cursor = 'pointer';
      }
    }

    if (nextFirestoreBtn) {
      if (currentFirestorePage === totalPages) {
        nextFirestoreBtn.style.opacity = '0.5';
        nextFirestoreBtn.style.cursor = 'not-allowed';
      } else {
        nextFirestoreBtn.style.opacity = '1';
        nextFirestoreBtn.style.cursor = 'pointer';
      }
    }
  }

  // Get chevron buttons
  const prevFirestoreBtn = document.getElementById('prevCategory');
  const nextFirestoreBtn = document.getElementById('nextCategory');

  // Chevron click handlers for filtered pagination
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

  // Filter and sort dropdown change events
  categoryFilter.addEventListener('change', filterAndRender);
  artistFilter.addEventListener('change', filterAndRender);
  sortOptions.addEventListener('change', filterAndRender);

  // Start fetching products & artists
  fetchProducts();
});
