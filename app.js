const express = require('express');
const app = express();
const expressLayout = require('express-ejs-layouts');
const db = require('./database/db'); // Ensure this file exports the necessary database configuration
const session = require('express-session');
const productRoutes = require('./routes/productRoutes.js');
const authRoutes = require('./routes/authRoutes');
const { isAuthenticated } = require('./middlewares/middleware.js');
const paymentRoutes = require('./routes/paymentRoutes');
const port = process.env.PORT || 3000;
require('dotenv').config();

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(expressLayout);
app.use(express.json());
app.use(express.static('public'));

app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key', // Use environment variable for security
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS; consider using a library like helmet
}));

// Middleware to store user info in res.locals
app.use((req, res, next) => {
    res.locals.user = req.session.user || null; // Store user info in res.locals
    const cart = req.session.cart || [];
    res.locals.totalItems = cart.reduce((acc, item) => acc + item.quantity, 0); // Calculate total items in cart
    next();
});

// Routes setup
app.use('/', authRoutes); // Public routes for authentication
app.use('/product', productRoutes); // Product routes
app.use('/payment', paymentRoutes); // Payment routes
app.set('view engine', 'ejs'); // Set EJS as the view engine

// Public home route - No authentication required
app.get('/', (req, res) => {
    res.render('index', {
        layout: 'layouts/main-layout',
        page: 'home'
    });
});

// Public contact route - No authentication required
app.get('/contact', (req, res) => {
    res.render('contact', {
        layout: 'layouts/main-layout',
        page: 'contact'
    });
});


// Cart route - Authentication required
app.get('/cart', isAuthenticated, (req, res) => {
    const cart = req.session.cart || [];
    console.log(cart); // Log the cart to verify the price values
    res.render('cart', {
        layout: 'layouts/main-layout',
        page: 'cart',
        cart // Send cart items to the view
    });
});


// Route to add products to the cart - Authentication required
// Route to add products to the cart - Authentication required
app.post('/cart/add', isAuthenticated, (req, res) => {
    const { id, name, price } = req.body;

    // Ensure price is treated as a number
    const numericPrice = parseFloat(price); // Convert price to float

    // Initialize the cart in session if it doesn't exist
    if (!req.session.cart) {
        req.session.cart = [];
    }

    // Check if the product already exists in the cart
    const existingProductIndex = req.session.cart.findIndex(item => item.id === id);

    if (existingProductIndex > -1) {
        // If the product already exists, increase quantity
        req.session.cart[existingProductIndex].quantity += 1;
    } else {
        // If the product does not exist, add it to the cart
        req.session.cart.push({ id, name, price: numericPrice, quantity: 1 }); // Use numericPrice here
    }

    // Redirect to the cart page
    res.redirect('/cart');
});


// Route to remove products from the cart
app.post('/cart/remove/:id', (req, res) => {
    const productId = req.params.id;
    const cart = req.session.cart || [];

    // Logic to remove product from cart
    const updatedCart = cart.filter(item => item.id !== productId);

    req.session.cart = updatedCart; // Save the updated cart back to session

    const totalItems = updatedCart.reduce((acc, item) => acc + item.quantity, 0); // Calculate total items
    res.json({ totalItems }); // Send total item count back to the client
});



// Handle 404 - Not Found
app.use((req, res) => {
    res.status(404).send('404 - Page Not Found');
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
