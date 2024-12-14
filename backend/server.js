const express = require('express');
const cors = require('cors');
const mysql = require('mysql');
const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Koneksi ke database
const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root', // Sesuaikan username database
    password: '', // Sesuaikan password database
    database: 'heyjuice', // Nama database
    port: 3307, // Port MySQL
});

// Helper untuk query database
const queryDB = (query, params) =>
    new Promise((resolve, reject) => {
        pool.query(query, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });

// Endpoint: Mendapatkan semua produk
app.get('/api/products', async (req, res) => {
    try {
        const products = await queryDB('SELECT * FROM products', []);
        res.status(200).json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Endpoint: Menambahkan produk ke cart
app.post('/api/cart', async (req, res) => {
    const { user_id, product_id, quantity } = req.body;

    if (!user_id || !product_id || !quantity) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Periksa apakah user sudah memiliki cart
        let cart = await queryDB('SELECT id FROM carts WHERE user_id = ?', [user_id]);

        if (cart.length === 0) {
            const result = await queryDB('INSERT INTO carts (user_id) VALUES (?)', [user_id]);
            cart = [{ id: result.insertId }];
        }

        const cartId = cart[0].id;

        // Tambahkan produk ke cart
        await queryDB(
            `INSERT INTO cart_items (cart_id, product_id, quantity) 
             VALUES (?, ?, ?) 
             ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
            [cartId, product_id, quantity, quantity]
        );

        res.status(200).json({ message: 'Product added to cart successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add product to cart' });
    }
});

// Endpoint: Mendapatkan semua item dalam cart
app.get('/api/cart/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const cartItems = await queryDB(
            `SELECT 
                ci.id AS cart_item_id,
                ci.quantity,
                p.id AS product_id,
                p.name,
                p.price,
                p.image_url
             FROM cart_items ci
             JOIN carts c ON ci.cart_id = c.id
             JOIN products p ON ci.product_id = p.id
             WHERE c.user_id = ?`,
            [userId]
        );

        res.status(200).json(cartItems);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch cart items' });
    }
});

// Endpoint: Mengupdate kuantitas produk dalam cart
app.put('/api/cart/update-quantity', async (req, res) => {
    const { cartItemId, quantity } = req.body;

    if (!cartItemId || !quantity) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        await queryDB('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, cartItemId]);
        res.status(200).json({ message: 'Quantity updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update quantity' });
    }
});

// Endpoint: Menghapus item dari cart
app.delete('/api/cart/delete/:cartItemId', async (req, res) => {
    const { cartItemId } = req.params;

    try {
        await queryDB('DELETE FROM cart_items WHERE id = ?', [cartItemId]);
        res.status(200).json({ message: 'Item removed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to remove item', error: error.message });
    }
});


// Proses checkout
app.post("/process-checkout", async (req, res) => {
    const { user_id, full_name, address, phone, payment_method, cartItems, total_price } = req.body;

    // Validasi data yang dikirim
    if (!user_id || !full_name || !address || !phone || !payment_method || !cartItems || cartItems.length === 0 || !total_price) {
        return res.status(400).json({ error: 'Invalid data, missing required fields' });
    }

    // Validasi metode pembayaran
    const unavailablePaymentMethods = ['cash']; // Daftar metode pembayaran yang tidak tersedia
    if (unavailablePaymentMethods.includes(payment_method)) {
        return res.status(400).json({ error: 'Payment method cash is currently unavailable.' });
    }

    // Mulai transaksi untuk mengurangi stok
    pool.getConnection((err, connection) => {
        if (err) {
            res.status(500).json({ error: "Gagal mendapatkan koneksi database." });
            return;
        }

        connection.beginTransaction((err) => {
            if (err) {
                connection.release();
                res.status(500).json({ error: "Transaksi gagal dimulai." });
                return;
            }

            // Simpan pesanan ke tabel 'orders'
            connection.query(
                "INSERT INTO `orders` (user_id, cart_id, full_name, address, phone, payment_method, total_price, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'completed')",
                [user_id, cartItems[0].cart_id, full_name, address, phone, payment_method, total_price],
                (err, result) => {
                    if (err) {
                        connection.rollback(() => {
                            connection.release();
                            res.status(500).json({ error: "Gagal menyimpan pesanan." });
                        });
                        return;
                    }

                    const orderId = result.insertId;

                    // Masukkan item ke dalam tabel 'order_items' dari cartItems
                    const orderItemsQueries = cartItems.map(item => {
                        return new Promise((resolve, reject) => {
                            connection.query(
                                "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
                                [orderId, item.product_id, item.quantity, item.price],
                                (err) => {
                                    if (err) {
                                        reject(err);
                                    } else {
                                        resolve();
                                    }
                                }
                            );
                        });
                    });

                    // Menunggu semua query selesai
                    Promise.all(orderItemsQueries)
                        .then(() => {
                            // Jika sukses, komit transaksi
                            connection.commit((err) => {
                                if (err) {
                                    connection.rollback(() => {
                                        connection.release();
                                        res.status(500).json({ error: "Gagal mengkomit transaksi." });
                                    });
                                    return;
                                }

                                // Commit berhasil, kirim response sukses
                                connection.release();
                                res.json({ success: true, orderId, total_price });
                            });
                        })
                        .catch((err) => {
                            connection.rollback(() => {
                                connection.release();
                                res.status(500).json({ error: "Gagal memasukkan item pesanan." });
                            });
                        });
                }
            );
        });
    });
});

// Menjalankan server
app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});
