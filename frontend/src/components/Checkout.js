import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify'; // Import toast here
import './Checkout.css';

const Checkout = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const { cartItems, totalPrice } = location.state || {}; // Cart items and total price passed from Cart
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState(""); // Store payment method
    const [receiverName, setReceiverName] = useState(""); // Receiver name
    const [address, setAddress] = useState(""); // Address
    const [phone, setPhone] = useState(""); // Phone

    const handlePaymentSubmit = () => {

        setLoading(true);
        if (!paymentMethod || !receiverName || !address || !phone) {
            toast.error("Please fill in all the fields.");
            return;
        }
        // Check if payment method is "Cash on Delivery"
        if (paymentMethod === "Cash on Delivery") {
            toast.error("Cash on Delivery is not available. Please choose another payment method.");
            return;
        }
        setLoading(true);

        // Send both checkout and payment details to the server
        fetch('http://localhost:5000/api/process-checkout', {  // Sesuaikan URL dengan endpoint yang benar
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              amount: totalPrice,
              receiverName,
              address,
              phone,
              cartItems,
            }),
          })
          navigate('/');
    };

    return (
        <div className="checkout">
            <h2 className="checkout-title">Checkout</h2>
            {loading && <p>Processing your order...</p>}
            <div className="checkout-details">
                <h3>Order Summary</h3>
                <ul>
                    {cartItems && cartItems.map((item) => (
                        <li key={item.cart_item_id}>
                            {item.name} x {item.quantity} - Rp {item.price}
                        </li>
                    ))}
                </ul>
                <h4>Total: Rp {totalPrice}</h4>
            </div>
            <div className="checkout-form">
                <label htmlFor="receiver-name">Receiver Name:</label>
                <input 
                    type="text" 
                    id="receiver-name" 
                    name="receiverName" 
                    value={receiverName} 
                    onChange={(e) => setReceiverName(e.target.value)} 
                />
                
                <label htmlFor="address">Address:</label>
                <input 
                    type="text" 
                    id="address" 
                    name="address" 
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)} 
                />
                
                <label htmlFor="phone">Phone:</label>
                <input 
                    type="text" 
                    id="phone" 
                    name="phone" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                />

                <div className="payment-method">
                    <label>Payment Method:</label>
                    <select 
                        value={paymentMethod} 
                        onChange={(e) => setPaymentMethod(e.target.value)} 
                    >
                        <option value="">Select Payment Method</option>
                        <option value="Credit Card">Credit Card</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Cash on Delivery">Cash on Delivery</option>
                    </select>
                </div>

                <button onClick={handlePaymentSubmit} className="checkout-submit">
                    Submit Order and Payment
                </button>
            </div>
        </div>
    );
};

export default Checkout;
