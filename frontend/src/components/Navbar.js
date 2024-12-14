// src/components/Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css'; // Styling untuk Navbar

const Navbar = () => {
    return (
        <nav className="navbar">
            <div className="navbar-logo">
                <Link to="/">
                    <img src="/images/logo.png" alt="logo" />
                </Link>
            </div>
            <div className="navbar-cart">
                <Link to="/cart">
                    <img src="/images/cart-icon.png" alt="Cart" />
                </Link>
            </div>
        </nav>
    );
};

export default Navbar;
