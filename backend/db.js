const mysql = require('mysql2');

// Konfigurasi koneksi database
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',      // Ganti dengan username database Anda
    password: '',      // Ganti dengan password database Anda
    database: 'hj_db' // Nama database
});

// Ekspor koneksi pool untuk digunakan di file lain
module.exports = pool.promise();
