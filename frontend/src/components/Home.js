import React, { useState, useEffect } from 'react';
import './Home.css';
import { toast } from 'react-toastify';

const Home = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Ambil data produk dari API
    useEffect(() => {
        fetch('http://localhost:5000/api/products')
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to fetch products');
                }
                return response.json();
            })
            .then((data) => {
                setProducts(data);
                setLoading(false);
            })
            .catch((error) => {
                setError(error.message);
                setLoading(false);
            });
    }, []);

    const handleAddToCart = (product) => {
        const userId = 1; // Gunakan ID pengguna yang login, misalnya 1 untuk pengujian

        fetch('http://localhost:5000/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId, // Menambahkan user_id
                product_id: product.id, // Mengirimkan ID produk
                quantity: 1, // Menambahkan jumlah 1 untuk item yang ditambahkan
            }),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to add product to cart');
                }
                return response.json();
            })
            .then(() => {
                toast.success(`${product.name} added to cart!`);
            })
            .catch(() => {
                toast.error('Failed to add product to cart.');
            });
    };

    if (loading) {
        return <div>Loading products...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="home">
            <div className="banner-section">
                <img src="/images/banner.jpg" alt="HeyJuice Banner" className="banner-image" />
                <div className="banner-text">
                    <h1>Welcome at HeyJuice</h1>
                    <p>Explore our fresh and delicious juice options. Order now and enjoy healthy and refreshing drinks!</p>
                </div>
            </div>
            <div className="products-container">
                <h2 className="home-title">Our Products</h2>
                <div className="product-list">
                    {products.map((product) => (
                        <div key={product.id} className="product-card">
                            <img
                                src={product.image_url}
                                alt={product.name}
                                style={{ width: '230px', height: '200px' }}
                            />
                            <h3 className="product-name">{product.name}</h3>
                            <p className="product-description">{product.description}</p>
                            <p className="product-price">Rp {product.price}</p>
                            <button
                                className="add-to-cart-btn"
                                onClick={() => handleAddToCart(product)}
                            >
                                Add to Cart
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Home;
