const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/middleware.js'); // Pastikan ini sudah diimpor

// Data produk
const products = [
    { id: 1, name: 'Tshirt', image: '/images/Tshirt1.jpg', category: 'tshirt', price: 150000 },
    { id: 2, name: 'Tshirt', image: '/images/Tshirt2.jpg', category: 'tshirt', price: 160000 },
    { id: 3, name: 'Tshirt', image: '/images/Tshirt3.jpg', category: 'tshirt', price: 140000 },
    { id: 4, name: 'Tshirt', image: '/images/Tshirt4.jpg', category: 'tshirt', price: 130000 },
    { id: 5, name: 'Tshirt', image: '/images/Tshirt5.jpg', category: 'tshirt', price: 170000 },
    { id: 6, name: 'Tshirt', image: '/images/Tshirt6.jpg', category: 'tshirt', price: 180000 },
    { id: 7, name: 'Celana', image: '/images/riped1.jpg', category: 'celana', price: 200000 },
    { id: 8, name: 'Celana', image: '/images/riped2.jpg', category: 'celana', price: 220000 },
    { id: 9, name: 'Celana', image: '/images/riped3.jpg', category: 'celana', price: 210000 },
    { id: 10, name: 'Outfit', image: '/images/outfitmen1.jpg', category: 'outfit', price: 300000 },
    { id: 11, name: 'Outfit', image: '/images/outfitmen2.jpg', category: 'outfit', price: 320000 },
    { id: 12, name: 'Outfit', image: '/images/outfitmen3.jpg', category: 'outfit', price: 310000 },
    { id: 13, name: 'Outfit', image: '/images/outfitmen4.jpg', category: 'outfit', price: 330000 },
    { id: 14, name: 'Outfit', image: '/images/outfitmen.jpg', category: 'outfit', price: 340000 }
];

// Rute untuk mendapatkan produk
router.get('/', isAuthenticated, (req, res) => {
    const cart = req.session.cart || [];
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0); // Hitung total item
    const totalPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0); // Hitung total harga

    res.render('product', {
        layout: 'layouts/main-layout',
        page: 'product',
        totalItems, // Kirim total item ke view
        totalPrice, // Kirim total harga ke view
        products // Kirim produk ke view
    });
});
// Ekspor router
module.exports = router;
