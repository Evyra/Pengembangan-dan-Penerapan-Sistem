import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Payment.css';

const Payment = (props) => {
  const { orderId, amount } = props.location.state || {};
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const navigate = useNavigate();

  const handlePayment = () => {
    // Simulate a POST request to process the payment
    fetch('http://localhost:5000/api/process-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, amount, paymentMethod })
    })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        toast.success('Payment successful!');
        navigate('/'); // Redirect to home page after successful payment
      } else {
        toast.error(data.error || 'Payment failed');
      }
    })
    .catch((error) => {
      toast.error('Error during payment');
    });
  };

  return (
    <div className="payment">
      <h2>Payment</h2>
      <div className="payment-form">
        <div className="form-group">
          <label>Payment Method:</label>
          <select 
            value={paymentMethod} 
            onChange={(e) => setPaymentMethod(e.target.value)} 
          >
            <option value="Credit Card">Credit Card</option>
            <option value="Debit Card">Debit Card</option>
            <option value="PayPal">PayPal</option>
          </select>
        </div>
        <div className="payment-summary">
          <h3>Total Amount: Rp {amount}</h3>
        </div>
        <button onClick={handlePayment} className="payment-btn">Confirm Payment</button>
      </div>
    </div>
  );
};

export default Payment;
