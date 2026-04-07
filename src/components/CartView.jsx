import React, { useState } from 'react';
import { ArrowLeft, ShoppingBag, X, Minus, Plus } from 'lucide-react';
import { supabase } from '../supabaseClient';
export function CartView({ cartItems, setCartItems, goBack, activeNav, handleNavClick, tgUser, showToast }) {
  const total = cartItems.reduce((acc, item) => acc + (parseFloat(item.price) * item.qty), 0);
  const [isOrdering, setIsOrdering] = useState(false);
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
  const placeOrder = async () => {
    if (!tgUser) {
      showToast('Откройте приложение через Telegram');
      return;
    }
    if (cartItems.length === 0) return;
    setIsOrdering(true);
    try {
      const orderItems = cartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        qty: item.qty,
        size: item.selectedSize || null,
        image: item.images?.[0] || ''
      }));
      const { error } = await supabase
        .from('orders')
        .insert({
          telegram_id: tgUser.id,
          telegram_username: tgUser.username || '',
          telegram_name: `${tgUser.first_name || ''} ${tgUser.last_name || ''}`.trim(),
          items: orderItems,
          total: total,
          status: 'pending'
        });
      if (error) {
        console.error('Order error:', error);
        showToast('Ошибка при оформлении заказа');
      } else {
        showToast('Заказ оформлен! Ожидайте подтверждения.');
        setCartItems([]);
        handleNavClick('profile');
      }
    } catch (err) {
      console.error(err);
      showToast('Ошибка сети');
    } finally {
      setIsOrdering(false);
    }
  };
  return (
    <div className="cart-page page-transition" style={{minHeight: '100vh', display: 'flex', flexDirection: 'column'}}>
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
                <div key={item.cartId} style={{display: 'flex', gap: '16px', background: 'var(--card-bg)', padding: '12px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)'}}>
                  <div style={{width: '80px', height: '80px', flexShrink: 0, borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--surface-elevated)'}}>
                    <img src={item.images?.[0]} alt="" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
                  </div>
                  <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                    <div style={{fontWeight: 600, fontSize: '0.95rem', display: 'flex', justifyContent: 'space-between'}}>
                      <span>{item.name}</span>
                      <button onClick={() => removeItem(item.cartId)} style={{background: 'none', border: 'none', padding: 0, color: 'var(--text-muted)'}}><X size={18}/></button>
                    </div>
                    {item.selectedSize && <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px'}}>Размер: {item.selectedSize}</div>}
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '8px'}}>
                      <div style={{fontWeight: 700}}>{Number(item.price)} ₽</div>
                      <div style={{display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--surface-elevated)', padding: '4px 8px', borderRadius: '100px'}}>
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
                <span>{total} ₽</span>
              </div>
              <button 
                className="btn-primary" 
                style={{width: '100%', height: '56px', fontSize: '1.1rem', opacity: isOrdering ? 0.6 : 1}} 
                onClick={placeOrder}
                disabled={isOrdering}
              >
                {isOrdering ? 'Оформляем...' : 'Оформить заказ'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
