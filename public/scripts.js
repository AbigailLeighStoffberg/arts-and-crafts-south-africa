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

  // --- FIRESTORE PAGINATION LOGIC for products page ---
  const grid = document.getElementById("productsGrid");
  const paginationContainer = document.getElementById("paginationControls");

  const productsPerPage = 12;
  let currentFirestorePage = 1;
  let allProducts = [];

  // Map of artistId -> artistName
  let artistsMap = {};

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
    renderPage(1);
  }

  function renderPage(page) {
    currentFirestorePage = page;

    grid.innerHTML = "";
    const start = (page - 1) * productsPerPage;
    const end = start + productsPerPage;
    const productsToShow = allProducts.slice(start, end);

    productsToShow.forEach(product => {
      const mainImage = product.mainImage ? product.mainImage : "placeholder.jpg";
      // Use artist name from map
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

    renderPagination();
    updateChevronState();
  }

  function renderPagination() {
    const totalPages = Math.ceil(allProducts.length / productsPerPage);
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
        renderPage(i);
      });
      paginationContainer.appendChild(btn);
    }
  }

  // Optional: Add chevron controls for Firestore pagination if you have them in HTML
  const prevFirestoreBtn = document.getElementById('prevCategory');
  const nextFirestoreBtn = document.getElementById('nextCategory');

  function updateChevronState() {
    const totalPages = Math.ceil(allProducts.length / productsPerPage);

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

  if (prevFirestoreBtn) {
    prevFirestoreBtn.addEventListener('click', () => {
      if (currentFirestorePage > 1) {
        renderPage(currentFirestorePage - 1);
      }
    });
  }

  if (nextFirestoreBtn) {
    nextFirestoreBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(allProducts.length / productsPerPage);
      if (currentFirestorePage < totalPages) {
        renderPage(currentFirestorePage + 1);
      }
    });
  }

  fetchProducts();
});
