import React, { useState } from 'react';
import { ArrowLeft, Heart, Minus, Plus } from 'lucide-react';
export function DetailsView({ product, goBack, favorites, toggleFavorite, addToCart }) {
  const [activeSize, setActiveSize] = useState(product?.sizes && product.sizes.length > 0 ? product.sizes[0] : null);
  const [qty, setQty] = useState(1);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  if (!product) return null;
  const isFav = favorites.includes(product.id);
  const allImages = product.images || [];
  const images = allImages.length > 1 ? allImages.slice(1) : allImages;
  return (
    <div className="details-page page-transition">
      <header className="header" style={{ marginBottom: '16px' }}>
        <button className="icon-btn" onClick={goBack}><ArrowLeft size={20} /></button>
        <div className="app-logo" style={{fontSize: '1.1rem'}}>О товаре</div>
        <button 
          className={`icon-btn ${isFav ? 'fav-active-scale' : ''}`} 
          onClick={(e) => toggleFavorite(e, product.id)}
          style={{color: isFav ? 'var(--primary)' : 'inherit'}}
        >
          <Heart size={22} fill={isFav ? "currentColor" : "none"} strokeWidth={isFav ? 0 : 2} />
        </button>
      </header>
      <div className="gallery-section">
        <div className="main-image">
          {images.length > 0 ? <img src={images[mainImageIndex]} alt={product.name} /> : <div style={{textAlign:'center', padding: '100px 0'}}>Нет фото</div>}
        </div>
        {images.length > 1 && (
          <div className="thumbnails">
            {images.map((img, idx) => (
              <div 
                key={idx} 
                className={`thumb-image ${idx === mainImageIndex ? 'active' : ''}`}
                onClick={() => setMainImageIndex(idx)}
              >
                <img src={img} alt={`вид ${idx + 1}`} />
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="info-section">
        <div className="details-brand">{product.brand || "DVK Shop"}</div>
        <h1 className="details-name">{product.name}</h1>
        <div className="details-price">{Number(product.price).toLocaleString('de-DE')} ₽</div>
        <div className="options-row">          
          {product.sizes && product.sizes.length > 0 && (
            <div className="option-group">
              <div className="option-label">Размер</div>
              <div className="size-options">
                {product.sizes.map(size => (
                  <div 
                    key={size} 
                    className={`size-pill ${activeSize === size ? 'active' : ''}`}
                    onClick={() => setActiveSize(size)}
                  >
                    {size}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="description-section">
          <div className="option-label">Описание товара</div>
          <div className="desc-text" style={{whiteSpace: 'pre-line'}}>
            {product.description || "Описание отсутствует."}
          </div>
        </div>
      </div>
      <div className="bottom-action-bar">
        <div className="quantity-selector">
          <button className="qty-btn" onClick={() => setQty(Math.max(1, qty - 1))}><Minus size={16}/></button>
          <div className="qty-value">{qty < 10 ? `0${qty}` : qty}</div>
          <button className="qty-btn" onClick={() => setQty(qty + 1)}><Plus size={16}/></button>
        </div>
        <button className="add-to-cart-btn" onClick={() => { addToCart(product, qty, activeSize); goBack(); }}>
          В корзину
        </button>
      </div>
    </div>
  );
}
