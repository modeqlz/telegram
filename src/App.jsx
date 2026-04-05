import React, { useState, useEffect } from 'react';
import { 
  Menu, Bell, Search, SlidersHorizontal, ArrowLeft, Heart, 
  Home, Tag, ShoppingBag, User, Plus, Minus, X, UploadCloud,
  Edit2, Trash2, Volume2, VolumeX, Layers
} from 'lucide-react';
import { supabase } from './supabaseClient';

const CATEGORIES = ["Худи", "Куртки", "Джинсы", "Футболки", "Обувь"];

function App() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching products:", error);
      } else {
        setProducts(data || []);
      }
    };
    fetchProducts();
  }, []);

  const [banner, setBanner] = useState(() => {
    try {
      const saved = localStorage.getItem('redwear_banner');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) { }
    return { title: "Зимняя\nраспродажа\nдо 40%", buttonText: "Смотреть", image: "", isVideo: false };
  });

  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('redwear_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('redwear_cart_items', JSON.stringify(cartItems));
    } catch (e) {
      console.warn("Storage Quota Exceeded");
    }
  }, [cartItems]);

  const cartCount = cartItems.reduce((acc, item) => acc + item.qty, 0);

  // Removed old cart localstorage effect

  const [view, setView] = useState('home'); 
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeCategory, setActiveCategory] = useState("Худи");
  const [activeNav, setActiveNav] = useState("home");
  const [favorites, setFavorites] = useState([]);
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50); // Light haptic feedback
    }
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const toggleFavorite = (e, id) => {
    e.stopPropagation();
    if (favorites.includes(id)) {
      setFavorites(favorites.filter(fId => fId !== id));
    } else {
      setFavorites([...favorites, id]);
      showToast('Добавлено в избранное');
    }
  };

  const openDetails = (product) => {
    setSelectedProduct(product);
    setView('details');
    window.scrollTo(0, 0);
  };

  const goBack = () => {
    setView('home');
    setActiveNav('home');
  };

  const addProduct = async (newProduct) => {
    const { data, error } = await supabase
      .from('products')
      .insert([newProduct])
      .select();

    if (error) {
      showToast('Ошибка при добавлении в БД: ' + error.message);
    } else if (data && data.length > 0) {
      setProducts([data[0], ...products]);
      showToast('Товар успешно добавлен!');
    }
  };

  const updateProduct = async (updatedProduct) => {
    const { data, error } = await supabase
      .from('products')
      .update(updatedProduct)
      .eq('id', updatedProduct.id)
      .select();

    if (error) {
      showToast('Ошибка при обновлении: ' + error.message);
    } else if (data && data.length > 0) {
      setProducts(products.map(p => p.id === updatedProduct.id ? data[0] : p));
      showToast('Изменения сохранены!');
    }
  };

  const deleteProduct = async (id) => {
    if (window.confirm("Удалить это объявление навсегда?")) {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
        
      if (error) {
        showToast('Ошибка при удалении: ' + error.message);
      } else {
        setProducts(products.filter(p => p.id !== id));
        showToast('Удалено успешно');
      }
    }
  };

  const handleNavClick = (navItem) => {
    setActiveNav(navItem);
    if (navItem === 'profile') {
      setView('admin');
    } else if (navItem === 'tags') {
      setView('favorites');
    } else if (navItem === 'dressup') {
      setView('dressup');
    } else if (navItem === 'cart') {
      setView('cart');
    } else {
      setView('home');
    }
  };

  const addToCart = (product, qty = 1, size = null, silent = false) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id && item.selectedSize === size);
      if (existing) {
        return prev.map(item => item === existing ? { ...item, qty: item.qty + qty } : item);
      }
      return [{ ...product, cartId: Date.now().toString() + Math.random(), qty, selectedSize: size }, ...prev];
    });
    if (!silent) showToast(`В корзину добавлено ${qty} шт.`);
  };

  return (
    <div className="app-container">
      {toast && (
        <div className="toast-notification">
          {toast}
        </div>
      )}
      <div key={view + (selectedProduct ? selectedProduct.id : '')} className="page-transition">
        {view === 'admin' ? (
          <AdminView 
            products={products}
            addProduct={addProduct} 
            updateProduct={updateProduct}
            deleteProduct={deleteProduct}
            goBack={goBack} 
            banner={banner}
            setBanner={setBanner}
          />
        ) : view === 'details' ? (
          <DetailsView 
            product={selectedProduct} 
            goBack={goBack} 
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            activeNav={activeNav}
            handleNavClick={handleNavClick}
            addToCart={addToCart}
            cartCount={cartCount}
          />
        ) : view === 'favorites' ? (
          <FavoritesView 
            products={products.filter(p => favorites.includes(p.id))}
            openDetails={openDetails} 
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            activeNav={activeNav}
            handleNavClick={handleNavClick}
            cartCount={cartCount}
          />
        ) : view === 'cart' ? (
          <CartView 
            cartItems={cartItems}
            setCartItems={setCartItems}
            goBack={goBack}
            activeNav={activeNav}
            handleNavClick={handleNavClick}
            cartCount={cartCount}
          />
        ) : view === 'dressup' ? (
          <DressupView
            products={products}
            addToCart={addToCart}
            showToast={showToast}
          />
        ) : (
          <HomeView 
            products={products}
            openDetails={openDetails} 
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            activeNav={activeNav}
            handleNavClick={handleNavClick}
            banner={banner}
            cartCount={cartCount}
          />
        )}
      </div>
      {view !== 'details' && (
        <BottomNav activeNav={activeNav} handleNavClick={handleNavClick} cartCount={cartCount}/>
      )}
    </div>
  );
}

function CartView({ cartItems, setCartItems, goBack, activeNav, handleNavClick }) {
  const total = cartItems.reduce((acc, item) => acc + (parseFloat(item.price) * item.qty), 0);

  const removeItem = (cartId) => {
    setCartItems(prev => prev.filter(item => item.cartId !== cartId));
  };

  const updateQty = (cartId, delta) => {
    setCartItems(prev => prev.map(item => {
      if (item.cartId === cartId) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  return (
    <div className="cart-page" style={{minHeight: '100vh', display: 'flex', flexDirection: 'column'}}>
      <header className="header" style={{position: 'sticky', top: 0, background: 'var(--bg-main)', zIndex: 10}}>
        <button className="icon-btn" onClick={() => handleNavClick('home')}><ArrowLeft size={20} /></button>
        <div className="app-logo" style={{fontSize: '1.2rem'}}>Корзина</div>
        <div style={{width: 44}}></div>
      </header>

      <div className="cart-content" style={{padding: '20px', flex: 1}}>
        {cartItems.length === 0 ? (
          <div className="empty-state" style={{marginTop: '40px'}}>
            <ShoppingBag size={48} style={{margin: '0 auto 16px', color: '#ccc'}} />
            <p>Ваша корзина пуста.</p>
            <button className="btn-primary" style={{marginTop: '24px'}} onClick={() => handleNavClick('home')}>На главную</button>
          </div>
        ) : (
          <>
            <div className="cart-items-list" style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
              {cartItems.map(item => (
                <div key={item.cartId} style={{display: 'flex', gap: '16px', background: 'white', padding: '12px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)'}}>
                  <div style={{width: '80px', height: '80px', flexShrink: 0, borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: '#f5f5f5'}}>
                    <img src={item.images?.[0]} alt="" style={{width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply'}} />
                  </div>
                  <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                    <div style={{fontWeight: 600, fontSize: '0.95rem', display: 'flex', justifyContent: 'space-between'}}>
                      <span>{item.name}</span>
                      <button onClick={() => removeItem(item.cartId)} style={{background: 'none', border: 'none', padding: 0, color: 'var(--text-muted)'}}><X size={18}/></button>
                    </div>
                    {item.selectedSize && <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px'}}>Размер: {item.selectedSize}</div>}
                    
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '8px'}}>
                      <div style={{fontWeight: 700}}>${Number(item.price).toFixed(2)}</div>
                      <div style={{display: 'flex', alignItems: 'center', gap: '12px', background: '#f5f5f5', padding: '4px 8px', borderRadius: '100px'}}>
                        <button onClick={() => updateQty(item.cartId, -1)} style={{background: 'none', border: 'none'}}><Minus size={14}/></button>
                        <span style={{fontSize: '0.9rem', fontWeight: 600, minWidth: '16px', textAlign: 'center'}}>{item.qty}</span>
                        <button onClick={() => updateQty(item.cartId, 1)} style={{background: 'none', border: 'none'}}><Plus size={14}/></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{marginTop: '32px', borderTop: '1px solid var(--border)', paddingTop: '24px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 700, marginBottom: '24px'}}>
                <span>К оплате:</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <button className="btn-primary" style={{width: '100%', height: '56px', fontSize: '1.1rem'}} onClick={() => alert('Переход к оплате...')}>
                Оформить заказ
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FavoritesView({ products, openDetails, favorites, toggleFavorite, activeNav, handleNavClick, cartCount }) {
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
                  <div className="product-price" style={{marginTop: 0}}>${Number(product.price).toFixed(2)}</div>
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

function HomeView({ products, openDetails, activeCategory, setActiveCategory, favorites, toggleFavorite, activeNav, handleNavClick, banner, cartCount }) {
  const [isMuted, setIsMuted] = useState(true);

  const displayedProducts = activeCategory === "Все" 
    ? products 
    : products.filter(p => p.category === activeCategory).length > 0 
      ? products.filter(p => p.category === activeCategory)
      : [];

  const isVideo = banner && (banner.isVideo || (banner.image && banner.image.startsWith('data:video')));

  return (
    <>
      <header className="header" style={{ justifyContent: 'center', paddingBottom: '10px' }}>
        <div className="app-logo" style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
          DVK Shop
        </div>
      </header>

      <div className="search-section">
        <div className="search-input-wrap">
          <Search className="search-icon" size={20} />
          <input type="text" className="search-input" placeholder="Поиск..." />
        </div>
        <button className="filter-btn">
          <SlidersHorizontal size={20} />
        </button>
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
          {isVideo ? (
             <video src={banner.image} autoPlay loop muted={isMuted} playsInline className="promo-image-standalone" style={{pointerEvents: 'auto'}} />
          ) : (
             <img src={banner.image} alt="Promo" className="promo-image-standalone" />
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
              isVideo ? (
                <>
                  <video src={banner.image} autoPlay loop muted={isMuted} playsInline className="promo-image" style={{pointerEvents: 'auto'}} />
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
                </>
              ) : (
                <img src={banner.image} alt="" className="promo-image" />
              )
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
                  <div className="product-price" style={{marginTop: 0}}>${Number(product.price).toFixed(2)}</div>
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

function DetailsView({ product, goBack, favorites, toggleFavorite, addToCart }) {
  const [activeSize, setActiveSize] = useState(product?.sizes && product.sizes.length > 0 ? product.sizes[0] : null);
  const [qty, setQty] = useState(1);
  const [mainImageIndex, setMainImageIndex] = useState(0);

  if (!product) return null;
  const isFav = favorites.includes(product.id);
  const images = product.images || [];

  return (
    <div className="details-page">
      <header className="header">
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
        <div className="details-price">${Number(product.price).toFixed(2)}</div>

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

function AdminView({ products, addProduct, updateProduct, deleteProduct, goBack, banner, setBanner }) {
  const [adminTab, setAdminTab] = useState('list');
  const [editingId, setEditingId] = useState(null);
  
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [sizesRaw, setSizesRaw] = useState('');
  const [images, setImages] = useState([]);

  // Safe Banner Image/Video Upload avoiding Base64 overhead for large videos
  const handleBannerImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        // For video files, we generate a local temporary URL instead of a huge Base64 string that crashes the browser
        const url = URL.createObjectURL(file);
        setBanner({ ...banner, image: url, isVideo: true });
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setBanner({ ...banner, image: reader.result, isVideo: false });
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        
        try {
          // Upload to Supabase Storage
          const { error } = await supabase.storage
            .from('product-images')
            .upload(fileName, file);
            
          if (error) {
            console.error("Upload error:", error);
            alert("Ошибка загрузки. Проверьте права доступа в Supabase RLS.");
            continue;
          }

          // Get public URL
          const { data } = supabase.storage
            .from('product-images')
            .getPublicUrl(fileName);
            
          setImages(prev => [...prev, data.publicUrl]);
        } catch (err) {
          console.error(err);
        }
      }
    }
  };

  const removeImage = (indexToRemove) => {
    setImages(images.filter((_, idx) => idx !== indexToRemove));
  };

  const startEdit = (product) => {
    setAdminTab('add_product');
    setEditingId(product.id);
    setName(product.name);
    setPrice(product.price.toString());
    setCategory(product.category);
    setDescription(product.description || "");
    setSizesRaw(product.sizes ? product.sizes.join(', ') : "");
    setImages(product.images || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName('');
    setPrice('');
    setCategory(CATEGORIES[0]);
    setDescription('');
    setSizesRaw('');
    setImages([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const sizes = sizesRaw.split(',').map(s => s.trim()).filter(s => s.length > 0);
    
    if (!name || !price || images.length === 0) {
      alert("Пожалуйста, заполните Имя, Цену и загрузите хотя бы 1 фото!");
      return;
    }

    const payload = {
      brand: "DVK Shop",
      name,
      price: parseFloat(price),
      description,
      category,
      sizes,
      images
    };

    if (editingId) {
      updateProduct({ ...payload, id: editingId });
    } else {
      addProduct(payload);
    }
    cancelEdit();
    setAdminTab('list');
  };

  return (
    <div className="admin-page">
      <header className="header" style={{paddingLeft: 0, paddingRight: 0, background: 'transparent'}}>
         <button className="icon-btn" type="button" onClick={goBack}><ArrowLeft size={20} /></button>
         <div className="app-logo" style={{fontSize: '1.2rem'}}>Настройки</div>
         <div style={{width: 44}}></div>
      </header>

      <div className="categories" style={{padding: '0 0 24px 0'}}>
        <div className={`category-pill ${adminTab === 'banner' ? 'active' : ''}`} onClick={() => { setAdminTab('banner'); cancelEdit(); }}>
          Баннер
        </div>
        <div className={`category-pill ${adminTab === 'add_product' ? 'active' : ''}`} onClick={() => { setAdminTab('add_product'); cancelEdit(); }}>
          {editingId ? 'Редакт.' : 'Новый товар'}
        </div>
        <div className={`category-pill ${adminTab === 'list' ? 'active' : ''}`} onClick={() => { setAdminTab('list'); cancelEdit(); }}>
          Объявления
        </div>
      </div>

      {/* Banner Configuration Card */}
      {adminTab === 'banner' && (
        <div className="admin-card" style={{marginBottom: '24px'}}>
          <h3 style={{marginBottom: '16px', fontSize: '1.1rem', fontWeight: 700}}>Главный баннер</h3>
          
          <div className="form-group">
            <label className="form-label">Заголовок баннера (Enter - новая строка)</label>
            <textarea 
              className="form-input" 
              style={{minHeight: '80px', resize: 'vertical'}}
              value={banner.title} 
              onChange={e => setBanner({...banner, title: e.target.value})} 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Текст на кнопке</label>
            <input 
              type="text"
              className="form-input" 
              value={banner.buttonText} 
              onChange={e => setBanner({...banner, buttonText: e.target.value})} 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Куда ведет клик по баннеру (Ссылка)</label>
            <select 
              className="form-select" 
              value={banner.link || ""} 
              onChange={e => setBanner({...banner, link: e.target.value})}
            >
              <option value="">Никуда (Только картинка)</option>
              <option value="dressup">Сборка образа (Dressup)</option>
              {['Все', ...CATEGORIES].map(cat => (
                <option key={cat} value={cat}>Каталог: {cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{marginBottom: 0}}>
            <label className="form-label">GIF, PNG или видео (MP4) для баннера</label>
            <div className="upload-dropzone" style={{padding: '20px'}}>
              <input 
                type="file" 
                accept="image/*, video/*" 
                className="upload-input-file"
                onChange={handleBannerImageUpload}
              />
              <UploadCloud size={24} className="upload-icon" />
              <div style={{fontSize: '0.85rem'}}>Загрузить графику/видео баннера</div>
            </div>
            {banner.image && (
              <div style={{marginTop: '20px'}}>
                <div style={{fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600}}>Предпросмотр (как выглядит на главной):</div>
                <div className="promo-banner-standalone" style={{ minHeight: '180px', pointerEvents: 'none', position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', background: 'black' }}>
                    {banner.isVideo || banner.image.startsWith('data:video') ? (
                       <video src={banner.image} autoPlay loop muted playsInline className="promo-image-standalone" style={{objectFit: 'cover', width: '100%', height: '100%', position: 'absolute', top: 0, left: 0}} />
                    ) : (
                       <img src={banner.image} alt="Promo" className="promo-image-standalone" style={{objectFit: 'cover', width: '100%', height: '100%', position: 'absolute', top: 0, left: 0}} />
                    )}
                    {banner.title && banner.title.trim() !== "" && (
                      <h2 style={{position: 'relative', zIndex: 2, padding: '20px', color: 'white', whiteSpace: 'pre-line', margin: 0, fontSize: '1.4rem'}}>{banner.title}</h2>
                    )}
                    {banner.buttonText && banner.buttonText.trim() !== "" && (
                      <button className="promo-btn" style={{position: 'absolute', bottom: '20px', left: '20px', zIndex: 2, padding: '8px 16px', fontSize: '0.8rem'}}>{banner.buttonText}</button>
                    )}
                </div>
                <button type="button" className="remove-color-btn" style={{marginTop: '12px', justifyContent: 'center', width: '100%'}} onClick={() => setBanner({...banner, image: "", isVideo: false})}>
                  <X size={16} style={{marginRight: '4px'}}/> Удалить картинку
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Product Editor form */}
      {adminTab === 'add_product' && (
      <form onSubmit={handleSubmit} className="admin-card">
        <h3 style={{marginBottom: '16px', fontSize: '1.1rem', fontWeight: 700}}>
          {editingId ? "Редактирование товара" : "Добавить новый товар"}
        </h3>
        <div className="form-group">
          <label className="form-label">Фотографии товара</label>
          <div className="upload-dropzone">
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              className="upload-input-file"
              onChange={handleImageUpload}
              title="Загрузите фотографии"
            />
            <UploadCloud size={28} className="upload-icon" />
            <div style={{fontSize: '0.9rem', fontWeight: 500}}>Нажмите или перетащите файлы</div>
            <div style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>PNG, JPG(JPEG)</div>
          </div>

          {images.length > 0 && (
            <div className="image-preview-grid">
              {images.map((imgSrc, idx) => (
                <div className="preview-item" key={idx}>
                  <img src={imgSrc} alt={`upload-${idx}`} />
                  <button type="button" className="remove-btn-absolute" onClick={() => removeImage(idx)}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Название товара</label>
          <input 
            type="text" 
            className="form-input" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="Например: Супер Куртка"
            required
          />
        </div>

        <div className="row-group">
          <div className="form-group">
            <label className="form-label">Категория</label>
            <select 
              className="form-select" 
              value={category} 
              onChange={e => setCategory(e.target.value)}
            >
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Цена ($)</label>
            <input 
              type="number" 
              step="0.01" 
              className="form-input" 
              value={price} 
              onChange={e => setPrice(e.target.value)} 
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Размеры (через запятую)</label>
           <input 
            type="text" 
            className="form-input" 
            value={sizesRaw} 
            onChange={e => setSizesRaw(e.target.value)} 
            placeholder="Например: S, M, L  или  39, 40"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Описание</label>
          <textarea 
            className="form-textarea" 
            value={description} 
            onChange={e => setDescription(e.target.value)}
            placeholder="Подробное описание товара..."
          />
        </div>

        <button type="submit" className="btn-primary">
          {editingId ? "Сохранить изменения" : "Опубликовать товар"}
        </button>
        {editingId && (
          <button type="button" className="btn-danger-outline" onClick={cancelEdit}>
            Отмена
          </button>
        )}
      </form>
      )}

      {/* List of Ads */}
      {adminTab === 'list' && (
        <div className="ads-list">
          <h3 style={{marginBottom: '16px', fontSize: '1.2rem', fontWeight: 700}}>Мои объявления ({products.length})</h3>
          {products.length === 0 ? (
            <div className="empty-state">У вас пока нет добавленных товаров.</div>
          ) : (
          products.map(product => (
            <div className="ad-item" key={product.id}>
               <img src={product.images && product.images.length > 0 ? product.images[0] : ""} alt="" className="ad-item-img" />
               <div className="ad-item-info">
                 <div className="ad-item-title">{product.name}</div>
                 <div className="ad-item-price">${Number(product.price).toFixed(2)}</div>
               </div>
               <div className="ad-item-actions">
                  <button className="action-btn" title="Редактировать" onClick={() => startEdit(product)}>
                    <Edit2 size={16} />
                  </button>
                  <button className="action-btn delete" title="Удалить" onClick={() => deleteProduct(product.id)}>
                    <Trash2 size={16} />
                  </button>
               </div>
            </div>
          )))}
        </div>
      )}
    </div>
  );
}

function BottomNav({ activeNav, handleNavClick, cartCount = 0 }) {
  return (
    <div className="bottom-nav">
      <div className="nav-inner">
        <div className={`nav-item ${activeNav === 'home' ? 'active' : ''}`} onClick={() => handleNavClick('home')}>
          <Home size={20} />
          <span>Главная</span>
        </div>
        <div className={`nav-item ${activeNav === 'tags' ? 'active' : ''}`} onClick={() => handleNavClick('tags')}>
          <Heart size={20} />
          <span>Избранное</span>
        </div>
        <div className={`nav-item ${activeNav === 'dressup' ? 'active' : ''}`} onClick={() => handleNavClick('dressup')}>
          <Layers size={20} />
          <span>Луки</span>
        </div>
        <div className={`nav-item ${activeNav === 'cart' ? 'active' : ''}`} onClick={() => handleNavClick('cart')} style={{position: 'relative'}}>
          <ShoppingBag size={20} />
          <span>Корзина</span>
          {cartCount > 0 && !activeNav.includes('cart') && (
            <div style={{
              position: 'absolute', top: '10px', right: '10px', 
              background: 'var(--text-main)', color: 'white', 
              borderRadius: '50%', width: '16px', height: '16px', 
              display: 'flex', justifyContent: 'center', alignItems: 'center', 
              fontSize: '0.65rem', fontWeight: 700
            }}>
              {cartCount}
            </div>
          )}
        </div>
        <div className={`nav-item ${activeNav === 'profile' ? 'active' : ''}`} onClick={() => handleNavClick('profile')}>
          <User size={20} />
          <span>Профиль</span>
        </div>
      </div>
    </div>
  );
}

function DressupView({ products, addToCart, showToast }) {
  const tops = products.filter(p => ["Худи", "Куртки", "Футболки"].includes(p.category));
  const bottoms = products.filter(p => ["Джинсы", "Брюки"].includes(p.category));
  const shoes = products.filter(p => ["Обувь"].includes(p.category));

  const [selectedTop, setSelectedTop] = useState(tops[0] || null);
  const [selectedBottom, setSelectedBottom] = useState(bottoms[0] || null);
  const [selectedShoe, setSelectedShoe] = useState(shoes[0] || null);

  const handleScroll = (e, items, setter, currentSelected) => {
    const container = e.target;
    const containerCenter = container.scrollLeft + container.offsetWidth / 2;
    
    let closestItem = null;
    let minDistance = Infinity;

    Array.from(container.children).forEach((child, index) => {
      // Each dressup-item
      if (!items[index]) return;
      const childCenter = child.offsetLeft + (child.offsetWidth / 2);
      const distance = Math.abs(containerCenter - childCenter);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestItem = items[index];
      }
    });

    if (closestItem && (!currentSelected || closestItem.id !== currentSelected.id)) {
      setter(closestItem);
    }
  };

  const handleSelect = (e, item, setter) => {
    // We let the natural onScroll pick up the selection to avoid race conditions.
    const element = e.currentTarget;
    const container = element.parentElement;
    const scrollLeft = element.offsetLeft - container.offsetLeft - (container.clientWidth / 2) + (element.clientWidth / 2);
    
    // Hardware accelerated native smooth scroll
    container.scrollTo({
      left: scrollLeft,
      behavior: 'smooth'
    });
  };

  const handleBuyOutfit = () => {
    let count = 0;
    const defaultSize = (p) => p.sizes && p.sizes.length > 0 ? p.sizes[0] : null;
    
    if (selectedTop) { addToCart(selectedTop, 1, defaultSize(selectedTop), true); count++; }
    if (selectedBottom) { addToCart(selectedBottom, 1, defaultSize(selectedBottom), true); count++; }
    if (selectedShoe) { addToCart(selectedShoe, 1, defaultSize(selectedShoe), true); count++; }
    
    if (count > 0) {
      showToast(`Весь образ (${count} вещи) добавлен в корзину!`);
    } else {
      showToast('Сначала выберите крутые вещи!');
    }
  };

  return (
    <div className="dressup-view">
      <div className="dressup-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 20px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>Dressup</h2>
      </div>

      <div className="dressup-row-wrap">
        <div className="dressup-row-header">
          <span className="subtitle">ВЕРХ</span>
          <h3 className="title">Футболки / Худи</h3>
        </div>
        <div 
          className="dressup-scroll" 
          onScroll={(e) => handleScroll(e, tops, setSelectedTop, selectedTop)}
        >
          {tops.length > 0 ? tops.map(p => (
            <div 
              key={p.id} 
              className={`dressup-item ${selectedTop?.id === p.id ? 'selected' : ''}`}
              onClick={(e) => handleSelect(e, p, setSelectedTop)}
            >
              <img src={p.images && p.images.length > 0 ? p.images[0] : p.image} alt={p.name} />
            </div>
          )) : <div className="dressup-empty">Добавьте верх в админке</div>}
        </div>
      </div>

      <div className="dressup-row-wrap">
        <div className="dressup-row-header">
          <span className="subtitle">НИЗ</span>
          <h3 className="title">Джинсы / Брюки</h3>
        </div>
        <div 
          className="dressup-scroll"
          onScroll={(e) => handleScroll(e, bottoms, setSelectedBottom, selectedBottom)}
        >
          {bottoms.length > 0 ? bottoms.map(p => (
            <div 
              key={p.id} 
              className={`dressup-item ${selectedBottom?.id === p.id ? 'selected' : ''}`}
              onClick={(e) => handleSelect(e, p, setSelectedBottom)}
            >
              <img src={p.images && p.images.length > 0 ? p.images[0] : p.image} alt={p.name} />
            </div>
          )) : <div className="dressup-empty">Добавьте низ в админке</div>}
        </div>
      </div>

      <div className="dressup-row-wrap">
        <div className="dressup-row-header">
          <span className="subtitle">ОБУВЬ</span>
          <h3 className="title">Кроссовки</h3>
        </div>
        <div 
          className="dressup-scroll"
          onScroll={(e) => handleScroll(e, shoes, setSelectedShoe, selectedShoe)}
        >
          {shoes.length > 0 ? shoes.map(p => (
            <div 
              key={p.id} 
              className={`dressup-item ${selectedShoe?.id === p.id ? 'selected' : ''}`}
              onClick={(e) => handleSelect(e, p, setSelectedShoe)}
            >
              <img src={p.images && p.images.length > 0 ? p.images[0] : p.image} alt={p.name} />
            </div>
          )) : <div className="dressup-empty">Добавьте обувь в админке</div>}
        </div>
      </div>

      {/* Floating Chosen Outfit Preview */}
      {(selectedTop || selectedBottom || selectedShoe) && (
        <div style={{
          position: 'fixed',
          bottom: '120px',
          left: '20px',
          background: '#ffffff',
          borderRadius: '50px',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          zIndex: 50,
          border: '1px solid #E5E7EB'
        }}>
          {[
            { item: selectedTop, setter: setSelectedTop, rot: -8, ml: '0px', z: 3 },
            { item: selectedBottom, setter: setSelectedBottom, rot: 5, ml: '-16px', z: 2 },
            { item: selectedShoe, setter: setSelectedShoe, rot: -4, ml: '-16px', z: 1 }
          ].map(({ item, setter, rot, ml, z }, i) => item && (
            <div key={i} style={{ 
              position: 'relative', 
              marginLeft: ml,
              zIndex: z,
              transform: `rotate(${rot}deg)`,
              transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', border: '3px solid white', background: '#f5f5f5',  boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <img src={item.images?.[0] || item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <button 
                onClick={() => setter(null)}
                style={{
                  position: 'absolute', top: '-4px', right: '-4px', background: 'var(--primary)', 
                  color: 'white', border: '2px solid white', borderRadius: '50%', width: '20px', height: '20px', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                <X size={12} strokeWidth={3} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ padding: '0 20px 100px', textAlign: 'center' }}>
        <button 
          onClick={handleBuyOutfit}
          style={{
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            padding: '16px 32px',
            borderRadius: 'var(--radius-full)',
            width: '100%',
            fontWeight: 800,
            fontSize: '1.1rem'
          }}
        >
          Купить весь образ
        </button>
      </div>
    </div>
  );
}

export default App;
