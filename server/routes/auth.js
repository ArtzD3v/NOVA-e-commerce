const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// In-memory users
const users = [];

// POST /api/auth/register
router.post('/register', (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    if (users.find(u => u.email === email)) {
        return res.status(409).json({ error: 'E-mail já cadastrado' });
    }

    const user = {
        id: uuidv4(),
        name,
        email,
        password, // In production, hash this!
        createdAt: new Date().toISOString()
    };

    users.push(user);

    const token = uuidv4();

    res.status(201).json({
        token,
        user: { id: user.id, name: user.name, email: user.email }
    });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
        return res.status(401).json({ error: 'E-mail ou senha inválidos' });
    }

    const token = uuidv4();

    res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email }
    });
});

// GET /api/auth/me — get current user from token
router.get('/me', (req, res) => {
    const token = req.headers['x-auth-token'];
    if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }
    // In this simple demo, we just return a generic response
    res.json({ message: 'Autenticado' });
});

module.exports = router;
