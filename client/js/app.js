/* ========================================
   NOVA STORE — Main Application Logic (Tailwind)
   ======================================== */

const App = (() => {
  // ── Navbar ──
  function initNavbar() {
    const navbar = document.getElementById('navbar');
    const toggle = document.getElementById('nav-toggle');
    const links = document.getElementById('nav-links') || document.querySelector('nav ul');

    // Scroll effect
    window.addEventListener('scroll', () => {
      if (navbar) {
        if (window.scrollY > 50) {
          navbar.classList.add('bg-dark/95', 'shadow-[0_4px_30px_rgba(0,0,0,0.3)]');
          navbar.classList.remove('bg-transparent');
        } else {
          navbar.classList.remove('bg-dark/95', 'shadow-[0_4px_30px_rgba(0,0,0,0.3)]');
        }
      }
    });

    // Mobile toggle
    if (toggle && links) {
      toggle.addEventListener('click', () => {
        const isActive = links.classList.contains('active-menu');
        if (!isActive) {
          links.className = 'active-menu flex flex-col absolute top-[72px] left-0 w-full bg-dark/95 pb-6 border-b border-glass-border px-6 gap-6 z-50 shadow-2xl';
          const spans = toggle.querySelectorAll('span');
          spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
          spans[1].style.opacity = '0';
          spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
        } else {
          links.className = 'hidden lg:flex items-center gap-8';
          const spans = toggle.querySelectorAll('span');
          spans[0].style.transform = '';
          spans[1].style.opacity = '';
          spans[2].style.transform = '';
        }
      });
    }

    // Global search
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && searchInput.value.trim()) {
          window.location.href = `products.html?search=${encodeURIComponent(searchInput.value.trim())}`;
        }
      });
    }

    updateCartBadge();
    updateAuthUI();

    // Re-render DATA only once backend is ready (no handler re-attachment)
    document.addEventListener('api:ready', () => {
      updateCartBadge();
      const page = document.body.dataset.page;
      switch (page) {
        case 'home':           renderFeaturedProducts(); renderCategories(); break;
        case 'products':       renderProductList(getCurrentFilters()); renderProductFilters(_getUrlCategory()); break;
        case 'product-detail': initProductDetail(); break;
        case 'cart':           renderCart(); break;
        case 'checkout':       renderCheckoutSummary(); break;
      }
    });
  }

  // ── Cart Badge ──
  function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    const cart = API.getCart();
    if (badge) {
      if (cart.itemCount > 0) {
        badge.textContent = cart.itemCount;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  // ── Auth UI ──
  function updateAuthUI() {
    const authBtn = document.getElementById('auth-btn');
    if (!authBtn) return;
    const user = API.getCurrentUser();
    if (user) {
      authBtn.innerHTML = `<span title="${user.name}">👤</span>`;
      authBtn.onclick = () => {
        if (confirm('Deseja sair?')) {
          API.logout();
          window.location.reload();
        }
      };
    } else {
      authBtn.innerHTML = '👤';
      authBtn.onclick = () => { window.location.href = 'login.html'; };
    }
  }

  // ── Toast ──
  function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container fixed bottom-6 right-6 flex flex-col gap-3 z-[9999]';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const borderClass = type === 'success' ? 'border-primary/50' : 'border-danger/50';
    const icon = type === 'success'
      ? '<i data-lucide="check-circle" class="w-5 h-5 text-primary shrink-0"></i>'
      : '<i data-lucide="x-circle" class="w-5 h-5 text-red-400 shrink-0"></i>';
    toast.className = `flex items-center gap-3 px-5 py-3.5 bg-card border ${borderClass} rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] transform transition-all duration-300 translate-y-5 opacity-0`;
    toast.innerHTML = `${icon}<span class="text-sm font-medium text-white">${message}</span>`;
    container.appendChild(toast);
    if (window.lucide) lucide.createIcons({ nodes: [toast] });
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-5', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
    });
    setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-5', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ── Render Stars ──
  function renderStars(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    let html = '';
    for (let i = 0; i < full; i++) html += '★';
    if (half) html += '★';
    for (let i = full + (half ? 1 : 0); i < 5; i++) html += '☆';
    return html;
  }

  // ── Format Price ──
  function formatPrice(value) {
    return 'R$ ' + value.toFixed(2).replace('.', ',');
  }

  // ── Product Card HTML ──
  function productCardHTML(product) {
    const discount = Math.round((1 - product.price / product.originalPrice) * 100);
    return `
      <div class="bg-card border border-glass-border rounded-2xl overflow-hidden hover:-translate-y-1.5 hover:shadow-card hover:border-primary transition-all duration-300 group opacity-0 translate-y-5 fade-in-tailwind flex flex-col h-full" data-id="${product.id}">
        <div class="relative w-full h-[240px] overflow-hidden shrink-0 bg-dark">
          <img src="${product.image}" alt="${product.name}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
          ${product.badge ? `<span class="absolute top-3 left-3 bg-gradient-accent text-black text-xs font-bold px-3 py-1 rounded-full shadow-glow z-10">${product.badge}</span>` : ''}
          <div class="absolute top-3 right-3 flex flex-col gap-2 opacity-0 translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 z-10">
            <button class="w-10 h-10 flex items-center justify-center bg-black/50 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-primary hover:border-primary transition-colors hover:scale-110 shadow-lg" onclick="App.quickAddToCart('${product.id}')" title="Adicionar ao carrinho"><i data-lucide="shopping-cart" class="w-4 h-4"></i></button>
            <button class="w-10 h-10 flex items-center justify-center bg-black/50 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-primary hover:border-primary transition-colors hover:scale-110 shadow-lg" onclick="window.location.href='product-detail.html?id=${product.id}'" title="Ver detalhes"><i data-lucide="eye" class="w-4 h-4"></i></button>
          </div>
        </div>
        <div class="p-5 flex flex-col flex-1">
          <div class="text-[0.7rem] font-bold uppercase tracking-widest text-primary-light mb-1">${product.category}</div>
          <h3 class="text-base font-bold mb-3 line-clamp-2 leading-snug">
            <a href="product-detail.html?id=${product.id}" class="hover:text-primary transition-colors">${product.name}</a>
          </h3>
          <div class="flex items-center gap-2 mb-4 mt-auto">
            <span class="text-accent text-sm">${renderStars(product.rating)}</span>
            <span class="text-xs text-text-muted font-medium">${product.rating} (${product.reviews})</span>
          </div>
          <div class="flex items-end gap-3 mb-4">
            <span class="text-xl font-black text-white leading-none">${formatPrice(product.price)}</span>
            <span class="text-sm text-text-muted line-through font-medium leading-none">${formatPrice(product.originalPrice)}</span>
          </div>
          <button class="w-full flex items-center justify-center gap-2 bg-text-muted/10 hover:bg-primary border border-glass-border hover:border-primary text-text-primary hover:text-white text-sm font-bold rounded-xl py-3.5 transition-all duration-300 mt-2" onclick="App.quickAddToCart('${product.id}')">
            <i data-lucide="shopping-cart" class="w-4 h-4"></i> Adicionar ao Carrinho
          </button>
        </div>
      </div>
    `;
  }

  // ── Quick Add to Cart ──
  async function quickAddToCart(productId) {
    await API.addToCart(productId, 1);
    updateCartBadge();
    showToast('Produto adicionado ao carrinho!');
  }

  // ── Scroll Animations ──
  function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const animType = entry.target.dataset.anim || 'up';
        let hiddenClasses, visibleClasses;

        if (animType === 'up') {
          hiddenClasses = ['opacity-0', 'translate-y-5'];
          visibleClasses = ['opacity-100', 'translate-y-0'];
        } else if (animType === 'left') {
          hiddenClasses = ['opacity-0', '-translate-x-10'];
          visibleClasses = ['opacity-100', 'translate-x-0'];
        } else if (animType === 'right') {
          hiddenClasses = ['opacity-0', 'translate-x-10'];
          visibleClasses = ['opacity-100', 'translate-x-0'];
        }

        if (entry.isIntersecting) {
          entry.target.classList.remove(...hiddenClasses);
          entry.target.classList.add(...visibleClasses);
        } else {
          entry.target.classList.add(...hiddenClasses);
          entry.target.classList.remove(...visibleClasses);
        }
      });
    }, { threshold: 0.1 });

    setTimeout(() => {
      document.querySelectorAll('.fade-in-tailwind, .scroll-anim').forEach(el => observer.observe(el));
    }, 50);
  }

  // ═══════════════════════════════════════
  // HOME PAGE
  // ═══════════════════════════════════════
  function initHomePage() {
    renderFeaturedProducts();
    renderCategories();
    initNewsletter();
  }

  function renderFeaturedProducts() {
    const grid = document.getElementById('featured-products');
    if (!grid) return;
    const featured = API.getFeaturedProducts();
    grid.innerHTML = featured.map(p => productCardHTML(p)).join('');
    if (window.lucide) lucide.createIcons({ nodes: [grid] });
    initScrollAnimations();
  }

  function renderCategories() {
    const grid = document.getElementById('categories-grid');
    if (!grid) return;
    const categories = API.getCategories();
    grid.innerHTML = categories.map(c => `
      <a href="products.html?category=${encodeURIComponent(c.name)}" class="bg-card border border-glass-border rounded-2xl p-6 md:p-8 text-center hover:-translate-y-1.5 hover:border-primary hover:shadow-[0_0_40px_rgba(212,160,23,0.2)] transition-all duration-300 relative overflow-hidden group opacity-0 translate-y-5 fade-in-tailwind">
        <div class="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity duration-300 z-0"></div>
        <div class="flex justify-center mb-4 relative z-10 group-hover:scale-110 transition-transform duration-300"><i data-lucide="${c.icon}" class="w-12 h-12 text-primary"></i></div>
        <div class="text-sm font-bold text-white relative z-10">${c.name}</div>
        <div class="text-xs text-text-muted mt-1 font-medium relative z-10">${c.count} produtos</div>
      </a>
    `).join('');
    if (window.lucide) lucide.createIcons({ nodes: [grid] });
    initScrollAnimations();
  }

  function initNewsletter() {
    const form = document.getElementById('newsletter-form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('Inscrito com sucesso! 🎉');
      form.reset();
    });
  }

  // ═══════════════════════════════════════
  // PRODUCTS PAGE
  // ═══════════════════════════════════════
  // Helper: get current category from URL (for api:ready re-render)
  function _getUrlCategory() {
    return new URLSearchParams(window.location.search).get('category') || 'Todos';
  }

  function initProductsPage() {
    const currentCategory = _getUrlCategory();
    const currentSearch = new URLSearchParams(window.location.search).get('search') || '';
    renderProductFilters(currentCategory);
    renderProductList({ category: currentCategory, search: currentSearch });
    initProductSort();
    initPriceFilter();
    initFilterToggle();
    const searchInput = document.getElementById('global-search');
    if (currentSearch && searchInput) searchInput.value = currentSearch;
  }

  function renderProductFilters(activeCategory) {
    const container = document.getElementById('category-filters');
    if (!container) return;
    const categories = ['Todos', ...API.getCategories().map(c => c.name)];

    container.innerHTML = categories.map(c => `
      <label class="flex items-center gap-3 cursor-pointer group p-1.5 hover:bg-white/5 rounded-lg transition-colors">
        <input type="radio" name="category" value="${c}" ${c === activeCategory ? 'checked' : ''} class="w-4 h-4 accent-primary bg-dark border-glass-border focus:ring-0 focus:ring-offset-0 focus:outline-none cursor-pointer">
        <span class="text-sm transition-colors ${c === activeCategory ? 'font-bold text-white' : 'text-text-secondary group-hover:text-text-primary'}">${c}</span>
      </label>
    `).join('');

    container.querySelectorAll('input[name="category"]').forEach(input => {
      input.addEventListener('change', () => {
        const url = new URL(window.location);
        url.searchParams.set('category', input.value);
        window.history.pushState({}, '', url);
        renderProductList(getCurrentFilters());
      });
    });
  }

  function renderProductList(filters) {
    const grid = document.getElementById('products-grid');
    const count = document.getElementById('results-count');
    if (!grid) return;

    const { total, products } = API.getProducts(filters);
    if (count) count.innerHTML = `Mostrando <span class="font-bold text-white mx-1">${total}</span> produtos`;

    if (products.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-20 flex flex-col items-center justify-center text-center bg-card border border-glass-border rounded-2xl">
          <i data-lucide="search-x" class="w-16 h-16 text-text-muted mb-4 opacity-50"></i>
          <h2 class="text-xl font-bold mb-2 text-white">Nenhum produto encontrado</h2>
          <p class="text-text-muted text-sm max-w-sm">Tente ajustar os filtros ou buscar outro termo.</p>
        </div>
      `;
    } else {
      grid.innerHTML = products.map(p => productCardHTML(p)).join('');
      initScrollAnimations();
    }
    if (window.lucide) lucide.createIcons({ nodes: [grid] });
  }

  function getCurrentFilters() {
    const params = new URLSearchParams(window.location.search);
    const catInput = document.querySelector('input[name="category"]:checked');
    const sortSelect = document.getElementById('sort-select');
    const minPrice = document.getElementById('min-price');
    const maxPrice = document.getElementById('max-price');

    return {
      category: catInput ? catInput.value : params.get('category') || 'Todos',
      search: params.get('search') || '',
      sort: sortSelect ? sortSelect.value : '',
      minPrice: minPrice ? minPrice.value : '',
      maxPrice: maxPrice ? maxPrice.value : ''
    };
  }

  function initProductSort() {
    const select = document.getElementById('sort-select');
    if (!select) return;
    select.addEventListener('change', () => {
      renderProductList(getCurrentFilters());
    });
  }

  function initPriceFilter() {
    const btn = document.getElementById('apply-price');
    if (!btn) return;
    btn.addEventListener('click', () => {
      renderProductList(getCurrentFilters());
    });
  }

  function initFilterToggle() {
    const btn = document.getElementById('filter-toggle');
    const sidebar = document.getElementById('shop-sidebar');
    if (!btn || !sidebar) return;
    btn.addEventListener('click', () => {
      sidebar.classList.toggle('hidden');
      btn.innerHTML = !sidebar.classList.contains('hidden') ? '✕ Fechar Filtros' : '☰ Mostrar Filtros';
    });
  }

  // ═══════════════════════════════════════
  // PRODUCT DETAIL PAGE
  // ═══════════════════════════════════════
  function initProductDetail() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) return window.location.href = 'products.html';

    const data = API.getProduct(id);
    if (!data) return window.location.href = 'products.html';

    renderProductDetail(data.product);
    renderRelatedProducts(data.related);
  }

  function renderProductDetail(product) {
    const container = document.getElementById('product-detail');
    if (!container) return;

    const discount = Math.round((1 - product.price / product.originalPrice) * 100);

    container.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16 items-start fade-in-tailwind opacity-0 translate-y-5">
        <div class="flex flex-col gap-4">
          <div class="bg-card border border-glass-border rounded-3xl overflow-hidden shadow-card aspect-[4/5] relative group">
            <img id="main-product-img" src="${product.images[0]}" alt="${product.name}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
            ${product.badge ? `<span class="absolute top-5 left-5 bg-gradient-accent text-black text-sm font-bold px-4 py-1.5 rounded-full shadow-glow z-10">${product.badge}</span>` : ''}
          </div>
          <div class="grid grid-cols-4 gap-3 thumbs-grid">
            ${product.images.map((img, i) => `
              <div class="aspect-square bg-card border ${i === 0 ? 'border-primary shadow-[0_0_0_2px_rgba(212,160,23,0.3)]' : 'border-glass-border hover:border-primary/50'} rounded-xl overflow-hidden cursor-pointer transition-all duration-300" onclick="App.changeImage('${img}', this)">
                <img src="${img}" alt="Thumb" class="w-full h-full object-cover opacity-${i === 0 ? '100' : '60'} hover:opacity-100 transition-opacity">
              </div>
            `).join('')}
          </div>
        </div>
        <div class="flex flex-col py-2 lg:py-6">
          <div class="text-sm font-bold tracking-[3px] uppercase text-primary-light mb-4 flex items-center gap-2"><div class="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></div> ${product.category}</div>
          <h1 class="text-3xl md:text-5xl font-black text-white tracking-tight mb-4 leading-tight">${product.name}</h1>
          <div class="flex items-center gap-3 mb-8 pb-8 border-b border-glass-border">
            <span class="text-accent text-xl">${renderStars(product.rating)}</span>
            <span class="text-text-secondary text-base font-medium">${product.rating} — ${product.reviews} avaliações</span>
          </div>
          <div class="flex items-end gap-4 mb-6">
            <span class="text-5xl font-extrabold text-white tracking-tight">${formatPrice(product.price)}</span>
            <span class="text-xl text-text-muted line-through mb-1.5 font-semibold">${formatPrice(product.originalPrice)}</span>
            <span class="bg-gradient-accent text-black text-sm font-black px-3 py-1 rounded-full mb-1.5 ml-2 shadow-[0_4px_10px_rgba(245,158,11,0.3)]">-${discount}% OFF</span>
          </div>
          <p class="text-text-secondary text-lg leading-relaxed mb-8">${product.description}</p>
          <div class="flex flex-col gap-3 mb-8">
            ${product.features.map(f => `
              <div class="flex items-center gap-3 text-sm text-text-primary font-medium">
                <span class="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0"><i data-lucide="check" class="w-3 h-3"></i></span>
                ${f}
              </div>
            `).join('')}
          </div>
          <div class="flex items-center gap-6 mb-8 pt-8 border-t border-glass-border">
            <div class="flex items-center bg-card border border-glass-border rounded-xl w-fit p-1">
              <button onclick="App.changeQty(-1)" class="w-10 h-10 rounded-lg flex items-center justify-center text-text-secondary hover:bg-dark hover:text-white transition-colors"><i data-lucide="minus" class="w-4 h-4"></i></button>
              <span id="qty-value" class="w-12 text-center text-white font-bold text-lg">1</span>
              <button onclick="App.changeQty(1)" class="w-10 h-10 rounded-lg flex items-center justify-center text-text-secondary hover:bg-dark hover:text-white transition-colors"><i data-lucide="plus" class="w-4 h-4"></i></button>
            </div>
            <div class="text-sm text-text-muted leading-tight"><span class="text-green-400 font-bold flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-green-400"></div> Em estoque</span>Pronto para envio imediato</div>
          </div>
          <div class="flex flex-col sm:flex-row gap-4 mb-8">
            <button class="flex-[1] flex items-center justify-center gap-2 py-4 px-6 text-base font-semibold rounded-xl border border-glass-border hover:bg-card hover:border-primary hover:text-primary-light transition-all duration-300" onclick="App.addDetailToCart('${product.id}')">
              <i data-lucide="shopping-cart" class="w-5 h-5"></i> Add ao Carrinho
            </button>
            <button class="flex-[2] flex items-center justify-center gap-2 py-4 px-6 text-base font-semibold rounded-xl bg-gradient-primary text-black shadow-[0_4px_15px_rgba(212,160,23,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(212,160,23,0.4)] transition-all duration-300" onclick="App.buyNow('${product.id}')">
              <i data-lucide="zap" class="w-5 h-5"></i> Comprar Agora
            </button>
          </div>
          <div class="flex flex-col sm:flex-row sm:items-center justify-center gap-4 sm:gap-6 text-text-muted text-sm px-6 py-5 bg-card/40 border border-glass-border rounded-xl">
            <span class="flex items-center gap-2 font-medium"><i data-lucide="truck" class="w-4 h-4 text-primary"></i> Frete grátis acima de R$ 299,90</span>
            <span class="hidden sm:block w-1.5 h-1.5 bg-text-muted/30 rounded-full"></span>
            <span class="flex items-center gap-2 font-medium"><i data-lucide="refresh-cw" class="w-4 h-4 text-primary"></i> 30 dias para troca</span>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons({ nodes: [container] });
    initScrollAnimations();
  }

  let currentQty = 1;
  function changeQty(delta) {
    currentQty = Math.max(1, Math.min(10, currentQty + delta));
    const el = document.getElementById('qty-value');
    if (el) el.textContent = currentQty;
  }

  async function addDetailToCart(productId) {
    await API.addToCart(productId, currentQty);
    updateCartBadge();
    showToast(`${currentQty}x produto adicionado ao carrinho!`);
  }

  async function buyNow(productId) {
    await API.addToCart(productId, currentQty);
    window.location.href = 'cart.html';
  }

  function changeImage(src, thumbEl) {
    const mainImg = document.getElementById('main-product-img');
    if (mainImg) mainImg.src = src;

    // Remove primary border from all thumbs
    document.querySelectorAll('.thumbs-grid > div').forEach(t => {
      t.className = "aspect-square bg-card border border-glass-border hover:border-primary/50 rounded-xl overflow-hidden cursor-pointer transition-all duration-300";
      t.querySelector('img').className = "w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity";
    });

    // Add primary border to active thumb
    if (thumbEl) {
      thumbEl.className = "aspect-square bg-card border border-primary shadow-[0_0_0_2px_rgba(99,102,241,0.3)] rounded-xl overflow-hidden cursor-pointer transition-all duration-300";
      thumbEl.querySelector('img').className = "w-full h-full object-cover opacity-100 transition-opacity";
    }
  }

  function renderRelatedProducts(related) {
    const grid = document.getElementById('related-products');
    if (!grid || related.length === 0) return;
    grid.innerHTML = related.map(p => productCardHTML(p)).join('');
    initScrollAnimations();
  }

  // ═══════════════════════════════════════
  // CART PAGE
  // ═══════════════════════════════════════
  function initCartPage() {
    renderCart();
  }

  function renderCart() {
    const container = document.getElementById('cart-items');
    const summaryContainer = document.getElementById('cart-summary');
    if (!container) return;

    const cart = API.getCart();

    if (cart.items.length === 0) {
      container.innerHTML = `
        <div class="col-span-full py-20 flex flex-col items-center justify-center text-center bg-card border border-glass-border rounded-2xl opacity-0 translate-y-5 fade-in-tailwind shadow-card">
          <div class="w-24 h-24 bg-black/40 rounded-full flex items-center justify-center mb-6 border border-glass-border">
            <i data-lucide="shopping-cart" class="w-10 h-10 text-text-muted"></i>
          </div>
          <h2 class="text-2xl font-bold mb-3 text-white">Seu carrinho está vazio</h2>
          <p class="text-text-muted mb-8 max-w-sm">Adicione produtos incríveis ao seu carrinho e aproveite nossas ofertas!</p>
          <a href="products.html" class="inline-flex items-center justify-center gap-2 py-3.5 px-8 text-base font-semibold rounded-xl bg-gradient-primary text-black shadow-[0_4px_15px_rgba(212,160,23,0.3)] hover:-translate-y-0.5 transition-all duration-300">
            Ver Produtos
          </a>
        </div>
      `;
      if (summaryContainer) summaryContainer.style.display = 'none';
      if (window.lucide) lucide.createIcons({ nodes: [container] });
      initScrollAnimations();
      return;
    }

    container.innerHTML = `<div class="flex flex-col gap-4">` + cart.items.map(item => `
      <div class="flex flex-col sm:flex-row items-center gap-5 p-4 sm:p-5 bg-card border border-glass-border rounded-2xl shadow-card opacity-0 translate-y-5 fade-in-tailwind hover:border-primary/50 transition-colors" data-id="${item.id}">
        <div class="w-full sm:w-24 h-32 sm:h-24 shrink-0 bg-dark rounded-xl overflow-hidden border border-glass-border">
          <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover">
        </div>
        <div class="flex-1 min-w-0 flex flex-col items-center sm:items-start text-center sm:text-left">
          <h3 class="text-base sm:text-lg font-bold text-white truncate w-full mb-1 hover:text-primary transition-colors cursor-pointer" onclick="window.location.href='product-detail.html?id=${item.id}'">${item.name}</h3>
        </div>
        <div class="flex flex-col sm:flex-row items-center gap-5 sm:gap-6 mt-4 sm:mt-0">
            <div class="flex items-center bg-dark border border-glass-border rounded-lg p-0.5">
            <button onclick="App.updateCartQty('${item.id}', ${item.quantity - 1})" class="w-10 h-10 rounded-md flex items-center justify-center text-text-secondary hover:bg-card hover:text-white transition-colors"><i data-lucide="minus" class="w-4 h-4"></i></button>
            <span class="w-10 text-center text-sm font-bold text-white">${item.quantity}</span>
            <button onclick="App.updateCartQty('${item.id}', ${item.quantity + 1})" class="w-10 h-10 rounded-md flex items-center justify-center text-text-secondary hover:bg-card hover:text-white transition-colors"><i data-lucide="plus" class="w-4 h-4"></i></button>
            </div>
            <div class="flex flex-col items-center sm:items-end gap-1.5 w-[110px]">
            <div class="font-black text-lg text-white tracking-tight">${formatPrice(item.price * item.quantity)}</div>
            <button class="text-xs font-semibold text-red-400/70 hover:text-red-400 hover:underline transition-colors flex items-center gap-1" onclick="App.removeCartItem('${item.id}')"><i data-lucide="trash-2" class="w-3 h-3"></i> Remover</button>
            </div>
        </div>
      </div>
    `).join('') + `</div>`;

    if (window.lucide) lucide.createIcons({ nodes: [container] });
    initScrollAnimations();

    if (summaryContainer) {
      summaryContainer.style.display = '';
      summaryContainer.innerHTML = `
        <div class="bg-card border border-glass-border rounded-3xl p-6 sm:p-8 shadow-card opacity-0 translate-y-5 fade-in-tailwind" style="animation-delay: 0.2s">
            <h2 class="text-xl font-bold mb-6 pb-4 border-b border-glass-border text-white">Resumo do Pedido</h2>
            <div class="flex justify-between items-center mb-4 text-sm font-medium">
            <span class="text-text-secondary">Subtotal</span>
            <span class="text-white">${formatPrice(cart.subtotal)}</span>
            </div>
            <div class="flex justify-between items-center mb-4 text-sm font-medium text-green-400">
            <span>Economia</span>
            <span class="font-bold">-${formatPrice(cart.discount)}</span>
            </div>
            <div class="flex justify-between items-center mb-6 pb-6 text-sm font-medium border-b border-glass-border border-dashed">
            <span class="text-text-secondary">Frete</span>
            <span class="${cart.shipping === 0 ? 'text-green-400 font-bold uppercase tracking-wider text-xs bg-green-400/10 px-2 py-0.5 rounded' : 'text-white'}">${cart.shipping === 0 ? 'Grátis' : formatPrice(cart.shipping)}</span>
            </div>
            <div class="flex justify-between items-center mb-2">
            <span class="text-lg font-bold text-white">Total</span>
            <span class="text-3xl font-black text-gradient">${formatPrice(cart.total)}</span>
            </div>
            <div class="text-xs text-text-muted text-right mb-8 font-medium">
            ou 12x de <span class="text-white">${formatPrice(cart.total / 12)}</span> sem juros
            </div>
            <a href="checkout.html" class="inline-flex items-center justify-center w-full py-4 text-base font-semibold rounded-xl bg-gradient-primary text-black shadow-[0_4px_15px_rgba(212,160,23,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(212,160,23,0.4)] transition-all duration-300 mb-3">
                Finalizar Compra
            </a>
            <a href="products.html" class="inline-flex items-center justify-center w-full py-4 text-sm font-semibold rounded-xl border border-glass-border bg-transparent text-text-primary hover:bg-dark hover:border-primary transition-all duration-300">
                Continuar Comprando
            </a>
        </div>
      `;
      if (window.lucide) lucide.createIcons({ nodes: [summaryContainer] });
      initScrollAnimations();
    }
  }

  async function updateCartQty(itemId, qty) {
    await API.updateCartItem(itemId, qty);
    updateCartBadge();
    renderCart();
  }

  async function removeCartItem(itemId) {
    await API.removeFromCart(itemId);
    updateCartBadge();
    renderCart();
    showToast('Item removido do carrinho');
  }

  // ═══════════════════════════════════════
  // CHECKOUT PAGE
  // ═══════════════════════════════════════
  function initCheckoutPage() {
    renderCheckoutSummary();
    initCheckoutForm();
  }

  function renderCheckoutSummary() {
    const container = document.getElementById('checkout-summary');
    if (!container) return;

    const cart = API.getCart();
    if (cart.items.length === 0) {
      window.location.href = 'cart.html';
      return;
    }

    container.innerHTML = `
        <div class="bg-card flex flex-col border border-glass-border rounded-3xl p-6 sm:p-8 shadow-card opacity-0 translate-y-5 fade-in-tailwind">
            <h2 class="text-xl font-bold mb-6 pb-4 border-b border-glass-border text-white">Seu Pedido</h2>
            <div class="flex flex-col gap-4 mb-6 pb-6 border-b border-glass-border max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            ${cart.items.map(item => `
                <div class="flex gap-4 items-center">
                <div class="w-14 h-14 rounded-lg bg-dark border border-glass-border overflow-hidden shrink-0">
                    <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover">
                </div>
                <div class="flex-1 min-w-0">
                    <div class="text-sm font-bold text-white truncate">${item.name}</div>
                    <div class="text-xs font-semibold text-text-muted mt-0.5">Qtd: ${item.quantity}</div>
                </div>
                <div class="font-extrabold text-white text-sm shrink-0">${formatPrice(item.price * item.quantity)}</div>
                </div>
            `).join('')}
            </div>
            
            <div class="flex justify-between items-center mb-4 text-sm font-medium">
            <span class="text-text-secondary">Subtotal</span>
            <span class="text-white">${formatPrice(cart.subtotal)}</span>
            </div>
            <div class="flex justify-between items-center mb-6 pb-6 text-sm font-medium border-b border-glass-border border-dashed">
            <span class="text-text-secondary">Frete</span>
            <span class="${cart.shipping === 0 ? 'text-success font-bold uppercase tracking-wider text-xs bg-success/10 px-2 py-0.5 rounded' : 'text-white'}">${cart.shipping === 0 ? 'Grátis' : formatPrice(cart.shipping)}</span>
            </div>
            <div class="flex justify-between items-center mb-2">
            <span class="text-lg font-bold text-white">Total</span>
            <span class="text-2xl font-black text-gradient">${formatPrice(cart.total)}</span>
            </div>
            <div class="text-xs text-text-muted text-right font-medium">
            ou 12x de <span class="text-white">${formatPrice(cart.total / 12)}</span> sem juros
            </div>
        </div>
    `;
    initScrollAnimations();
  }

  function initCheckoutForm() {
    const form = document.getElementById('checkout-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const cart = API.getCart();
      const formData = new FormData(form);
      const shipping = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        city: formData.get('city'),
        state: formData.get('state'),
        zip: formData.get('zip')
      };

      const order = await API.createOrder({
        items: cart.items,
        subtotal: cart.subtotal,
        shipping: cart.shipping,
        total: cart.total,
        shippingAddress: shipping,
        payment: { method: formData.get('payment-method') || 'card' }
      });

      // Show success
      const layout = document.querySelector('.checkout-layout') || document.querySelector('main > div');

      layout.innerHTML = `
        <div class="w-full max-w-2xl mx-auto flex flex-col items-center justify-center text-center py-10 opacity-0 translate-y-5 fade-in-tailwind">
          <div class="w-24 h-24 bg-success/20 rounded-full flex items-center justify-center text-5xl mb-8 text-success shadow-[0_0_40px_rgba(16,185,129,0.3)] border border-success/30 relative">
            <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
            <div class="absolute inset-0 rounded-full border border-success/50 animate-ping opacity-20"></div>
          </div>
          <h1 class="text-4xl md:text-5xl font-black tracking-tight mb-4 text-white">Pedido Confirmado! 🎉</h1>
          <p class="text-text-secondary text-lg mb-2">Obrigado pela sua compra, ${shipping.name.split(' ')[0]}!</p>
          <p class="text-text-muted mb-10 font-mono bg-dark px-4 py-2 rounded-lg border border-glass-border">Pedido #${order.id.slice(-8).toUpperCase()}</p>
          
          <div class="w-full bg-card border border-glass-border rounded-3xl p-8 mb-10 text-left shadow-card">
            <h3 class="text-lg font-bold mb-6 text-white pb-4 border-b border-glass-border">Resumo da Operação</h3>
            <div class="flex justify-between items-center mb-4 text-sm font-medium">
              <span class="text-text-secondary">Status</span>
              <span class="text-success font-bold flex items-center gap-2"><div class="w-2 h-2 rounded-full bg-success"></div> ${order.status}</span>
            </div>
            <div class="flex justify-between items-center mb-4 text-sm font-medium">
              <span class="text-text-secondary">Itens</span>
              <span class="text-white font-bold">${order.items.length} produto(s)</span>
            </div>
            <div class="flex justify-between items-center pt-4 mt-4 border-t border-glass-border border-dashed">
              <span class="text-base font-bold text-text-primary">Total Pago</span>
              <span class="text-xl font-black text-white">${formatPrice(order.total)}</span>
            </div>
          </div>
          
          <a href="index.html" class="inline-flex items-center justify-center py-4 px-10 text-base font-semibold rounded-xl border border-glass-border bg-transparent text-text-primary hover:bg-card hover:border-primary transition-all duration-300">Voltar para Home</a>
        </div>
      `;

      updateCartBadge();
      initScrollAnimations();
    });
  }

  // ═══════════════════════════════════════
  // INIT
  // ═══════════════════════════════════════
  function init() {
    initNavbar();

    const page = document.body.dataset.page;
    switch (page) {
      case 'home': initHomePage(); break;
      case 'products': initProductsPage(); break;
      case 'product-detail': initProductDetail(); break;
      case 'cart': initCartPage(); break;
      case 'checkout': initCheckoutPage(); break;
    }
  }

  // Run on DOM ready
  document.addEventListener('DOMContentLoaded', init);

  // Public API
  return {
    quickAddToCart,
    changeQty,
    addDetailToCart,
    buyNow,
    changeImage,
    updateCartQty,
    removeCartItem,
    showToast,
    formatPrice
  };
})();
