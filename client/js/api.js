/* ========================================
   NOVA STORE — API Client (Hybrid Mode)
   - Sync reads via local cache (compatible with app.js)
   - Async writes to Python/FastAPI backend at :8000
   - Cache is populated on page load from the backend
   ======================================== */

const API = (() => {
    const BASE = 'http://localhost:8000/api';

    // ── State / Cache ─────────────────────────────────────────────────────
    let _products = [];
    let _cart = { items: [], subtotal: 0, shipping: 0, discount: 0, total: 0, itemCount: 0 };
    let _ready = false;

    const CATEGORY_ICONS = {
        'Eletrônicos': 'laptop', 'Moda': 'shirt', 'Esportes': 'medal',
        'Casa': 'home', 'Acessórios': 'watch',
    };

    // ── LocalStorage Helpers ─────────────────────────────────────────────
    function getStore(key, fallback) {
        try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
    }
    function setStore(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

    // ── HTTP Helpers ──────────────────────────────────────────────────────
    function getToken() { return localStorage.getItem('nova_token'); }

    function getHeaders() {
        const h = { 'Content-Type': 'application/json' };
        const t = getToken();
        if (t) h['x-auth-token'] = t;
        return h;
    }

    async function req(method, path, body = null) {
        const opts = { method, headers: getHeaders() };
        if (body) opts.body = JSON.stringify(body);
        try {
            const res = await fetch(`${BASE}${path}`, opts);
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.detail || data.error || 'Erro');
            return data;
        } catch (e) {
            console.warn(`[API] ${method} ${path} failed:`, e.message);
            return null;
        }
    }

    // ── Boot: load products + cart from backend ────────────────────────────
    async function _boot() {
        try {
            const [prodData, cartData] = await Promise.all([
                fetch(`${BASE}/products`).then(r => r.json()).catch(() => null),
                fetch(`${BASE}/cart`, { headers: getHeaders() }).then(r => r.json()).catch(() => null),
            ]);
            if (prodData?.products) _products = prodData.products;
            if (cartData?.items)   _cart = cartData;
        } catch (e) {
            console.warn('[API] Boot failed, using empty data.', e.message);
        }
        _ready = true;
        document.dispatchEvent(new CustomEvent('api:ready'));
    }

    // Kick off boot immediately
    _boot().then(() => {
        // Re-render the page once data is loaded
        if (window.App && typeof window.App._rerender === 'function') {
            window.App._rerender();
        }
    });

    // ── Product Methods (sync — use cache) ────────────────────────────────
    function getProducts(filters = {}) {
        let result = [..._products];

        if (filters.category && filters.category !== 'Todos') {
            result = result.filter(p => p.category === filters.category);
        }
        if (filters.search) {
            const q = filters.search.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(q) ||
                (p.description || '').toLowerCase().includes(q)
            );
        }
        if (filters.minPrice) result = result.filter(p => p.price >= parseFloat(filters.minPrice));
        if (filters.maxPrice) result = result.filter(p => p.price <= parseFloat(filters.maxPrice));

        if (filters.sort) {
            switch (filters.sort) {
                case 'price-asc':  result.sort((a, b) => a.price - b.price); break;
                case 'price-desc': result.sort((a, b) => b.price - a.price); break;
                case 'rating':     result.sort((a, b) => b.rating - a.rating); break;
                case 'name':       result.sort((a, b) => a.name.localeCompare(b.name)); break;
            }
        }
        return { total: result.length, products: result };
    }

    function getProduct(id) {
        const product = _products.find(p => p.id === id);
        if (!product) return null;
        const related = _products.filter(p => p.category === product.category && p.id !== id).slice(0, 4);
        return { product, related };
    }

    function getCategories() {
        const names = [...new Set(_products.map(p => p.category))].sort();
        return names.map(name => ({ name, icon: CATEGORY_ICONS[name] || 'shopping-bag', count: _products.filter(p => p.category === name).length }));
    }

    function getFeaturedProducts() {
        return _products.filter(p => p.badge === 'Mais Vendido' || p.badge === 'Premium' || p.rating >= 4.8);
    }

    // ── Cart Methods (sync reads, async writes) ────────────────────────────
    function getCart() { return _cart; }

    async function _refreshCart() {
        const data = await req('GET', '/cart');
        if (data) _cart = data;
        return _cart;
    }

    async function addToCart(productId, qty = 1) {
        const data = await req('POST', '/cart', { productId, quantity: qty });
        if (data) _cart = data;
        return _cart;
    }

    async function updateCartItem(itemId, quantity) {
        const data = await req('PUT', `/cart/${itemId}`, { quantity });
        if (data) _cart = data;
        return _cart;
    }

    async function removeFromCart(itemId) {
        const data = await req('DELETE', `/cart/${itemId}`);
        if (data) _cart = data;
        return _cart;
    }

    async function clearCart() {
        const data = await req('DELETE', '/cart');
        _cart = { items: [], subtotal: 0, shipping: 0, discount: 0, total: 0, itemCount: 0 };
        return _cart;
    }

    // ── Auth Methods ───────────────────────────────────────────────────────
    async function register(name, email, password) {
        const data = await req('POST', '/auth/register', { name, email, password });
        if (data?.token) {
            setStore('nova_token', data.token);
            setStore('nova_user', data.user);
        }
        return data || { error: 'Erro ao registrar' };
    }

    async function login(email, password) {
        const data = await req('POST', '/auth/login', { email, password });
        if (data?.token) {
            setStore('nova_token', data.token);
            setStore('nova_user', data.user);
        }
        return data || { error: 'E-mail ou senha inválidos' };
    }

    function logout() {
        localStorage.removeItem('nova_token');
        localStorage.removeItem('nova_user');
    }

    function getCurrentUser() { return getStore('nova_user', null); }
    function isLoggedIn() { return !!getStore('nova_token', null); }

    // ── Order Methods ──────────────────────────────────────────────────────
    async function createOrder(orderData) {
        const data = await req('POST', '/orders', orderData);
        if (data) _cart = { items: [], subtotal: 0, shipping: 0, discount: 0, total: 0, itemCount: 0 };
        return data || { error: 'Erro ao criar pedido' };
    }

    async function getOrders() {
        return (await req('GET', '/orders')) || [];
    }

    // ── Public API ─────────────────────────────────────────────────────────
    return {
        // Sync (cache-based)
        getProducts, getProduct, getCategories, getFeaturedProducts,
        getCart, getCurrentUser, isLoggedIn,
        // Async
        addToCart, updateCartItem, removeFromCart, clearCart,
        register, login, logout,
        createOrder, getOrders,
        // Utility
        isReady: () => _ready,
    };
})();
