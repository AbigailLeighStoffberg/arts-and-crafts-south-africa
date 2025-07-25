// listeners/artistListeners.js
import {
  getArtists,
  getArtistById,
  addArtist,
  updateArtist,
  deleteArtist
} from "../data/artists.js";

import { uploadImage } from "../firebase/storage.js"; // Assumes uploadImage(file, path)

export function initArtistListeners() {
  const artistList = document.getElementById("artists-list");
  const formFields = {
    name: document.getElementById("artist-name"),
    email: document.getElementById("artist-email"),
    phone: document.getElementById("artist-phone"),
    city: document.getElementById("artist-city"),
    country: document.getElementById("artist-country"),
    bio: document.getElementById("artist-bio"),
    facebook: document.getElementById("artist-facebook-link"),
    instagram: document.getElementById("artist-instagram-link"),
    twitter: document.getElementById("artist-twitter-link"),
    shipping: document.getElementById("artist-shipping"),
    image: document.getElementById("artist-image"),
  };

  const addBtn = document.getElementById("add-artist-btn");
  const cancelBtn = document.getElementById("cancel-edit-btn");
  const successMsg = document.getElementById("submit-success");
  const errorMsg = document.getElementById("submit-error");

  let editingArtistId = null;

  async function loadArtists() {
    try {
      const artists = await getArtists();
      artistList.innerHTML = "";
      artists.forEach(artist => {
        const div = document.createElement("div");
        div.classList.add("artist-entry");
        div.dataset.id = artist.id;
        div.innerHTML = `
          <p><strong>${artist.name}</strong> (${artist.email})</p>
          <button class="edit-artist-btn">Edit</button>
          <button class="delete-artist-btn">Delete</button>
        `;
        artistList.appendChild(div);
      });
    } catch (err) {
      artistList.innerHTML = `<p style="color:red;">Failed to load artists: ${err.message}</p>`;
    }
  }

  async function handleSubmit() {
    successMsg.textContent = "";
    errorMsg.textContent = "";

    const file = formFields.image.files[0];
    let imageUrl = "";

    if (file) {
      try {
        imageUrl = await uploadImage(file, `artists/${Date.now()}_${file.name}`);
      } catch (err) {
        errorMsg.textContent = "Image upload failed: " + err.message;
        return;
      }
    }

    const data = {
      name: formFields.name.value.trim(),
      email: formFields.email.value.trim(),
      phone: formFields.phone.value.trim(),
      city: formFields.city.value.trim(),
      country: formFields.country.value.trim(),
      bio: formFields.bio.value.trim(),
      facebook: formFields.facebook.value.trim(),
      instagram: formFields.instagram.value.trim(),
      twitter: formFields.twitter.value.trim(),
      shipping: formFields.shipping.checked,
      imageUrl
    };

    if (!data.name || !data.email) {
      errorMsg.textContent = "Name and Email are required.";
      return;
    }

    try {
      if (editingArtistId) {
        await updateArtist(editingArtistId, data);
        successMsg.textContent = "Artist updated successfully!";
      } else {
        await addArtist(data);
        successMsg.textContent = "Artist added successfully!";
      }
      clearForm();
      await loadArtists();
    } catch (err) {
      errorMsg.textContent = err.message;
    }
  }

  function clearForm() {
    Object.values(formFields).forEach((field) => {
      if (field.type === "checkbox") field.checked = false;
      else if (field.type === "file") field.value = null;
      else field.value = "";
    });
    editingArtistId = null;
    cancelBtn.style.display = "none";
    addBtn.textContent = "Add Artist";
    successMsg.textContent = "";
    errorMsg.textContent = "";
  }

  function fillForm(data) {
    formFields.name.value = data.name || "";
    formFields.email.value = data.email || "";
    formFields.phone.value = data.phone || "";
    formFields.city.value = data.city || "";
    formFields.country.value = data.country || "";
    formFields.bio.value = data.bio || "";
    formFields.facebook.value = data.facebook || "";
    formFields.instagram.value = data.instagram || "";
    formFields.twitter.value = data.twitter || "";
    formFields.shipping.checked = data.shipping || false;
    formFields.image.value = null;
  }

  addBtn.addEventListener("click", (e) => {
    e.preventDefault();
    handleSubmit();
  });

  cancelBtn.addEventListener("click", (e) => {
    e.preventDefault();
    clearForm();
  });

  artistList.addEventListener("click", async (e) => {
    const div = e.target.closest(".artist-entry");
    if (!div) return;

    const id = div.dataset.id;

    if (e.target.classList.contains("edit-artist-btn")) {
      try {
        const data = await getArtistById(id);
        fillForm(data);
        editingArtistId = id;
        addBtn.textContent = "Update Artist";
        cancelBtn.style.display = "inline-block";
        successMsg.textContent = "";
        errorMsg.textContent = "";
      } catch (err) {
        errorMsg.textContent = `Failed to load artist: ${err.message}`;
      }
    } else if (e.target.classList.contains("delete-artist-btn")) {
      if (confirm("Are you sure you want to delete this artist?")) {
        try {
          await deleteArtist(id);
          await loadArtists();
          successMsg.textContent = "Artist deleted successfully!";
          errorMsg.textContent = "";
          if (editingArtistId === id) clearForm();
        } catch (err) {
          errorMsg.textContent = `Failed to delete artist: ${err.message}`;
        }
      }
    }
  });

  loadArtists();
}
