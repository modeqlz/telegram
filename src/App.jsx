import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, Bell, Search, SlidersHorizontal, ArrowLeft, Heart, 
  Home, Tag, ShoppingBag, User, Plus, Minus, X, UploadCloud,
  Edit2, Trash2, Volume2, VolumeX, Layers, Package, Info, ChevronRight, HelpCircle,
  Truck, Zap, CreditCard
} from 'lucide-react';
import { supabase } from './supabaseClient';

import { CATEGORIES, ADMIN_IDS } from './constants';
import { BottomNav } from './components/BottomNav';
import { CartView } from './components/CartView';
import { FavoritesView } from './components/FavoritesView';
import { HomeView } from './components/HomeView';
import { DetailsView } from './components/DetailsView';
import { AdminView } from './components/AdminView';
import { ProfileView } from './components/ProfileView';
import { DressupView } from './components/DressupView';

function App() {
  const [products, setProducts] = useState([]);
  const [tgUser, setTgUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // If running in Telegram Web App, force expand to fix viewport bug where 100vh gets truncated
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.expand();
      if (window.Telegram.WebApp.disableVerticalSwipes) {
        window.Telegram.WebApp.disableVerticalSwipes(); // Blocks swiping down to close the app natively
      }
      if (window.Telegram.WebApp.initDataUnsafe?.user) {
        const user = window.Telegram.WebApp.initDataUnsafe.user;
        setTgUser(user);
        
        // Sync user with Supabase and check admin rights
        const syncUser = async () => {
          try {
            await supabase.from('users').upsert({
              telegram_id: user.id,
              username: user.username || '',
              first_name: user.first_name || '',
              last_name: user.last_name || '',
              photo_url: user.photo_url || '',
              last_visit: new Date().toISOString()
            }, { onConflict: 'telegram_id' });
            
            const { data } = await supabase.from('users').select('is_admin').eq('telegram_id', user.id).single();
            if ((data && data.is_admin) || ADMIN_IDS.includes(user.id)) {
              setIsAdmin(true);
            }
          } catch (e) {
            console.error("Error syncing user:", e);
            if (ADMIN_IDS.includes(user.id)) setIsAdmin(true);
          }
        };
        syncUser();
      }
      window.Telegram.WebApp.ready();
    }

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

  const [banner, setBanner] = useState({ title: "", buttonText: "", image: "", isVideo: false, link: "" });
  const [bannerId, setBannerId] = useState(null);

  // Load banner from Supabase on mount
  useEffect(() => {
    const fetchBanner = async () => {
      const { data, error } = await supabase
        .from('banner')
        .select('*')
        .limit(1)
        .single();
      
      if (!error && data) {
        setBannerId(data.id);
        setBanner({
          title: data.title || '',
          buttonText: data.button_text || '',
          image: data.image_url || '',
          isVideo: data.is_video || false,
          link: data.link || ''
        });
      }
    };
    fetchBanner();
  }, []);

  // Save banner to Supabase when it changes (debounced)
  useEffect(() => {
    if (!bannerId) return;
    const timeout = setTimeout(async () => {
      await supabase
        .from('banner')
        .update({
          title: banner.title,
          button_text: banner.buttonText,
          image_url: banner.image,
          is_video: banner.isVideo,
          link: banner.link,
          updated_at: new Date().toISOString()
        })
        .eq('id', bannerId);
    }, 1000); // 1s debounce
    return () => clearTimeout(timeout);
  }, [banner, bannerId]);

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
  const [activeCategory, setActiveCategory] = useState("Все");
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
      setView('profile');
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
      <div key={view + (selectedProduct ? selectedProduct.id : '')}>
        {view === 'admin' ? (
          <AdminView 
            products={products}
            addProduct={addProduct} 
            updateProduct={updateProduct}
            deleteProduct={deleteProduct}
            goBack={() => setView('profile')} 
            banner={banner}
            setBanner={setBanner}
            showToast={showToast}
          />
        ) : view === 'profile' ? (
          <ProfileView 
            tgUser={tgUser}
            isAdmin={isAdmin}
            openAdmin={() => setView('admin')}
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
            tgUser={tgUser}
            showToast={showToast}
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
      {view !== 'details' && view !== 'admin' && (
        <BottomNav activeNav={activeNav} handleNavClick={handleNavClick} cartCount={cartCount} tgUser={tgUser}/>
      )}
    </div>
  );
}




export default App;
