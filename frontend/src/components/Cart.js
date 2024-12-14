import React, { useState, useEffect } from 'react';
import './Cart.css';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Cart = () => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Fetch cart items from the server
    useEffect(() => {
        const userId = 1; // Ganti dengan user_id yang sesuai
        fetch(`http://localhost:5000/api/cart/${userId}`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to fetch cart items');
                }
                return response.json();
            })
            .then((data) => {
                setCartItems(data);
                setLoading(false);
            })
            .catch((error) => {
                setError(error.message);
                setLoading(false);
            });
    }, []);

    // Calculate total price
    const calculateTotalPrice = () => {
        return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
    };

    // Handle checkout
    const handleCheckout = () => {
        const totalPrice = calculateTotalPrice();
        if (cartItems.length === 0) {
            toast.error('Your cart is empty.');
            return;
        }
    
        // Kirim data cartItems dan totalPrice ke halaman Checkout
        navigate('/checkout', { state: { cartItems, totalPrice, cartId: 1, userId: 1 } });
    };

    // Update quantity
    const handleQuantityChange = (cartItemId, quantity) => {
        const updatedItems = cartItems.map((item) =>
            item.cart_item_id === cartItemId
                ? { ...item, quantity: item.quantity + quantity }
                : item
        );

        // Validate quantity (it should be >= 1)
        if (updatedItems.some((item) => item.quantity < 1)) {
            return; // Prevent decreasing quantity below 1
        }

        setCartItems(updatedItems);

        // Send updated quantity to backend
        fetch('http://localhost:5000/api/cart/update-quantity', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ cartItemId, quantity: updatedItems.find(item => item.cart_item_id === cartItemId).quantity }),
        })
        .then((response) => {
            if (!response.ok) {
                throw new Error('Failed to update quantity');
            }
        })
        .catch((error) => {
            toast.error(error.message);
        });
    };

    // Remove item from cart
    const handleRemoveItem = (cartItemId) => {
        const updatedItems = cartItems.filter((item) => item.cart_item_id !== cartItemId);
        setCartItems(updatedItems);

        // Send remove request to backend
        fetch(`http://localhost:5000/api/cart/delete/${cartItemId}`, {
            method: 'DELETE',
        })
        .then((response) => {
            if (!response.ok) {
                throw new Error('Failed to remove item');
            }
        })
        .catch((error) => {
            toast.error(error.message);
        });
    };

    if (loading) {
        return <div className="cart-loading">Loading cart items...</div>;
    }

    if (error) {
        return <div className="cart-error">Error: {error}</div>;
    }

    return (
        <div className="cart">
            <h2 className="cart-title">Your Cart</h2>
            <div className="cart-items">
                {cartItems.length === 0 ? (
                    <p className="cart-empty">Your cart is empty</p>
                ) : (
                    cartItems.map((item) => (
                        <div key={item.cart_item_id} className="cart-item">
                            <img src={item.image_url} alt={item.name} className="cart-item-image" />
                            <div className="cart-item-details">
                                <h3 className="cart-item-name">{item.name}</h3>
                                <p className="cart-item-price">Price: Rp {item.price}</p>
                                <span>Quantity: {item.quantity}</span>
                                <div className="cart-item-actions">
                                    <button onClick={() => handleQuantityChange(item.cart_item_id, 1)}>+</button>
                                    <button onClick={() => handleQuantityChange(item.cart_item_id, -1)}>-</button>
                                    <button onClick={() => handleRemoveItem(item.cart_item_id)} className="cart-item-remove">
                                        Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            {cartItems.length > 0 && (
                <div className="cart-summary">
                    <h3 className="cart-total">Total: Rp {calculateTotalPrice()}</h3>
                    <button onClick={handleCheckout} className="cart-checkout-button">
                        Checkout
                    </button>
                </div>
            )}
        </div>
    );
};

export default Cart;
