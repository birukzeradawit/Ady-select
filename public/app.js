// ADY SELECT — Rapid Demand Assessment Controller

document.addEventListener('DOMContentLoaded', () => {
  let categoriesData = [];
  const selectedBrands = new Map(); // brandName -> { name, category, origin, priority }
  let activeCategory = 'all';
  let searchQuery = '';

  // DOM Elements
  const brandCatalogGrid = document.getElementById('brandCatalogGrid');
  const brandSearchInput = document.getElementById('brandSearchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const categoryTabs = document.querySelectorAll('.cat-tab');
  const selectedCountText = document.getElementById('selectedCountText');
  const submitWishlistBtn = document.getElementById('submitWishlistBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const votingSection = document.getElementById('votingSection');
  const successScreen = document.getElementById('successScreen');
  const finalBrandsList = document.getElementById('finalBrandsList');
  const copyShareBtn = document.getElementById('copyShareBtn');
  const whatsappShareBtn = document.getElementById('whatsappShareBtn');
  const copiedToast = document.getElementById('copiedToast');

  init();

  async function init() {
    try {
      const res = await fetch('/api/brands');
      const data = await res.json();
      if (data.success && data.categories) {
        categoriesData = data.categories;
        renderBrands();
      }
    } catch (e) {
      console.warn('Network error loading brands:', e);
    }

    setupEvents();
  }

  function renderBrands() {
    brandCatalogGrid.innerHTML = '';
    const q = searchQuery.toLowerCase().trim();

    // Get all brands across all categories, or filtered by selected category
    let brandsToDisplay = [];

    categoriesData.forEach(cat => {
      if (activeCategory === 'all' || activeCategory === cat.id) {
        cat.brands.forEach(b => {
          brandsToDisplay.push({
            ...b,
            categoryId: cat.id,
            categoryName: cat.name,
          });
        });
      }
    });

    // Deduplicate brands across categories if needed (e.g. Fenty in Makeup & Lip Care)
    const seen = new Set();
    const uniqueBrands = [];
    brandsToDisplay.forEach(b => {
      if (!seen.has(b.name)) {
        seen.add(b.name);
        uniqueBrands.push(b);
      }
    });

    // Search filter
    const filtered = uniqueBrands.filter(b => {
      return q === '' || b.name.toLowerCase().includes(q);
    });

    if (filtered.length === 0) {
      brandCatalogGrid.innerHTML = `
        <div style="text-align: center; width: 100%; padding: 40px 20px; color: var(--color-muted); font-size: 0.88rem;">
          No brands found matching "<strong>${escapeHtml(searchQuery)}</strong>".
        </div>
      `;
      return;
    }

    // Sort: Priority launch first, then alphabetical
    filtered.sort((a, b) => {
      if (a.priority && !b.priority) return -1;
      if (!a.priority && b.priority) return 1;
      return a.name.localeCompare(b.name);
    });

    filtered.forEach(brand => {
      const isSelected = selectedBrands.has(brand.name);
      const pill = document.createElement('div');
      pill.className = `brand-card-pill ${isSelected ? 'selected' : ''}`;
      pill.dataset.name = brand.name;

      let badgeHtml = '';
      if (brand.badge) {
        badgeHtml = `<span class="pill-badge">${escapeHtml(brand.badge)}</span>`;
      } else if (brand.origin === 'Canada') {
        badgeHtml = `<span class="pill-badge">Canada</span>`;
      }

      pill.innerHTML = `
        <span class="pill-check-icon">✓</span>
        <span class="pill-title">${escapeHtml(brand.name)}</span>
        ${badgeHtml}
      `;

      pill.addEventListener('click', () => {
        toggleBrand(brand);
      });

      brandCatalogGrid.appendChild(pill);
    });
  }

  function toggleBrand(brand) {
    if (selectedBrands.has(brand.name)) {
      selectedBrands.delete(brand.name);
    } else {
      selectedBrands.set(brand.name, {
        name: brand.name,
        category: brand.categoryId,
        origin: brand.origin,
        priority: brand.priority,
      });
    }

    updateSelectionUI();
    renderBrands();
  }

  function updateSelectionUI() {
    const count = selectedBrands.size;

    if (count === 0) {
      selectedCountText.textContent = '0 brands chosen';
      submitWishlistBtn.disabled = true;
      submitWishlistBtn.querySelector('.btn-caption').textContent = 'Select at least 1 brand';
      clearAllBtn.style.display = 'none';
    } else {
      const label = count === 1 ? '1 brand chosen' : `${count} brands chosen`;
      selectedCountText.textContent = label;
      submitWishlistBtn.disabled = false;
      submitWishlistBtn.querySelector('.btn-caption').textContent = `Submit My Wishlist (${count})`;
      clearAllBtn.style.display = 'inline-block';
    }
  }

  function setupEvents() {
    // Search input
    brandSearchInput.addEventListener('input', e => {
      searchQuery = e.target.value;
      clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
      renderBrands();
    });

    clearSearchBtn.addEventListener('click', () => {
      brandSearchInput.value = '';
      searchQuery = '';
      clearSearchBtn.style.display = 'none';
      renderBrands();
      brandSearchInput.focus();
    });

    // Category Tabs
    categoryTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        categoryTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeCategory = tab.dataset.cat;
        renderBrands();
      });
    });

    // Clear all
    clearAllBtn.addEventListener('click', () => {
      selectedBrands.clear();
      updateSelectionUI();
      renderBrands();
    });

    // Submit Wishlist
    submitWishlistBtn.addEventListener('click', async () => {
      if (selectedBrands.size === 0) return;

      const customRequests = document.getElementById('customRequests').value.trim();
      const contactInfo = document.getElementById('contactInfo').value.trim();

      const payload = {
        respondentName: contactInfo || 'VIP Customer',
        contactInfo: contactInfo || 'N/A',
        customRequests: customRequests || '',
        shoppingFrequency: 'Online buyer',
        selectedCategories: Array.from(new Set(Array.from(selectedBrands.values()).map(b => b.category))),
        selectedBrands: Array.from(selectedBrands.values()),
      };

      submitWishlistBtn.disabled = true;
      submitWishlistBtn.querySelector('.btn-caption').textContent = 'Saving wishlist...';

      try {
        await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.warn('Saved offline:', err);
      }

      showSuccess(payload);
    });

    // Share buttons
    copyShareBtn.addEventListener('click', () => {
      const url = window.location.origin;
      navigator.clipboard.writeText(url).then(() => {
        copiedToast.style.display = 'block';
        setTimeout(() => (copiedToast.style.display = 'none'), 3000);
      });
    });
  }

  function showSuccess(payload) {
    votingSection.style.display = 'none';
    successScreen.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Summary pills
    finalBrandsList.innerHTML = '';
    payload.selectedBrands.forEach(b => {
      const tag = document.createElement('span');
      tag.className = 'summary-tag-pill';
      tag.textContent = `✓ ${b.name}`;
      finalBrandsList.appendChild(tag);
    });

    // WhatsApp share link
    const msg = encodeURIComponent(`Vote for your favorite brands to be included in the upcoming ADY SELECT USA & Canada shipment: ${window.location.origin}`);
    whatsappShareBtn.href = `https://wa.me/?text=${msg}`;
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
});
