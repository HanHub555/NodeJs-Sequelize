const express = require('express')
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const sequelize = require('./config/database')
const User = require('./models/User');
require('dotenv').config();

const app = express();
const port = 3000;

const SECRET_KEY = process.env.SECRET_KEY;

// Middleware
app.use(bodyParser.json());

// Synchronize models and db
sequelize.sync()
    .then(() => {
        console.log('Database and tables created');
    })
    .catch(err => console.log('Error: ', err));

// Register
app.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hashedPassword });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
});

// Login
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } })
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }
        const validPassword = await bcrypt.compare(password, user.password)
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }
        const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '1hr' })
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})


// Middleware to protect routes
const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ error: 'Access denied' });
    try {
        const verified = jwt.verify(token, SECRET_KEY);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ error: 'Invalid token' })
    }
}

// Protected route
app.get('/protected', authenticateToken, (req, res) => {
    res.send('This is protected route');
})

// Create
app.post('/users', authenticateToken, async (req, res) => {
    try {
        const { name, email } = req.body;
        const user = await User.create({ name, email });
        res.json(user)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Read
app.get('/users', authenticateToken, async (req, res) => {
    try {
        const users = User.findAll();
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Update
app.put('/users/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email } = req.body;
        const user = await User.findByPk(id);
        if (user) {
            user.name = name;
            user.email = email;
            await user.save();
            res.json(user);
        } else {
            res.status(404).json({ error: "User not found" })
        }
    } catch (error) {
        res.status(500).json({ error: err.message })
    }
})

// Delete
app.delete('/users/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id)
        if (user) {
            await user.destroy();
            res.json({ message: 'User deleted' })
        } else {
            res.status(404).json({ error: "User not found" })
        }
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// 
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
})