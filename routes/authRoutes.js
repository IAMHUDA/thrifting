const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database/db');
const midtransClient = require('midtrans-client'); // Tambahkan ini jika belum ada
const router = express.Router();
const axios = require('axios');

// Inisialisasi Midtrans Snap
const snap = new midtransClient.Snap({
    clientKey: process.env.MIDTRANS_CLIENT_KEY, // Kunci klien
    serverKey: process.env.MIDTRANS_SERVER_KEY, // Kunci server
    isProduction: false, // Ganti ke true jika dalam mode produksi
});


// Middleware untuk memastikan pengguna sudah terautentikasi
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next(); // Pengguna terautentikasi
    } else {
        return res.status(401).json({ message: 'Pengguna tidak terautentikasi.' }); // Pengguna tidak terautentikasi
    }
}


// Rute untuk memproses pembayaran
router.post('/payment', isAuthenticated, async (req, res) => {
    try {
        const cart = req.session.cart || []; // Pastikan cart terdefinisi
        if (!cart.length) {
            return res.status(400).json({ message: 'Keranjang belanja kosong.' });
        }

        // Hitung total jumlah
        const grossAmount = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        console.log('Total Amount:', grossAmount); // Log total jumlah untuk debugging

        // Siapkan data transaksi untuk Midtrans
        const transactionDetails = {
            transaction_details: {
                order_id: 'order-' + new Date().getTime(),
                gross_amount: grossAmount,
            },
            credit_card: {
                secure: true,
            },
        };

        // Inisiasi transaksi Midtrans
        const transaction = await snap.createTransaction(transactionDetails);
        const tokenId = transaction.token;

        // Kirim tokenId kembali ke klien
        res.json({ tokenId });

    } catch (error) {
        console.error('Payment error:', error);
        res.status(500).json({ message: 'Gagal memproses pembayaran.', error: error.message });
    }
});

// Route Signup
router.post('/signup', (req, res) => {
    const { username, password, fullName, profilePicture, bio } = req.body; // Ambil data dari form

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) return res.status(500).send('Error hashing password');

        db.query(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username, hash, fullName, profilePicture, bio], // Simpan data tambahan
            (err, result) => {
                if (err) return res.status(500).send('Error registering user');
                res.redirect('/login');
            }
        );
    });
});

// Route untuk menampilkan form signup
router.get('/signup', (req, res) => {
    res.render('signup', {
        layout: 'layouts/main-layout',
        page: 'signup'
    });
});

// Route Login
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) return res.status(500).send('Error fetching user');
        if (results.length === 0) return res.status(400).send('User not found');

        bcrypt.compare(password, results[0].password, (err, isMatch) => {
            if (err) return res.status(500).send('Error checking password');
            if (!isMatch) return res.status(401).send('Incorrect password');

            // Simpan userId dan informasi pengguna dalam sesi setelah login berhasil
            req.session.userId = results[0].id;
            req.session.user = { // Simpan data pengguna ke dalam sesi
                username: results[0].username,
                fullName: results[0].full_name,
                profilePicture: results[0].profile_picture,
                bio: results[0].bio
            };
            res.redirect('/'); // Arahkan ke halaman utama setelah login
        });
    });
});

// Route untuk menampilkan form login
router.get('/login', (req, res) => {
    res.render('login', {
        layout: 'layouts/main-layout',
        page: 'login'
    });
});

// Rute untuk logout
router.get('/logout', (req, res) => {
    // Menghapus data pengguna dari sesi
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Could not log out.');
        }
        // Redirect ke halaman utama setelah logout
        res.redirect('/');
    });
});

// Route untuk menampilkan halaman utama
router.get('/', (req, res) => {
    const cart = req.session.cart || [];
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0); // Hitung total item

    res.render('index', {
        layout: 'layouts/main-layout',
        page: 'home',
        totalItems, // Kirim total item ke tampilan
        user: req.session.user // Kirim data pengguna ke tampilan
    });
});

// Route untuk menampilkan profil pengguna
router.get('/profile', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login'); // Arahkan ke halaman login jika tidak terautentikasi
    }

    res.render('profile', {
        layout: 'layouts/main-layout',
        user: req.session.user // Kirim data pengguna ke tampilan
    });
});

module.exports = router;
