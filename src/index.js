const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

const STATIC_PATH = path.join(__dirname, '..', 'static');
const PRODUCTS_FILE = path.join(STATIC_PATH, 'products.json');
const ENV_FILE = path.join(__dirname, '..', '.env');

let products = [];
let envConfig = {
    allowedIPs: ['127.0.0.1', '::1'],
    rateLimitWindow: 60000,
    rateLimitMax: 100
};

function loadEnv() {
    try {
        if (fs.existsSync(ENV_FILE)) {
            const envContent = fs.readFileSync(ENV_FILE, 'utf8');
            envContent.split('\n').forEach(line => {
                const [key, ...valueParts] = line.split('=');
                if (key && valueParts.length > 0) {
                    const value = valueParts.join('=').trim();
                    if (key.trim() === 'ALLOWED_IPS') {
                        envConfig.allowedIPs = value.split(',').map(ip => ip.trim());
                    } else if (key.trim() === 'RATE_LIMIT_WINDOW') {
                        envConfig.rateLimitWindow = parseInt(value) || 60000;
                    } else if (key.trim() === 'RATE_LIMIT_MAX') {
                        envConfig.rateLimitMax = parseInt(value) || 100;
                    }
                }
            });
        }
    } catch (err) {
        console.log('Using default environment config');
    }
}

function generateLinkId(title) {
    const hash = crypto.createHash('md5').update(title + Date.now()).digest('hex').substring(0, 8);
    return hash;
}

function loadProducts() {
    try {
        if (fs.existsSync(PRODUCTS_FILE)) {
            const data = fs.readFileSync(PRODUCTS_FILE, 'utf8');
            const parsed = JSON.parse(data);
            
            products = parsed.products.map((product, index) => {
                if (!product.linkId) {
                    product.linkId = generateLinkId(product.title);
                }
                if (!product.tags) {
                    product.tags = product.category ? [product.category] : [];
                }
                if (!product.reviews) {
                    product.reviews = [];
                }
                if (!product.order) {
                    product.order = index + 1;
                }
                if (!product.fullDescription) {
                    product.fullDescription = product.description || '';
                }
                if (!product.specifications) {
                    product.specifications = {};
                }
                return product;
            });
            
            products.sort((a, b) => a.order - b.order);
            saveProducts(products);
            console.log(`[${new Date().toISOString()}] Products loaded: ${products.length}`);
        }
    } catch (err) {
        console.error(`[${new Date().toISOString()}] Error loading products:`, err.message);
        products = [];
    }
}

function saveProducts(data) {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify({ products: data }, null, 4));
}

function initFileWatcher() {
    let debounceTimer;
    fs.watch(PRODUCTS_FILE, (eventType) => {
        if (eventType === 'change') {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                console.log(`[${new Date().toISOString()}] Products file changed, reloading...`);
                loadProducts();
            }, 500);
        }
    });
}

loadEnv();
loadProducts();
initFileWatcher();

const requestCounts = new Map();

function rateLimitMiddleware(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!requestCounts.has(ip)) {
        requestCounts.set(ip, { count: 1, resetTime: now + envConfig.rateLimitWindow });
        return next();
    }
    
    const clientData = requestCounts.get(ip);
    
    if (now > clientData.resetTime) {
        clientData.count = 1;
        clientData.resetTime = now + envConfig.rateLimitWindow;
        return next();
    }
    
    if (clientData.count >= envConfig.rateLimitMax) {
        console.log(`[${new Date().toISOString()}] Rate limit exceeded for IP: ${ip}`);
        return res.status(429).json({ error: 'Too many requests' });
    }
    
    clientData.count++;
    next();
}

function ipWhitelistMiddleware(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const forwarded = req.headers['x-forwarded-for'];
    const clientIP = forwarded ? forwarded.split(',')[0].trim() : ip;
    
    const isAllowed = envConfig.allowedIPs.some(allowedIP => {
        if (allowedIP === clientIP) return true;
        if (allowedIP.includes('/')) {
            return false;
        }
        return false;
    });
    
    if (!isAllowed && envConfig.allowedIPs.length > 0) {
        const allAllowed = envConfig.allowedIPs.includes('127.0.0.1') || 
                         envConfig.allowedIPs.includes('::1') ||
                         envConfig.allowedIPs.includes('0.0.0.0');
        if (!allAllowed) {
            console.log(`[${new Date().toISOString()}] Blocked request from IP: ${clientIP}`);
            return res.status(403).json({ error: 'Access denied' });
        }
    }
    
    next();
}

function loggingMiddleware(req, res, next) {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
    });
    
    next();
}

app.use(express.json());
app.use(loggingMiddleware);
app.use(rateLimitMiddleware);
// app.use(ipWhitelistMiddleware); // Disabled - allowing open access to products.json

app.use(express.static(STATIC_PATH));

app.get('/api/products', (req, res) => {
    const { tag, search, sort } = req.query;
    let filtered = [...products];
    
    if (tag) {
        filtered = filtered.filter(p => 
            p.tags && p.tags.some(t => t.toLowerCase() === tag.toLowerCase())
        );
    }
    
    if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(p => 
            p.title.toLowerCase().includes(searchLower) ||
            (p.description && p.description.toLowerCase().includes(searchLower)) ||
            (p.tags && p.tags.some(t => t.toLowerCase().includes(searchLower)))
        );
    }
    
    if (sort === 'price_asc') {
        filtered.sort((a, b) => parseFloat(a.price.replace(/[^0-9.]/g, '')) - parseFloat(b.price.replace(/[^0-9.]/g, '')));
    } else if (sort === 'price_desc') {
        filtered.sort((a, b) => parseFloat(b.price.replace(/[^0-9.]/g, '')) - parseFloat(a.price.replace(/[^0-9.]/g, '')));
    } else if (sort === 'rating') {
        filtered.sort((a, b) => getAverageRating(b) - getAverageRating(a));
    } else {
        filtered.sort((a, b) => a.order - b.order);
    }
    
    const tags = [...new Set(products.flatMap(p => p.tags || []))];
    
    res.json({
        products: filtered,
        tags: tags,
        total: filtered.length
    });
});

function getAverageRating(product) {
    if (!product.reviews || product.reviews.length === 0) return 0;
    const sum = product.reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return sum / product.reviews.length;
}

app.get('/api/products/:linkId', (req, res) => {
    const { linkId } = req.params;
    const product = products.find(p => p.linkId === linkId);
    
    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
});

app.post('/api/products', (req, res) => {
    const { title, description, fullDescription, price, category, tags, specifications, thumbnail } = req.body;
    
    if (!title || !price) {
        return res.status(400).json({ error: 'Title and price are required' });
    }
    
    const newProduct = {
        id: String(products.length + 1),
        title,
        description: description || '',
        fullDescription: fullDescription || description || '',
        price,
        category: category || 'Other',
        tags: tags || (category ? [category] : []),
        specifications: specifications || {},
        thumbnail: thumbnail || '',
        status: 'available',
        linkId: generateLinkId(title),
        reviews: [],
        order: products.length + 1
    };
    
    products.push(newProduct);
    saveProducts(products);
    
    console.log(`[${new Date().toISOString()}] Product added: ${title}`);
    res.status(201).json(newProduct);
});

app.put('/api/products/:linkId', (req, res) => {
    const { linkId } = req.params;
    const index = products.findIndex(p => p.linkId === linkId);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Product not found' });
    }
    
    const updates = req.body;
    delete updates.linkId;
    delete updates.id;
    
    products[index] = { ...products[index], ...updates };
    saveProducts(products);
    
    console.log(`[${new Date().toISOString()}] Product updated: ${products[index].title}`);
    res.json(products[index]);
});

app.delete('/api/products/:linkId', (req, res) => {
    const { linkId } = req.params;
    const index = products.findIndex(p => p.linkId === linkId);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Product not found' });
    }
    
    const deleted = products.splice(index, 1)[0];
    saveProducts(products);
    
    console.log(`[${new Date().toISOString()}] Product deleted: ${deleted.title}`);
    res.json({ success: true });
});

app.post('/api/products/:linkId/reviews', (req, res) => {
    const { linkId } = req.params;
    const { reviewerName, rating, reviewText } = req.body;
    
    const product = products.find(p => p.linkId === linkId);
    
    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }
    
    if (!reviewerName || !rating || !reviewText) {
        return res.status(400).json({ error: 'Reviewer name, rating, and review text are required' });
    }
    
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    const review = {
        id: String((product.reviews?.length || 0) + 1),
        reviewerName,
        rating,
        reviewText,
        date: new Date().toISOString().split('T')[0]
    };
    
    if (!product.reviews) {
        product.reviews = [];
    }
    
    product.reviews.push(review);
    saveProducts(products);
    
    console.log(`[${new Date().toISOString()}] Review added to: ${product.title}`);
    res.status(201).json(review);
});

app.get('/product/:linkId', (req, res) => {
    const { linkId } = req.params;
    const product = products.find(p => p.linkId === linkId);
    
    if (!product) {
        return res.status(404).sendFile(path.join(STATIC_PATH, 'index.html'));
    }
    
    const productHtml = generateProductPage(product);
    res.send(productHtml);
});

function generateProductPage(product) {
    const avgRating = getAverageRating(product);
    const reviewCount = product.reviews?.length || 0;
    const stars = generateStars(avgRating);
    const tagsHtml = (product.tags || []).map(tag => 
        `<span class="product-tag">${escapeHtml(tag)}</span>`
    ).join('');
    
    const reviewsHtml = (product.reviews || []).map(review => `
        <div class="review-card">
            <div class="review-header">
                <span class="reviewer-name">${escapeHtml(review.reviewerName)}</span>
                <span class="review-date">${escapeHtml(review.date)}</span>
            </div>
            <div class="review-rating">${generateStars(review.rating)}</div>
            <p class="review-text">${escapeHtml(review.reviewText)}</p>
        </div>
    `).join('') || '<p class="no-reviews">No reviews yet.</p>';
    
    const specsHtml = Object.entries(product.specifications || {}).map(([key, value]) => `
        <div class="spec-item">
            <span class="spec-key">${escapeHtml(key)}</span>
            <span class="spec-value">${escapeHtml(value)}</span>
        </div>
    `).join('') || '<p class="no-specs">No specifications available.</p>';
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(product.title)} | DevOriaxen</title>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%232563eb'/><text y='70' x='50' text-anchor='middle' fill='white' font-size='60' font-family='sans-serif'>D</text></svg>">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
    <style>
        :root { --bg: #06060a; --bg-elevated: #0c0c14; --fg: #ffffff; --fg-muted: #8888a0; --accent: #2563eb; --accent-light: #4f8fff; --accent-glow: rgba(37, 99, 235, 0.35); --card: #0a0a12; --card-hover: #10101c; --border: rgba(255, 255, 255, 0.07); --border-accent: rgba(37, 99, 235, 0.25); }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--fg); line-height: 1.6; }
        h1, h2, h3, h4 { font-family: 'Space Grotesk', sans-serif; font-weight: 600; }
        .nav { padding: 1.25rem 1.5rem; position: relative; z-index: 100; }
        .nav-inner { max-width: 1300px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.5rem; background: rgba(10, 10, 18, 0.7); backdrop-filter: blur(16px); border: 1px solid var(--border); border-radius: 16px; }
        .logo { font-family: 'Space Grotesk', sans-serif; font-size: 1.4rem; font-weight: 700; color: var(--fg); text-decoration: none; display: flex; align-items: center; gap: 0.75rem; }
        .logo-img { height: 32px; width: auto; border-radius: 6px; }
        .nav-links { display: flex; gap: 2rem; }
        .nav-link { color: var(--fg-muted); text-decoration: none; font-size: 0.9rem; font-weight: 500; transition: color 0.25s ease; }
        .nav-link:hover { color: var(--fg); }
        .btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; font-family: 'Space Grotesk', sans-serif; font-size: 0.9rem; font-weight: 600; text-decoration: none; border-radius: 10px; transition: all 0.25s ease; border: none; cursor: pointer; }
        .btn-primary { background: linear-gradient(135deg, var(--accent) 0%, #1d4ed8 100%); color: var(--fg); }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 30px -10px var(--accent-glow); }
        .product-detail { max-width: 1200px; margin: 0 auto; padding: 2rem 1.5rem; }
        .product-header { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; margin-bottom: 4rem; }
        .product-image-wrap { border-radius: 18px; overflow: hidden; border: 1px solid var(--border); }
        .product-image { width: 100%; aspect-ratio: 16/9; object-fit: cover; }
        .product-info { display: flex; flex-direction: column; gap: 1.5rem; }
        .product-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .product-tag { padding: 0.4rem 0.85rem; background: rgba(37, 99, 235, 0.1); border: 1px solid var(--border-accent); border-radius: 8px; font-size: 0.78rem; font-weight: 600; color: var(--accent-light); text-transform: uppercase; letter-spacing: 0.05em; }
        .product-title { font-size: 2.5rem; letter-spacing: -0.025em; }
        .product-rating { display: flex; align-items: center; gap: 0.75rem; }
        .stars { display: flex; gap: 2px; }
        .star { color: var(--fg-muted); }
        .star.filled { color: #fbbf24; }
        .review-count { color: var(--fg-muted); font-size: 0.9rem; }
        .product-price { font-family: 'Space Grotesk', sans-serif; font-size: 2rem; font-weight: 700; }
        .product-desc { color: var(--fg-muted); font-size: 1rem; line-height: 1.7; }
        .product-section { margin-bottom: 3rem; }
        .section-title { font-size: 1.5rem; margin-bottom: 1.5rem; }
        .specs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
        .spec-item { padding: 1rem; background: var(--card); border: 1px solid var(--border); border-radius: 12px; display: flex; flex-direction: column; gap: 0.25rem; }
        .spec-key { font-size: 0.78rem; color: var(--fg-muted); text-transform: uppercase; letter-spacing: 0.05em; }
        .spec-value { font-size: 1rem; font-weight: 500; }
        .reviews-list { display: flex; flex-direction: column; gap: 1.5rem; }
        .review-card { padding: 1.5rem; background: var(--card); border: 1px solid var(--border); border-radius: 12px; }
        .review-header { display: flex; justify-content: space-between; margin-bottom: 0.75rem; }
        .reviewer-name { font-weight: 600; }
        .review-date { color: var(--fg-muted); font-size: 0.85rem; }
        .review-rating { margin-bottom: 0.75rem; }
        .review-text { color: var(--fg-muted); }
        .no-reviews, .no-specs { color: var(--fg-muted); font-style: italic; }
        .back-link { display: inline-flex; align-items: center; gap: 0.5rem; color: var(--fg-muted); text-decoration: none; margin-bottom: 2rem; transition: color 0.2s; }
        .back-link:hover { color: var(--fg); }
        @media (max-width: 768px) { .product-header { grid-template-columns: 1fr; } }
    </style>
</head>
<body>
    <nav class="nav">
        <div class="nav-inner">
            <a href="/" class="logo"><img src="logo.png" alt="DevOriaxen" class="logo-img">DevOriaxen</a>
            <div class="nav-links">
                <a href="/#products" class="nav-link">Products</a>
                <a href="/#features" class="nav-link">Features</a>
                <a href="/#contact" class="nav-link">Contact</a>
            </div>
            <a href="/#products" class="btn btn-primary">Browse Products</a>
        </div>
    </nav>
    
    <div class="product-detail">
        <a href="/#products" class="back-link">&larr; Back to Products</a>
        
        <div class="product-header">
            <div class="product-image-wrap">
                <img src="${escapeHtml(product.thumbnail || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=640&h=360&fit=crop')}" alt="${escapeHtml(product.title)}" class="product-image">
            </div>
            <div class="product-info">
                <div class="product-tags">${tagsHtml}</div>
                <h1 class="product-title">${escapeHtml(product.title)}</h1>
                <div class="product-rating">
                    <div class="stars">${stars}</div>
                    <span class="review-count">${avgRating.toFixed(1)} (${reviewCount} review${reviewCount !== 1 ? 's' : ''})</span>
                </div>
                <div class="product-price">${escapeHtml(product.price)}</div>
                <p class="product-desc">${escapeHtml(product.fullDescription || product.description)}</p>
            </div>
        </div>
        
        <div class="product-section">
            <h2 class="section-title">Specifications</h2>
            <div class="specs-grid">${specsHtml}</div>
        </div>
        
        <div class="product-section">
            <h2 class="section-title">Reviews</h2>
            <div class="reviews-list">${reviewsHtml}</div>
        </div>
    </div>
</body>
</html>`;
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    let stars = '';
    
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            stars += '<span class="star filled">&#9733;</span>';
        } else if (i === fullStars && hasHalf) {
            stars += '<span class="star filled">&#9733;</span>';
        } else {
            stars += '<span class="star">&#9734;</span>';
        }
    }
    return stars;
}

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, char => map[char]);
}

app.get('*', (req, res) => {
    res.sendFile(path.join(STATIC_PATH, 'index.html'));
});

app.use((err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] Error:`, err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`[${new Date().toISOString()}] Server running at http://localhost:${PORT}`);
    console.log(`[${new Date().toISOString()}] Rate limit: ${envConfig.rateLimitMax} requests per ${envConfig.rateLimitWindow/1000}s`);
    console.log(`[${new Date().toISOString()}] Allowed IPs: ${envConfig.allowedIPs.join(', ')}`);
});
