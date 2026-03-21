const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const products = require('../data/products.json');

// In-memory cart storage (keyed by session/token)
const carts = {};

function getCart(req) {
    const token = req.headers['x-auth-token'] || 'guest';
    if (!carts[token]) {
        carts[token] = [];
    }
    return { token, items: carts[token] };
}

function calculateTotals(items) {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = subtotal > 299.90 ? 0 : 29.90;
    const discount = items.reduce((sum, item) => {
        return sum + (item.originalPrice - item.price) * item.quantity;
    }, 0);
    return {
        subtotal: parseFloat(subtotal.toFixed(2)),
        shipping: parseFloat(shipping.toFixed(2)),
        discount: parseFloat(discount.toFixed(2)),
        total: parseFloat((subtotal + shipping).toFixed(2))
    };
}

// GET /api/cart
router.get('/', (req, res) => {
    const { items } = getCart(req);
    res.json({
        items,
        ...calculateTotals(items),
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0)
    });
});

// POST /api/cart — add item
router.post('/', (req, res) => {
    const { productId, quantity = 1 } = req.body;
    const { token, items } = getCart(req);

    const product = products.find(p => p.id === productId);
    if (!product) {
        return res.status(404).json({ error: 'Produto não encontrado' });
    }

    const existing = items.find(item => item.productId === productId);
    if (existing) {
        existing.quantity += quantity;
    } else {
        items.push({
            id: uuidv4(),
            productId: product.id,
            name: product.name,
            price: product.price,
            originalPrice: product.originalPrice,
            image: product.image,
            quantity
        });
    }

    carts[token] = items;

    res.json({
        items,
        ...calculateTotals(items),
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0)
    });
});

// PUT /api/cart/:itemId — update quantity
router.put('/:itemId', (req, res) => {
    const { quantity } = req.body;
    const { token, items } = getCart(req);

    const item = items.find(i => i.id === req.params.itemId);
    if (!item) {
        return res.status(404).json({ error: 'Item não encontrado no carrinho' });
    }

    if (quantity <= 0) {
        carts[token] = items.filter(i => i.id !== req.params.itemId);
    } else {
        item.quantity = quantity;
    }

    const updatedItems = carts[token];
    res.json({
        items: updatedItems,
        ...calculateTotals(updatedItems),
        itemCount: updatedItems.reduce((sum, item) => sum + item.quantity, 0)
    });
});

// DELETE /api/cart/:itemId — remove item
router.delete('/:itemId', (req, res) => {
    const { token, items } = getCart(req);
    carts[token] = items.filter(i => i.id !== req.params.itemId);

    const updatedItems = carts[token];
    res.json({
        items: updatedItems,
        ...calculateTotals(updatedItems),
        itemCount: updatedItems.reduce((sum, item) => sum + item.quantity, 0)
    });
});

// DELETE /api/cart — clear cart
router.delete('/', (req, res) => {
    const { token } = getCart(req);
    carts[token] = [];
    res.json({ items: [], subtotal: 0, shipping: 0, discount: 0, total: 0, itemCount: 0 });
});

module.exports = router;
