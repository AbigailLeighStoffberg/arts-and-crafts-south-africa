// scripts/listeners/productListeners.js
import {
  productNameInput,
  productDescriptionInput,
  productCategoryInput,
  productArtistIdSelect,
  productPriceUSDInput,
  productPriceZARInput,
  productSKUInput,
  productStockInput,
  productMainImageInput,
  currentProductMainImage,
  productThumbnailImageInput,
  currentProductThumbnailImage,
  productAdditionalImagesInput,
  currentProductAdditionalImages,
  addProductBtn,
  cancelEditProductBtn,
  productSubmitSuccessMsg,
  productSubmitErrorMsg,
  productsList
} from "../ui/domElements.js";

import { addProduct, getProducts } from "../firebase/firestore.js";
import { uploadImage } from "../firebase/storage.js";

function clearProductForm() {
  productNameInput.value = "";
  productDescriptionInput.value = "";
  productCategoryInput.value = "";
  productArtistIdSelect.value = "";
  productPriceUSDInput.value = "";
  productPriceZARInput.value = "";
  productSKUInput.value = "";
  productStockInput.value = "";
  productMainImageInput.value = "";
  productThumbnailImageInput.value = "";
  productAdditionalImagesInput.value = "";
  currentProductMainImage.innerHTML = "";
  currentProductThumbnailImage.innerHTML = "";
  currentProductAdditionalImages.innerHTML = "";
}

function renderProducts(products) {
  if (products.length === 0) {
    productsList.innerHTML = "<p>No products found.</p>";
    return;
  }
  productsList.innerHTML = products.map(product => `
    <div class="product-item">
      <strong>${product.name}</strong> (SKU: ${product.sku})<br>
      Price USD: ${product.priceUSD}, Price ZAR: ${product.priceZAR}<br>
      Stock: ${product.stock}
    </div>
  `).join("");
}

async function loadAndRenderProducts() {
  const products = await getProducts();
  renderProducts(products);
}

export function initProductListeners() {
  addProductBtn.addEventListener("click", async () => {
    productSubmitSuccessMsg.textContent = "";
    productSubmitErrorMsg.textContent = "";

    const name = productNameInput.value.trim();
    const sku = productSKUInput.value.trim();
    if (!name || !sku) {
      productSubmitErrorMsg.textContent = "Product name and SKU are required.";
      return;
    }

    let mainImageUrl = "";
    if (productMainImageInput.files[0]) {
      try {
        mainImageUrl = await uploadImage(productMainImageInput.files[0], `products/main/${Date.now()}_${productMainImageInput.files[0].name}`);
      } catch {
        productSubmitErrorMsg.textContent = "Failed to upload main image.";
        return;
      }
    }

    let thumbnailImageUrl = "";
    if (productThumbnailImageInput.files[0]) {
      try {
        thumbnailImageUrl = await uploadImage(productThumbnailImageInput.files[0], `products/thumbnail/${Date.now()}_${productThumbnailImageInput.files[0].name}`);
      } catch {
        productSubmitErrorMsg.textContent = "Failed to upload thumbnail image.";
        return;
      }
    }

    const additionalImageUrls = [];
    for (const file of productAdditionalImagesInput.files) {
      try {
        const url = await uploadImage(file, `products/additional/${Date.now()}_${file.name}`);
        additionalImageUrls.push(url);
      } catch {
        productSubmitErrorMsg.textContent = "Failed to upload one of the additional images.";
        return;
      }
    }

    const productData = {
      name,
      description: productDescriptionInput.value.trim(),
      category: productCategoryInput.value.trim(),
      artistId: productArtistIdSelect.value,
      priceUSD: parseFloat(productPriceUSDInput.value) || 0,
      priceZAR: parseFloat(productPriceZARInput.value) || 0,
      sku,
      stock: parseInt(productStockInput.value) || 0,
      mainImageUrl,
      thumbnailImageUrl,
      additionalImageUrls
    };

    try {
      await addProduct(productData);
      productSubmitSuccessMsg.textContent = "Product added successfully.";
      clearProductForm();
      await loadAndRenderProducts();
    } catch (error) {
      productSubmitErrorMsg.textContent = error.message;
    }
  });

  cancelEditProductBtn.addEventListener("click", clearProductForm);

  loadAndRenderProducts();
}
