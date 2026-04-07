import React from 'react';
import { ArrowLeft, Heart } from 'lucide-react';
export function FavoritesView({ products, openDetails, favorites, toggleFavorite, activeNav, handleNavClick, cartCount }) {
  return (
    <>
      <header className="header">
        <button className="icon-btn" onClick={() => handleNavClick('home')}><ArrowLeft size={20} /></button>
        <div className="app-logo">Избранное</div>
        <div style={{width: 44}}></div>
      </header>
      <div className="products-grid" style={{marginTop: '20px'}}>
        {products.length === 0 ? (
          <div className="empty-state">
            <p>У вас пока нет избранных товаров.</p>
            <p style={{fontSize: '0.85rem', marginTop: '8px'}}>Нажмите на сердечко в каталоге, чтобы сохранить товар сюда.</p>
          </div>
        ) : (
          products.map(product => (
            <div className="product-card" key={product.id} onClick={() => openDetails(product)}>
              <div className="product-img-wrap">
                {product.images && product.images.length > 0 ? (
                    <img src={product.images[0]} alt={product.name} className="product-img" />
                ) : (
                    <div style={{color: 'var(--text-muted)', fontSize: '0.8rem'}}>Нет фото</div>
                )}
              </div>
              <div className="product-details">
                <div className="product-brand">{product.brand || "DVK Shop"}</div>
                <div className="product-name">{product.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  <div className="product-price" style={{marginTop: 0}}>{Number(product.price)} ₽</div>
                  <button 
                    className={`fav-btn-inline ${favorites.includes(product.id) ? 'active' : ''}`}
                    onClick={(e) => toggleFavorite(e, product.id)}
                  >
                    <Heart size={18} fill={favorites.includes(product.id) ? "currentColor" : "none"} strokeWidth={favorites.includes(product.id) ? 0 : 2} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
