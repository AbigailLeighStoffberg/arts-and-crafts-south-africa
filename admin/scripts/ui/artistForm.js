// scripts/ui/artistForm.js
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
  submitErrorMsg
} from "./domElements.js";

import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";
import { app } from "../firebase/config.js";
import { addArtist, updateArtist } from "../data/artists.js";
import { loadArtists } from "./artistList.js"; // assumes this exists

const storage = getStorage(app);

export let editingArtistId = null;
export let editingArtistImageUrl = null;

export function clearArtistForm() {
  editingArtistId = null;
  editingArtistImageUrl = null;

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
  addArtistBtn.textContent = "Add Artist";
  cancelEditBtn.style.display = "none";
  submitSuccessMsg.textContent = "";
  submitErrorMsg.textContent = "";
}

async function uploadArtistImage(file) {
  const filePath = `artists/${Date.now()}_${file.name}`;
  const fileRef = ref(storage, filePath);
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
}

async function handleArtistSubmit() {
  submitSuccessMsg.textContent = "";
  submitErrorMsg.textContent = "";

  const imageFile = artistImageInput.files[0];
  let imageUrl = editingArtistImageUrl;

  if (imageFile) {
    try {
      imageUrl = await uploadArtistImage(imageFile);
    } catch (err) {
      submitErrorMsg.textContent = "Image upload failed: " + err.message;
      return;
    }
  }

  const artistData = {
    name: artistNameInput.value.trim(),
    email: artistEmailInput.value.trim(),
    phone: artistPhoneInput.value.trim(),
    city: artistCityInput.value.trim(),
    country: artistCountryInput.value.trim(),
    bio: artistBioInput.value.trim(),
    facebook: artistFacebookLinkInput.value.trim(),
    instagram: artistInstagramLinkInput.value.trim(),
    twitter: artistTwitterLinkInput.value.trim(),
    shipping: artistShippingCheckbox.checked,
    image: imageUrl || null
  };

  if (!artistData.name || !artistData.email) {
    submitErrorMsg.textContent = "Name and Email are required.";
    return;
  }

  try {
    if (editingArtistId) {
      await updateArtist(editingArtistId, artistData);
      submitSuccessMsg.textContent = "Artist updated successfully!";
    } else {
      await addArtist(artistData);
      submitSuccessMsg.textContent = "Artist added successfully!";
    }

    clearArtistForm();
    await loadArtists();
  } catch (err) {
    submitErrorMsg.textContent = "Save failed: " + err.message;
  }
}

addArtistBtn.addEventListener("click", (e) => {
  e.preventDefault();
  handleArtistSubmit();
});

cancelEditBtn.addEventListener("click", (e) => {
  e.preventDefault();
  clearArtistForm();
});
