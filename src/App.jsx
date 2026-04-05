import React, { useState, useEffect } from 'react';
import { 
  Menu, Bell, Search, SlidersHorizontal, ArrowLeft, Heart, 
  Home, Tag, ShoppingBag, User, Plus, Minus, X, UploadCloud,
  Edit2, Trash2, Volume2, VolumeX
} from 'lucide-react';

const CATEGORIES = ["Худи", "Куртки", "Джинсы", "Футболки", "Обувь"];

function App() {
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('redwear_products');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      return [];
    }
    return [];
  });

  const [banner, setBanner] = useState(() => {
    try {
      const saved = localStorage.getItem('redwear_banner');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) { }
    return { title: "Зимняя\nраспродажа\nдо 40%", buttonText: "Смотреть", image: "", isVideo: false };
  });

  const [cartCount, setCartCount] = useState(() => {
    return parseInt(localStorage.getItem('redwear_cart') || "0");
  });

  // Safe save to LocalStorage (prevents large videos from crashing the browser's 5MB limit)
  useEffect(() => {
    try {
      localStorage.setItem('redwear_products', JSON.stringify(products));
    } catch (e) {
      console.warn("Storage Quota Exceeded for Products");
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('redwear_banner', JSON.stringify(banner));
    } catch (e) {
      console.warn("Storage Quota Exceeded for Banner. Video may be too large.");
    }
  }, [banner]);

  useEffect(() => {
    try {
      localStorage.setItem('redwear_cart', cartCount.toString());
    } catch (e) { }
  }, [cartCount]);

  const [view, setView] = useState('home'); 
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeCategory, setActiveCategory] = useState("Худи");
  const [activeNav, setActiveNav] = useState("home");
  const [favorites, setFavorites] = useState([]);

  const toggleFavorite = (e, id) => {
    e.stopPropagation();
    if (favorites.includes(id)) {
      setFavorites(favorites.filter(fId => fId !== id));
    } else {
      setFavorites([...favorites, id]);
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

  const addProduct = (newProduct) => {
    try {
      setProducts([{ ...newProduct, id: Date.now() }, ...products]);
    } catch(e) {
      alert("Не удалось добавить. Возможно фотография слишком большая!");
    }
  };

  const updateProduct = (updatedProduct) => {
    setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const deleteProduct = (id) => {
    if (window.confirm("Удалить это объявление?")) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const handleNavClick = (navItem) => {
    setActiveNav(navItem);
    if (navItem === 'profile') {
      setView('admin');
    } else if (navItem === 'tags') {
      setView('favorites');
    } else {
      setView('home');
    }
  };

  const addToCart = (qty) => {
    setCartCount(cartCount + qty);
    alert(`Добавлено в корзину: ${qty} шт.`);
  };

  return (
    <div className="app-container">
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
      
      {view !== 'details' && (
        <BottomNav activeNav={activeNav} handleNavClick={handleNavClick} cartCount={cartCount}/>
      )}
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
                <div className="product-brand">{product.brand || "RedWear"}</div>
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
      <header className="header">
        <button className="icon-btn"><Menu size={20} /></button>
        <div className="app-logo">RedWear</div>
        <button className="icon-btn"><Bell size={20} /></button>
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
        <div className="promo-banner-standalone" style={{ position: 'relative' }}>
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
            <button className="promo-btn" style={{marginTop: '12px'}}>{banner.buttonText}</button>
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
                <div className="product-brand">{product.brand || "RedWear"}</div>
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
        <div className="details-brand">{product.brand || "RedWear"}</div>
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
        <button className="add-to-cart-btn" onClick={() => { addToCart(qty); goBack(); }}>
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

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      // Products continue to use Base64 since images are small
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result]);
      };
      if (file) {
        reader.readAsDataURL(file);
      }
    });
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
      brand: "RedWear",
      name,
      price: parseFloat(price),
      description,
      category,
      sizes,
      images
    };

    if (editingId) {
      updateProduct({ ...payload, id: editingId });
      alert("Изменения сохранены!");
    } else {
      addProduct(payload);
      alert("Товар успешно опубликован!");
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
              <div style={{marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px'}}>
                {banner.isVideo || banner.image.startsWith('data:video') ? (
                   <video src={banner.image} style={{height: '60px', borderRadius: '8px', background: 'black'}} />
                ) : (
                   <img src={banner.image} style={{height: '60px', borderRadius: '8px', objectFit: 'contain', background: 'var(--primary)'}} />
                )}
                <button type="button" className="remove-color-btn" onClick={() => setBanner({...banner, image: "", isVideo: false})}>
                  <X size={16} style={{marginRight: '4px'}}/> Удалить
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
        <div className={`nav-item ${activeNav === 'cart' ? 'active' : ''}`} onClick={() => handleNavClick('cart')} style={{position: 'relative'}}>
          <ShoppingBag size={20} />
          <span>Корзина</span>
          {cartCount > 0 && !activeNav.includes('cart') && (
            <div style={{
              position: 'absolute', top: '10px', right: '10px', 
              background: 'var(--primary)', color: 'white', 
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

export default App;
