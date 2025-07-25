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
    "artist-bio", "artist-facebook-link", "artist-instagram-link", "artist-twitter-link"
  ];
  fields.forEach(id => document.getElementById(id).value = "");
  document.getElementById("artist-shipping").checked = false;
  document.getElementById("artist-image").value = "";
  document.getElementById("current-artist-image").innerHTML = "";
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
  const facebook = document.getElementById("artist-facebook-link").value.trim();
  const instagram = document.getElementById("artist-instagram-link").value.trim();
  const twitter = document.getElementById("artist-twitter-link").value.trim();

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
          const url = new URL(editingArtistImageUrl);
          const path = decodeURIComponent(url.pathname.split('/o/')[1]).split('?')[0];
          await deleteObject(ref(storage, path));
        } catch (e) {
          console.warn("Could not delete old image", e);
        }
      }
      const safeName = name.replace(/\s+/g, "_").toLowerCase();
      const imageRef = ref(storage, `artists/${safeName}_${Date.now()}_${imageFile.name}`);
      await uploadBytes(imageRef, imageFile);
      imageUrl = await getDownloadURL(imageRef);
    }

    const artistData = {
      name,
      email,
      phone,
      address: { city, country },
      bio,
      profileImage: imageUrl,
      shippingHandledByArtist: shipping,
      socials: { facebook, instagram, twitter },
      updatedAt: new Date(),
    };

    if (editingArtistId) {
      await updateDoc(doc(db, "artists", editingArtistId), artistData);
      success.textContent = "Artist updated!";
    } else {
      artistData.createdAt = new Date();
      await addDoc(collection(db, "artists"), artistData);
      success.textContent = "Artist added!";
    }

    clearArtistForm();
    await loadArtists();
    await populateArtistDropdown();
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
      const socialLinks = ["facebook", "instagram", "twitter"]
        .map(platform => socials[platform] ? `<a href="${socials[platform]}" target="_blank">${platform}</a>` : '')
        .filter(Boolean).join(" | ");

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
  const docSnap = await getDocs(query(collection(db, "artists"), where("__name__", "==", id)));
  if (docSnap.empty) return;

  const docData = docSnap.docs[0].data();

  editingArtistId = id;
  editingArtistImageUrl = docData.profileImage;

  document.getElementById("artist-name").value = docData.name || "";
  document.getElementById("artist-email").value = docData.email || "";
  document.getElementById("artist-phone").value = docData.phone || "";
  document.getElementById("artist-city").value = docData.address?.city || "";
  document.getElementById("artist-country").value = docData.address?.country || "";
  document.getElementById("artist-bio").value = docData.bio || "";
  document.getElementById("artist-shipping").checked = !!docData.shippingHandledByArtist;

  document.getElementById("artist-facebook-link").value = docData.socials?.facebook || "";
  document.getElementById("artist-instagram-link").value = docData.socials?.instagram || "";
  document.getElementById("artist-twitter-link").value = docData.socials?.twitter || "";

  document.getElementById("artist-form-title").textContent = "Edit Artist";
  document.getElementById("add-artist-btn").textContent = "Update Artist";
  document.getElementById("add-artist-btn").classList.add("update-mode");
  document.getElementById("cancel-edit-btn").style.display = "inline-block";

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteArtist(id) {
  try {
    await deleteDoc(doc(db, "artists", id));
    await loadArtists();
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
