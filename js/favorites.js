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
    const search = document.getElementById('favorites-search');
    const searchTrigger = document.getElementById('favorites-search-trigger');
    const searchPanel = document.getElementById('favorites-search-panel');
    const searchInput = document.getElementById('favorites-search-input');
    const searchClear = document.getElementById('favorites-search-clear');
    const searchEmpty = document.getElementById('favorites-search-empty');
    const searchEmptyMessage = document.getElementById('favorites-search-empty-message');
    const desktopSearchMedia = window.matchMedia('(min-width: 769px)');
    let cards = [];
    let searchQuery = '';

    const normalizeSearchValue = value => String(value || '')
      .trim()
      .toLocaleLowerCase(window.AKDI18n?.language === 'en' ? 'en' : 'ru')
      .replaceAll('ё', 'е');

    const getSearchText = card => normalizeSearchValue([
      card.querySelector('.tool-card__title')?.textContent,
      card.querySelector('.tool-card__desc')?.textContent,
    ].join(' '));

    function filterCards() {
      const normalizedQuery = normalizeSearchValue(searchQuery);
      let visibleCount = 0;

      cards.forEach(card => {
        const isVisible = !normalizedQuery || getSearchText(card).includes(normalizedQuery);
        card.hidden = !isVisible;
        if (isVisible) visibleCount++;
      });

      const hasNoResults = Boolean(normalizedQuery) && visibleCount === 0;
      picker.hidden = hasNoResults;
      searchEmpty.hidden = !hasNoResults;
      if (hasNoResults) {
        searchEmptyMessage.textContent = `По запросу «${searchQuery.trim()}» инструменты не найдены.`;
      }
    }

    function setSearchOpen(isOpen, shouldFocus = false) {
      searchPanel.hidden = !isOpen;
      search.classList.toggle('is-open', isOpen);
      searchTrigger.setAttribute('aria-expanded', String(isOpen));
      searchTrigger.setAttribute('aria-label', isOpen ? 'Закрыть поиск инструментов' : 'Открыть поиск инструментов');

      if (isOpen && shouldFocus) {
        requestAnimationFrame(() => searchInput.focus());
      }
    }

    function closeSearch() {
      searchQuery = '';
      searchInput.value = '';
      setSearchOpen(false);
      filterCards();
      searchTrigger.focus();
    }

    function openFavoritesOnHome() {
      try {
        sessionStorage.setItem('akd-image-open-favorites', 'true');
      } catch {
        /* The main page will open the full catalog if session storage is unavailable. */
      }

      location.href = ['localhost', '127.0.0.1'].includes(location.hostname) ? '../index.html' : '/';
    }

    backButton.addEventListener('click', openFavoritesOnHome);

    searchTrigger.addEventListener('click', () => {
      if (searchPanel.hidden) setSearchOpen(true, true);
      else closeSearch();
    });

    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value;
      filterCards();
    });

    searchClear.addEventListener('click', closeSearch);

    search.addEventListener('focusout', event => {
      if (!desktopSearchMedia.matches || searchPanel.hidden) return;
      if (event.relatedTarget && search.contains(event.relatedTarget)) return;
      setSearchOpen(false);
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !searchPanel.hidden) closeSearch();
    });

    window.addEventListener('akd-languagechange', filterCards);

    try {
      const response = await fetch(localCatalogUrl());
      if (!response.ok) throw new Error('Catalog request failed');

      const source = new DOMParser().parseFromString(await response.text(), 'text/html');
      const sourceCards = Array.from(source.querySelectorAll('#tools-grid .tool-card'));
      const favorites = new Set(readFavorites());
      const favoriteToggles = [];

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

        favoriteToggles.push(updateToggle);

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

      window.addEventListener('akd-favoriteschange', () => {
        favorites.clear();
        favoriteToggles.forEach(updateToggle => updateToggle());
      });

      cards = Array.from(picker.querySelectorAll('.favorite-picker__card'));
      filterCards();

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
