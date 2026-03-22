// server.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || 'your-very-secure-secret'; // In production, use environment variables!

// Enable CORS for frontend (e.g., Live Server on port 5500)
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500'] // Adjust based on your frontend URL
}));

// Middleware to parse JSON
app.use(express.json());

// 🔒 In-memory "database" (replace with MongoDB later)
let users = [];

// Pre-hash known passwords for demo
const initUsers = async () => {
    const adminHash = await bcrypt.hash('admin123', 10);
    const userHash = await bcrypt.hash('user123', 10);
    users = [
        { id: 1, username: 'admin', email: 'admin@example.com', password: adminHash, role: 'admin' },
        { id: 2, username: 'alice', email: 'alice@example.com', password: userHash, role: 'user' }
    ];
};
initUsers();

// AUTH ROUTES

// POST /api/register
app.post('/api/register', async (req, res) => {
    const { username, email, password, role = 'user' } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    // Check if user exists
    const existing = users.find(u => u.username === username || u.email === email);
    if (existing) {
        return res.status(409).json({ error: 'User already exists'});
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
        id: users.length + 1,
        username,
        email: email || null,
        password: hashedPassword,
        role // Note: In real apps, role should NOT be set by the client!
    };

    users.push(newUser);
    res.status(201).json({ message: 'User registered', username, role});
});

// POST /api/login
app.post('/api/login', async (req, res) => {
    const { username, email, password } = req.body;

    const loginField = username || email;
    const user = users.find(u => u.username === loginField || u.email === loginField);
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT TOKEN
    const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        SECRET_KEY,
        { expiresIn: '1h' }
    );

    res.json({ token, user: { username: user.username, role: user.role } });
});

// PROTECTED ROUTES: GET user profile
app.get('/api/profile', authenticateToken, (req, res) => {
    res.json({ user: req.user });
});

// ROLE-BASED PROTECTED ROUTE: GET user profile
app.get('/api/admin/dashboard', authenticateToken, authorizeRole('admin'), (req, res) => {
    res.json({ message: 'Welcome to admin dashboard', data: 'Secret admin info' });
});

// PUBLIC ROUTE: Guest content
app.get('/api/content/guest', (req, res) => {
    res.json({ message: 'Public content for all visitors' });
});

// MIDDLEWARE

// Token authentication 
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token' });
        req.user = user; 
        next();
    });
}   

// Role authorization
function authorizeRole(role) {
    return (req, res, next) => {
        if (req.user.role !== role) {
            return res.status(403).json({ error: 'Access denied: insufficient permissions' });
        }
        next();
    };
}
    
// Start server
app.listen(PORT, () => {
    console.log(`✅ Backend running on http://localhost:${PORT}`);
    console.log('🔐 Try logging in with:');
    console.log('   - Admin: username=admin, password=admin123');
     console.log('   - User: username=alice, password=user123');
});
const path = require('path');

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});