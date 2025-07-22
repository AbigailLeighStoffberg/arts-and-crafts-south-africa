document.addEventListener('DOMContentLoaded', () => {
  const productsGrid = document.querySelector('.products-grid');
  const productCards = document.querySelectorAll('.product-card');

  const prevButtons = [
    document.getElementById('prevCategory'),
    document.getElementById('prevCategorySmall')
  ];

  const nextButtons = [
    document.getElementById('nextCategory'),
    document.getElementById('nextCategorySmall')
  ];

  const cardsToShow = 4;
  let currentPage = 0;
  const totalPages = Math.ceil(productCards.length / cardsToShow);

  function updateCarousel() {
    productCards.forEach(card => {
      card.style.display = 'none';
    });

    const startIndex = currentPage * cardsToShow;
    const endIndex = startIndex + cardsToShow;

    for (let i = startIndex; i < endIndex && i < productCards.length; i++) {
      productCards[i].style.display = 'inline-block';
    }

    prevButtons.forEach(btn => {
      btn.style.opacity = currentPage === 0 ? '0.5' : '1';
      btn.style.cursor = currentPage === 0 ? 'not-allowed' : 'pointer';
    });

    nextButtons.forEach(btn => {
      btn.style.opacity = currentPage === totalPages - 1 ? '0.5' : '1';
      btn.style.cursor = currentPage === totalPages - 1 ? 'not-allowed' : 'pointer';
    });
  }

  nextButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (currentPage < totalPages - 1) {
        currentPage++;
        updateCarousel();
      }
    });
  });

  prevButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (currentPage > 0) {
        currentPage--;
        updateCarousel();
      }
    });
  });

  updateCarousel();
  window.addEventListener('resize', updateCarousel);
});
