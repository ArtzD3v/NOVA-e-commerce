const express = require('express');
const router = express.Router();
const products = require('../data/products.json');

// GET /api/products — list all products with optional filters
router.get('/', (req, res) => {
    let result = [...products];
    const { category, search, sort, minPrice, maxPrice } = req.query;

    // Filter by category
    if (category && category !== 'Todos') {
        result = result.filter(p => p.category === category);
    }

    // Search by name or description
    if (search) {
        const q = search.toLowerCase();
        result = result.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q)
        );
    }

    // Filter by price range
    if (minPrice) {
        result = result.filter(p => p.price >= parseFloat(minPrice));
    }
    if (maxPrice) {
        result = result.filter(p => p.price <= parseFloat(maxPrice));
    }

    // Sort
    if (sort) {
        switch (sort) {
            case 'price-asc':
                result.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                result.sort((a, b) => b.price - a.price);
                break;
            case 'rating':
                result.sort((a, b) => b.rating - a.rating);
                break;
            case 'name':
                result.sort((a, b) => a.name.localeCompare(b.name));
                break;
        }
    }

    res.json({
        total: result.length,
        products: result
    });
});

// GET /api/products/categories — list all categories
router.get('/categories', (req, res) => {
    const categories = [...new Set(products.map(p => p.category))];
    res.json(categories);
});

// GET /api/products/:id — single product
router.get('/:id', (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) {
        return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Get related products (same category, exclude current)
    const related = products
        .filter(p => p.category === product.category && p.id !== product.id)
        .slice(0, 4);

    res.json({ product, related });
});

module.exports = router;
