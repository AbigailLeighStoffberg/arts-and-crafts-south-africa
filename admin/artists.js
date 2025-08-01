import { db, storage } from './firebase.js';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  doc,
  deleteDoc,
  updateDoc,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

let editingArtistId = null;
let editingArtistImageUrl = null;

export function setupArtistForm() {
  const addArtistBtn = document.getElementById("add-artist-btn");
  const cancelEditBtn = document.getElementById("cancel-edit-btn");

  addArtistBtn?.addEventListener("click", handleArtistSubmit);
  cancelEditBtn?.addEventListener("click", clearArtistForm);
}

export function clearArtistForm() {
  const fields = [
    "artist-name", "artist-email", "artist-phone", "artist-city", "artist-country",
    "artist-bio",
    "artist-facebook-link", "artist-instagram-link", "artist-twitter-link",
    "artist-pinterest-link", "artist-linkedin-link", "artist-youtube-link",
    "artist-tiktok-link", "artist-artstation-link", "artist-email-link", "artist-website-link"
  ];
  fields.forEach(id => document.getElementById(id).value = "");
  document.getElementById("artist-shipping").checked = false;
  document.getElementById("artist-image").value = "";
  document.getElementById("current-artist-image").innerHTML = ""; // Clear current image display
  document.getElementById("add-artist-btn").textContent = "Add Artist";
  document.getElementById("add-artist-btn").classList.remove("update-mode");
  document.getElementById("cancel-edit-btn").style.display = "none";
  document.getElementById("artist-form-title").textContent = "Add Artist";
  editingArtistId = null;
  editingArtistImageUrl = null;
  document.getElementById("submit-success").textContent = "";
  document.getElementById("submit-error").textContent = "";
}

async function handleArtistSubmit() {
  const name = document.getElementById("artist-name").value.trim();
  const email = document.getElementById("artist-email").value.trim();
  const phone = document.getElementById("artist-phone").value.trim();
  const city = document.getElementById("artist-city").value.trim();
  const country = document.getElementById("artist-country").value.trim();
  const bio = document.getElementById("artist-bio").value.trim();
  const shipping = document.getElementById("artist-shipping").checked;
  const imageFile = document.getElementById("artist-image").files[0];

  // --- COLLECT ALL SOCIAL LINKS ---
  const facebook = document.getElementById("artist-facebook-link").value.trim();
  const instagram = document.getElementById("artist-instagram-link").value.trim();
  const twitter = document.getElementById("artist-twitter-link").value.trim();
  const pinterest = document.getElementById("artist-pinterest-link").value.trim();
  const linkedin = document.getElementById("artist-linkedin-link").value.trim();
  const youtube = document.getElementById("artist-youtube-link").value.trim();
  const tiktok = document.getElementById("artist-tiktok-link").value.trim();
  const artstation = document.getElementById("artist-artstation-link").value.trim();
  const artistEmailLink = document.getElementById("artist-email-link").value.trim(); // Renamed to avoid conflict with artist's primary email
  const website = document.getElementById("artist-website-link").value.trim();
  // --- END COLLECT ALL SOCIAL LINKS ---

  const success = document.getElementById("submit-success");
  const error = document.getElementById("submit-error");

  success.textContent = "";
  error.textContent = "";

  if (!name || !email) {
    error.textContent = "Name and email are required.";
    return;
  }

  const addBtn = document.getElementById("add-artist-btn");
  addBtn.disabled = true;

  try {
    let imageUrl = editingArtistImageUrl;
    if (imageFile) {
      if (editingArtistImageUrl) {
        try {
          // Extract path from existing URL to delete the old image from storage
          const url = new URL(editingArtistImageUrl);
          const path = decodeURIComponent(url.pathname.split('/o/')[1]).split('?')[0];
          await deleteObject(ref(storage, path));
        } catch (e) {
          console.warn("Could not delete old image", e);
        }
      }
      // Upload new image
      const safeName = name.replace(/\s+/g, "_").toLowerCase();
      const imageRef = ref(storage, `artists/${safeName}_${Date.now()}_${imageFile.name}`);
      await uploadBytes(imageRef, imageFile);
      imageUrl = await getDownloadURL(imageRef);
    }

    // Construct the socials object dynamically, only including non-empty fields
    const socials = {};
    if (facebook) socials.facebook = facebook;
    if (instagram) socials.instagram = instagram;
    if (twitter) socials.twitter = twitter;
    if (pinterest) socials.pinterest = pinterest;
    if (linkedin) socials.linkedin = linkedin;
    if (youtube) socials.youtube = youtube;
    if (tiktok) socials.tiktok = tiktok;
    if (artstation) socials.artstation = artstation;
    if (artistEmailLink) socials.email = artistEmailLink; // Use the new variable name
    if (website) socials.website = website;

    const artistData = {
      name,
      email,
      phone,
      address: { city, country },
      bio,
      profileImage: imageUrl, // Save the new or existing image URL
      shippingHandledByArtist: shipping,
      socials: socials, // Use the dynamically created socials object
      updatedAt: new Date(),
    };

    if (editingArtistId) {
      // Update existing artist
      await updateDoc(doc(db, "artists", editingArtistId), artistData);
      success.textContent = "Artist updated!";
    } else {
      // Add new artist
      artistData.createdAt = new Date();
      await addDoc(collection(db, "artists"), artistData);
      success.textContent = "Artist added!";
    }

    clearArtistForm(); // Clear form after successful submission
    await loadArtists(); // Reload the list of artists
    await populateArtistDropdown(); // Repopulate dropdown for products
  } catch (err) {
    console.error("Artist submit error", err);
    error.textContent = "Failed to save artist.";
  } finally {
    addBtn.disabled = false;
  }
}

export async function loadArtists() {
  const list = document.getElementById("artists-list");
  if (!list) return;

  list.innerHTML = "Loading...";
  try {
    const q = query(collection(db, "artists"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      list.innerHTML = "<p>No artists found.</p>";
      return;
    }

    let html = "<ul style='list-style:none;padding:0'>";
    snapshot.forEach(docSnap => {
      const artist = docSnap.data();
      const id = docSnap.id;
      const socials = artist.socials || {};

      // List all potential social platforms for display
      const allSocialPlatforms = [
        "facebook", "instagram", "twitter", "pinterest", "linkedin",
        "youtube", "tiktok", "artstation", "email", "website"
      ];

      const socialLinks = allSocialPlatforms
        .map(platform => {
          if (socials[platform]) {
            // Special handling for email link to use 'mailto:'
            const href = (platform === "email") ? `mailto:${socials[platform]}` : socials[platform];
            // Capitalize the first letter of the platform name for display
            return `<a href="${href}" target="_blank">${platform.charAt(0).toUpperCase() + platform.slice(1)}</a>`;
          }
          return '';
        })
        .filter(Boolean) // Remove empty strings (platforms with no link)
        .join(" | ");

      html += `<li style="margin-bottom:20px;">
        <strong>${artist.name}</strong> (${artist.email})<br/>
        Location: ${artist.address?.city || ""}, ${artist.address?.country || ""}<br/>
        ${socialLinks ? `Socials: ${socialLinks}<br/>` : ""}
        ${artist.profileImage ? `<img src="${artist.profileImage}" width="80"/>` : ""}
        <div>
          <button class="edit-artist-btn" data-id="${id}">Edit</button>
          <button class="delete-artist-btn" data-id="${id}">Delete</button>
        </div>
      </li>`;
    });
    html += "</ul>";
    list.innerHTML = html;

    // Attach event listeners for edit and delete buttons
    document.querySelectorAll(".edit-artist-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        editArtist(btn.dataset.id);
      });
    });

    document.querySelectorAll(".delete-artist-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        if (confirm("Delete this artist?")) deleteArtist(btn.dataset.id);
      });
    });

  } catch (err) {
    console.error("Load artists failed", err);
    list.innerHTML = "<p>Failed to load artists.</p>";
  }
}

async function editArtist(id) {
  // Use getDoc with a specific doc reference for better performance
  const docRef = doc(db, "artists", id);
  const docSnap = await getDocs(query(collection(db, "artists"), where("__name__", "==", id))); // You can replace this with getDoc(docRef) for direct fetch

  if (docSnap.empty) return;

  const docData = docSnap.docs[0].data(); // If using getDoc, it would be docSnap.data();

  editingArtistId = id;
  editingArtistImageUrl = docData.profileImage;

  document.getElementById("artist-name").value = docData.name || "";
  document.getElementById("artist-email").value = docData.email || "";
  document.getElementById("artist-phone").value = docData.phone || "";
  document.getElementById("artist-city").value = docData.address?.city || "";
  document.getElementById("artist-country").value = docData.address?.country || "";
  document.getElementById("artist-bio").value = docData.bio || "";
  document.getElementById("artist-shipping").checked = !!docData.shippingHandledByArtist;

  // --- CORRECTED SOCIAL LINKS POPULATION ---
  const socials = docData.socials || {}; // Ensure socials object exists
  document.getElementById("artist-facebook-link").value = socials.facebook || "";
  document.getElementById("artist-instagram-link").value = socials.instagram || "";
  document.getElementById("artist-twitter-link").value = socials.twitter || "";
  document.getElementById("artist-pinterest-link").value = socials.pinterest || "";
  document.getElementById("artist-linkedin-link").value = socials.linkedin || "";
  document.getElementById("artist-youtube-link").value = socials.youtube || "";
  document.getElementById("artist-tiktok-link").value = socials.tiktok || "";
  document.getElementById("artist-artstation-link").value = socials.artstation || "";
  document.getElementById("artist-email-link").value = socials.email || "";
  document.getElementById("artist-website-link").value = socials.website || "";
  // --- END CORRECTED SOCIAL LINKS POPULATION ---

  // Display current image if exists when editing
  const currentArtistImageDiv = document.getElementById("current-artist-image");
  if (currentArtistImageDiv) {
    if (docData.profileImage) {
      currentArtistImageDiv.innerHTML = `<img src="${docData.profileImage}" alt="Current Artist Image" width="100px" style="margin-top: 10px; border-radius: 5px;">`;
    } else {
      currentArtistImageDiv.innerHTML = "No current image.";
    }
  }

  document.getElementById("artist-form-title").textContent = "Edit Artist";
  document.getElementById("add-artist-btn").textContent = "Update Artist";
  document.getElementById("add-artist-btn").classList.add("update-mode");
  document.getElementById("cancel-edit-btn").style.display = "inline-block";

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteArtist(id) {
  try {
    // Optionally delete associated image from storage
    // const artistDoc = await getDoc(doc(db, "artists", id));
    // if (artistDoc.exists() && artistDoc.data().profileImage) {
    //     try {
    //         const url = new URL(artistDoc.data().profileImage);
    //         const path = decodeURIComponent(url.pathname.split('/o/')[1]).split('?')[0];
    //         await deleteObject(ref(storage, path));
    //     } catch (e) {
    //         console.warn("Could not delete associated image from storage:", e);
    //     }
    // }

    await deleteDoc(doc(db, "artists", id));
    await loadArtists();
    await populateArtistDropdown(); // Also refresh dropdown after deletion
  } catch (err) {
    console.error("Delete artist failed", err);
  }
}

export async function populateArtistDropdown() {
  const dropdown = document.getElementById("product-artist-id");
  if (!dropdown) return;

  // Clear old options except the first one
  dropdown.innerHTML = `<option value="">-- Select an Artist --</option>`;

  try {
    const q = query(collection(db, "artists"), orderBy("name", "asc"));
    const snapshot = await getDocs(q);

    snapshot.forEach(docSnap => {
      const artist = docSnap.data();
      const option = document.createElement("option");
      option.value = docSnap.id;
      option.textContent = artist.name;
      dropdown.appendChild(option);
    });
  } catch (err) {
    console.error("Failed to load artist dropdown", err);
  }
}