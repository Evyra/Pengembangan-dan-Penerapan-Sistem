import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const ProductDetail = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);

    useEffect(() => {
        fetch(`http://localhost:5000/api/products/${id}`)
            .then((response) => response.json())
            .then((data) => setProduct(data))
            .catch((error) => console.error('Error fetching product:', error));
    }, [id]);

    if (!product) return <div>Loading...</div>;

    return (
        <div className="product-detail">
            <img src={`http://localhost:5000/images/${product.image_url}`} alt={product.name} />
            <h1>{product.name}</h1>
            <p>{product.description}</p>
            <p>${product.price}</p>
            <button>Add to Cart</button>
        </div>
    );
};

export default ProductDetail;
