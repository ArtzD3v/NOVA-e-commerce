const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// In-memory orders
const orders = {};

// In-memory carts reference (shared concept)
const carts = {};

function getCart(req) {
    const token = req.headers['x-auth-token'] || 'guest';
    return { token, items: carts[token] || [] };
}

// POST /api/orders — create order from cart
router.post('/', (req, res) => {
    const token = req.headers['x-auth-token'] || 'guest';
    const { shipping, payment } = req.body;

    // We read cart from the request body since cart is managed separately
    const { items, subtotal, total } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ error: 'Carrinho vazio' });
    }

    const order = {
        id: uuidv4(),
        items,
        shipping: shipping || {},
        payment: payment ? { method: payment.method, last4: payment.cardNumber ? payment.cardNumber.slice(-4) : '****' } : {},
        subtotal,
        total,
        status: 'Confirmado',
        createdAt: new Date().toISOString()
    };

    if (!orders[token]) orders[token] = [];
    orders[token].push(order);

    res.status(201).json(order);
});

// GET /api/orders — list user orders
router.get('/', (req, res) => {
    const token = req.headers['x-auth-token'] || 'guest';
    res.json(orders[token] || []);
});

// GET /api/orders/:id
router.get('/:id', (req, res) => {
    const token = req.headers['x-auth-token'] || 'guest';
    const userOrders = orders[token] || [];
    const order = userOrders.find(o => o.id === req.params.id);
    if (!order) {
        return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    res.json(order);
});

module.exports = router;
