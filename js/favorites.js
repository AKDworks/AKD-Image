/* Favorites selection page */
(function () {
  const favoritesStorageKey = 'akd-image-favorites';

  function readFavorites() {
    try {
      const savedFavorites = JSON.parse(localStorage.getItem(favoritesStorageKey));
      return Array.isArray(savedFavorites) ? new Set(savedFavorites) : new Set();
    } catch {
      return new Set();
    }
  }

  function saveFavorites(favorites) {
    try {
      localStorage.setItem(favoritesStorageKey, JSON.stringify([...favorites]));
      return true;
    } catch {
      return false;
    }
  }

  function localCatalogUrl() {
    return ['localhost', '127.0.0.1'].includes(location.hostname) ? '../index.html' : '/';
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const picker = document.getElementById('favorite-picker');
    const status = document.getElementById('favorites-page-status');
    const backButton = document.getElementById('favorites-back');
    const confirmButton = document.getElementById('favorites-confirm');

    function openFavoritesOnHome() {
      try {
        sessionStorage.setItem('akd-image-open-favorites', 'true');
      } catch {
        /* The main page will open the full catalog if session storage is unavailable. */
      }

      location.href = ['localhost', '127.0.0.1'].includes(location.hostname) ? '../index.html' : '/';
    }

    backButton.addEventListener('click', openFavoritesOnHome);

    try {
      const response = await fetch(localCatalogUrl());
      if (!response.ok) throw new Error('Catalog request failed');

      const source = new DOMParser().parseFromString(await response.text(), 'text/html');
      const sourceCards = Array.from(source.querySelectorAll('#tools-grid .tool-card'));
      const favorites = new Set(readFavorites());

      sourceCards.forEach(sourceCard => {
        const toolId = sourceCard.getAttribute('href');
        const card = document.createElement('button');
        card.type = 'button';
        card.className = `${sourceCard.className} favorite-picker__card`;
        card.dataset.toolId = toolId;
        card.innerHTML = sourceCard.innerHTML;

        const openLabel = card.querySelector('.tool-card__arrow');

        function updateToggle() {
          const isFavorite = favorites.has(toolId);
          openLabel.textContent = isFavorite ? 'Убрать из избранного' : 'Добавить в избранное';
          card.classList.toggle('is-favorite', isFavorite);
          card.setAttribute('aria-pressed', String(isFavorite));
        }

        card.addEventListener('click', () => {
          if (favorites.has(toolId)) {
            favorites.delete(toolId);
          } else {
            favorites.add(toolId);
          }

          updateToggle();
        });

        updateToggle();
        picker.appendChild(card);
      });

      confirmButton.addEventListener('click', () => {
        if (!saveFavorites(favorites)) {
          Toast.error('Не удалось сохранить избранное в браузере.');
          return;
        }

        openFavoritesOnHome();
      });
    } catch (error) {
      console.error(error);
      status.hidden = false;
      status.textContent = 'Не удалось загрузить список инструментов. Обновите страницу и попробуйте снова.';
      confirmButton.disabled = true;
    }
  });
})();
