import React, { useState, useEffect } from 'react';
import { Search, VolumeX, Volume2, Heart } from 'lucide-react';
import { CATEGORIES } from '../constants';
export function HomeView({ products, openDetails, activeCategory, setActiveCategory, favorites, toggleFavorite, activeNav, handleNavClick, banner, cartCount }) {
  const [isMuted, setIsMuted] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [mediaLoaded, setMediaLoaded] = useState(false);
  useEffect(() => {
    setMediaLoaded(false);
  }, [banner?.image]);
  let displayedProducts = activeCategory === "Все" 
    ? products 
    : products.filter(p => p.category === activeCategory);
  if (searchQuery.trim() !== "") {
    const query = searchQuery.toLowerCase();
    displayedProducts = displayedProducts.filter(p => 
      (p.name && p.name.toLowerCase().includes(query)) || 
      (p.brand && p.brand.toLowerCase().includes(query))
    );
  }
  const isVideo = banner && (banner.isVideo || (banner.image && banner.image.startsWith('data:video')));
  return (
    <>
      <header className="header" style={{ justifyContent: 'center', paddingBottom: '10px' }}>
        <div className="app-logo" style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
          DVK Shop
        </div>
      </header>
      <div className="search-section">
        <div className="search-input-wrap" style={{flex: 1}}>
          <Search className="search-icon" size={20} />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Поиск..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      {((!banner.title || banner.title.trim() === "") && (!banner.buttonText || banner.buttonText.trim() === "") && banner.image) ? (
        <div className="promo-banner-standalone" style={{ position: 'relative', cursor: banner.link ? 'pointer' : 'default' }} onClick={(e) => {
          if (e.target.tagName.toLowerCase() !== 'button' && e.target.closest('button') == null) {
            if (banner.link && banner.link !== "") {
               if (banner.link === 'dressup') { handleNavClick('dressup'); }
               else if (banner.link === 'Все' || CATEGORIES.includes(banner.link)) { setActiveCategory(banner.link); document.querySelector('.products-grid')?.scrollIntoView({behavior: 'smooth', block: 'start'}); }
            }
          }
        }}>
          {!mediaLoaded && (
             <div className="skeleton-loader" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }} />
          )}
          {isVideo ? (
             <video 
               ref={(el) => {
                 if (el) {
                   el.defaultMuted = true;
                   el.muted = isMuted;
                   el.setAttribute('playsinline', '');
                   el.setAttribute('webkit-playsinline', '');
                   el.setAttribute('muted', '');
                 }
               }}
               src={banner.image} 
               onLoadedData={(e) => { 
                 setMediaLoaded(true); 
                 e.target.play().catch(() => {}); 
               }} 
               autoPlay 
               loop 
               playsInline 
               controls={false} 
               disablePictureInPicture 
               preload="auto" 
               className="promo-image-standalone" 
               style={{pointerEvents: 'none', opacity: mediaLoaded ? 1 : 0, transition: 'opacity 0.3s'}} 
             />
          ) : (
             <img src={banner.image} onLoad={() => setMediaLoaded(true)} alt="Promo" className="promo-image-standalone" style={{opacity: mediaLoaded ? 1 : 0, transition: 'opacity 0.3s'}} />
          )}
          {isVideo && (
             <button 
                onClick={(e) => { e.preventDefault(); setIsMuted(!isMuted); }}
                style={{ 
                  position: 'absolute', bottom: '12px', right: '12px', 
                  background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', 
                  borderRadius: '50%', width: '36px', height: '36px', 
                  display: 'flex', justifyContent: 'center', alignItems: 'center', 
                  cursor: 'pointer', zIndex: 10, backdropFilter: 'blur(4px)' 
                }}
             >
               {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
             </button>
          )}
        </div>
      ) : (
        <div className="promo-banner">
          {banner.title && banner.title.trim() !== "" && (
            <h2 className="promo-title">
               {banner.title.split('\n').map((line, i) => <React.Fragment key={i}>{line}<br/></React.Fragment>)}
            </h2>
          )}
          {banner.buttonText && banner.buttonText.trim() !== "" && (
            <button className="promo-btn" style={{marginTop: '12px'}} onClick={() => {
              if (banner.link && banner.link !== "") {
                 if (banner.link === 'dressup') { handleNavClick('dressup'); }
                 else if (banner.link === 'Все' || CATEGORIES.includes(banner.link)) { setActiveCategory(banner.link); document.querySelector('.products-grid')?.scrollIntoView({behavior: 'smooth', block: 'start'}); }
              }
            }}>{banner.buttonText}</button>
          )}
          {banner.image ? (
              <>
                {!mediaLoaded && (
                   <div className="skeleton-loader" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, borderRadius: 'inherit' }} />
                )}
                {isVideo ? (
                  <>
                    <video 
                      ref={(el) => {
                        if (el) {
                          el.defaultMuted = true;
                          el.muted = isMuted;
                          el.setAttribute('playsinline', '');
                          el.setAttribute('webkit-playsinline', '');
                          el.setAttribute('muted', '');
                        }
                      }}
                      src={banner.image} 
                      onLoadedData={(e) => { 
                        setMediaLoaded(true); 
                        e.target.play().catch(() => {}); 
                      }} 
                      autoPlay 
                      loop 
                      playsInline 
                      controls={false} 
                      disablePictureInPicture 
                      preload="auto" 
                      className="promo-image" 
                      style={{pointerEvents: 'none', opacity: mediaLoaded ? 1 : 0, transition: 'opacity 0.3s'}} 
                    />
                    {mediaLoaded && (
                      <button 
                         onClick={(e) => { e.preventDefault(); setIsMuted(!isMuted); }}
                         style={{ 
                            position: 'absolute', right: '12px', bottom: '12px', 
                            background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', 
                            borderRadius: '50%', width: '32px', height: '32px', 
                            display: 'flex', justifyContent: 'center', alignItems: 'center', 
                            cursor: 'pointer', zIndex: 10, backdropFilter: 'blur(4px)' 
                         }}
                      >
                        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                      </button>
                    )}
                  </>
                ) : (
                  <img src={banner.image} onLoad={() => setMediaLoaded(true)} alt="" className="promo-image" style={{opacity: mediaLoaded ? 1 : 0, transition: 'opacity 0.3s'}} />
                )}
              </>
          ) : (
              <div style={{
                position: 'absolute', right: '-10%', bottom: '-20%', width: '150px', height: '150px', 
                background: 'rgba(255,255,255,0.1)', borderRadius: '50%', zIndex: 0
              }}></div>
          )}
        </div>
      )}
      <div className="categories">
        <div 
          className={`category-pill ${activeCategory === "Все" ? 'active' : ''}`}
          onClick={() => setActiveCategory("Все")}
        >
          Все
        </div>
        {CATEGORIES.map(cat => (
          <div 
            key={cat} 
            className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </div>
        ))}
      </div>
      <div className="section-header">
        <h3 className="section-title">Каталог ({activeCategory})</h3>
      </div>
      <div className="products-grid">
        {displayedProducts.length === 0 ? (
          <div className="empty-state">
            <p>В этой категории пока нет товаров.</p>
            <p style={{fontSize: '0.85rem', marginTop: '8px'}}>Перейдите в <b>Профиль</b>, чтобы создать товар.</p>
          </div>
        ) : (
          displayedProducts.map(product => (
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
