// scripts/listeners/artistListeners.js
import {
  artistNameInput,
  artistEmailInput,
  artistPhoneInput,
  artistCityInput,
  artistCountryInput,
  artistBioInput,
  artistFacebookLinkInput,
  artistInstagramLinkInput,
  artistTwitterLinkInput,
  artistShippingCheckbox,
  artistImageInput,
  currentArtistImage,
  addArtistBtn,
  cancelEditBtn,
  submitSuccessMsg,
  submitErrorMsg,
  artistsList
} from "../ui/domElements.js";

import { addArtist, getArtists } from "../firebase/firestore.js";
import { uploadImage } from "../firebase/storage.js";

function clearArtistForm() {
  artistNameInput.value = "";
  artistEmailInput.value = "";
  artistPhoneInput.value = "";
  artistCityInput.value = "";
  artistCountryInput.value = "";
  artistBioInput.value = "";
  artistFacebookLinkInput.value = "";
  artistInstagramLinkInput.value = "";
  artistTwitterLinkInput.value = "";
  artistShippingCheckbox.checked = false;
  artistImageInput.value = "";
  currentArtistImage.innerHTML = "";
}

function renderArtists(artists) {
  if (artists.length === 0) {
    artistsList.innerHTML = "<p>No artists found.</p>";
    return;
  }
  artistsList.innerHTML = artists.map(artist => `
    <div class="artist-item">
      <strong>${artist.name}</strong> (${artist.email})<br>
      ${artist.city}, ${artist.country}
    </div>
  `).join("");
}

async function loadAndRenderArtists() {
  const artists = await getArtists();
  renderArtists(artists);

  // Populate artist select for products
  const productArtistIdSelect = document.getElementById("product-artist-id");
  productArtistIdSelect.innerHTML = '<option value="">-- Select an Artist --</option>';
  artists.forEach(artist => {
    const option = document.createElement("option");
    option.value = artist.id;
    option.textContent = artist.name;
    productArtistIdSelect.appendChild(option);
  });
}

export function initArtistListeners() {
  addArtistBtn.addEventListener("click", async () => {
    submitSuccessMsg.textContent = "";
    submitErrorMsg.textContent = "";

    const name = artistNameInput.value.trim();
    const email = artistEmailInput.value.trim();
    if (!name || !email) {
      submitErrorMsg.textContent = "Name and email are required.";
      return;
    }

    let imageUrl = "";
    const file = artistImageInput.files[0];
    if (file) {
      try {
        imageUrl = await uploadImage(file, `artists/${Date.now()}_${file.name}`);
      } catch {
        submitErrorMsg.textContent = "Failed to upload artist image.";
        return;
      }
    }

    const artistData = {
      name,
      email,
      phone: artistPhoneInput.value.trim(),
      city: artistCityInput.value.trim(),
      country: artistCountryInput.value.trim(),
      bio: artistBioInput.value.trim(),
      facebookLink: artistFacebookLinkInput.value.trim(),
      instagramLink: artistInstagramLinkInput.value.trim(),
      twitterLink: artistTwitterLinkInput.value.trim(),
      shippingAvailable: artistShippingCheckbox.checked,
      imageUrl
    };

    try {
      await addArtist(artistData);
      submitSuccessMsg.textContent = "Artist added successfully.";
      clearArtistForm();
      await loadAndRenderArtists();
    } catch (error) {
      submitErrorMsg.textContent = error.message;
    }
  });

  cancelEditBtn.addEventListener("click", clearArtistForm);

  loadAndRenderArtists();
}
