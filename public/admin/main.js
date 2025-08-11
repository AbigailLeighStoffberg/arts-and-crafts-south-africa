import { setupAuth } from './auth.js';
import { setupArtistForm, loadArtists, populateArtistDropdown } from './artists.js';
import { setupProductForm, loadProducts, populateArtistFilter, populateCategoriesDropdown } from './products.js';
import { setupCategoryForm, loadCategories, clearCategoryForm } from './categories.js';
import { loadOrders } from './orders.js'; // <-- ADD THIS LINE

window.populateProductDropdowns = populateCategoriesDropdown;

function showSection(sectionId) {
    document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));

    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = 'block';
    }

    const activeBtn = [...document.querySelectorAll('nav button')].find(btn =>
        btn.getAttribute('data-section') === sectionId
    );
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    if (sectionId === "artists") {
        loadArtists();
    } else if (sectionId === "products") {
        loadProducts();
        populateArtistDropdown();
        populateCategoriesDropdown();
    } else if (sectionId === "categories") {
        loadCategories();
        clearCategoryForm();
    } else if (sectionId === "orders") { // <-- ADD THIS NEW CONDITION
        loadOrders();
    }
}

window.showSection = showSection;

document.addEventListener("DOMContentLoaded", () => {
    setupAuth();

    setupArtistForm();
    setupProductForm();
    setupCategoryForm();

    loadArtists();
    loadProducts();
    loadCategories();

    populateArtistDropdown();
    populateArtistFilter();
    populateCategoriesDropdown();

    document.querySelectorAll("nav button").forEach(button => {
        button.addEventListener("click", () => {
            const section = button.dataset.section;
            window.showSection(section);
        });
    });
});