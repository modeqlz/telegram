import React from 'react';
import { Home, Heart, Layers, ShoppingBag, User } from 'lucide-react';
export function BottomNav({ activeNav, handleNavClick, cartCount = 0, tgUser }) {
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
              position: 'absolute', top: '2px', right: '12px', 
              background: 'var(--primary)', 
              borderRadius: '50%', width: '8px', height: '8px', 
              boxShadow: '0 0 0 2px rgba(20, 20, 20, 0.95)'
            }}>
            </div>
          )}
        </div>
        <div className={`nav-item ${activeNav === 'profile' ? 'active' : ''}`} onClick={() => handleNavClick('profile')}>
          {tgUser && tgUser.photo_url ? (
            <img src={tgUser.photo_url} alt="" style={{width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', opacity: activeNav === 'profile' ? 1 : 0.6}} />
          ) : (
            <User size={20} />
          )}
          <span>Профиль</span>
        </div>
      </div>
    </div>
  );
}
