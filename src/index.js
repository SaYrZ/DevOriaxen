const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const PRODUCTS_PATH = path.join(__dirname, '..', 'static', 'products.json');

app.use(express.static(path.join(__dirname, '..', 'static')));

app.get('/api/products', (req, res) => {
    fs.readFile(PRODUCTS_PATH, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to load products' });
        }
        try {
            const products = JSON.parse(data);
            res.json(products);
        } catch (parseErr) {
            res.status(500).json({ error: 'Invalid products data' });
        }
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'static', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
