// main.js

// Import necessary functions from other modules
import { setupAuth } from './auth.js';
import { setupArtistForm, loadArtists, populateArtistDropdown } from './artists.js';
import { setupProductForm, loadProducts, populateArtistFilter } from './products.js';

/**
 * Toggles the display of admin sections and highlights the active navigation button.
 * This function is exposed globally (via window.showSection) so it can be called
 * by other modules, such as auth.js after a successful login.
 *
 * @param {string} sectionId - The ID of the section to show (e.g., 'artists', 'products').
 */
function showSection(sectionId) {
    // Hide all admin sections
    document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
    // Remove 'active' class from all navigation buttons
    document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));

    // Show the selected section
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = 'block';
    }

    // Add 'active' class to the corresponding navigation button
    const activeBtn = [...document.querySelectorAll('nav button')].find(btn =>
        // Match the button based on its 'data-section' attribute
        btn.getAttribute('data-section') === sectionId
    );
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

// Expose showSection to the global window object.
// This allows auth.js (and potentially other scripts) to call it.
window.showSection = showSection;

// Wait for the entire HTML document to be loaded and parsed before running setup code
document.addEventListener("DOMContentLoaded", () => {
    // Initialize authentication listeners and handlers
    setupAuth();

    // Set up form submission and editing functionality for artists
    setupArtistForm();
    // Set up form submission and editing functionality for products
    setupProductForm();

    // Load existing data lists
    loadArtists();
    loadProducts();

    // Populate dropdowns and filters that depend on loaded data (e.g., artist dropdown for products)
    populateArtistDropdown();
    populateArtistFilter();

    // Attach event listeners for the navigation buttons (Artists, Products, Orders, Payments)
    document.querySelectorAll("nav button").forEach(button => {
        button.addEventListener("click", () => {
            // Get the target section ID from the button's 'data-section' attribute
            const section = button.dataset.section;
            // Call the showSection function to switch to the selected tab
            window.showSection(section);
        });
    });

    // Initial display: If a user logs in, auth.js will call window.showSection('artists')
});