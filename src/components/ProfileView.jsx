import React, { useState, useEffect } from 'react';
import { User, Package, ChevronRight, Info, HelpCircle, Edit2, X, Truck, Zap, CreditCard } from 'lucide-react';
import { supabase } from '../supabaseClient';

export function ProfileView({ tgUser, isAdmin, openAdmin }) {
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [myOrders, setMyOrders] = useState([]);
  const [dbUser, setDbUser] = useState(null);

  const statusLabels = { pending: '\u041e\u0436\u0438\u0434\u0430\u0435\u0442', confirmed: '\u041f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0451\u043d', shipped: '\u041e\u0442\u043f\u0440\u0430\u0432\u043b\u0435\u043d', delivered: '\u0414\u043e\u0441\u0442\u0430\u0432\u043b\u0435\u043d', cancelled: '\u041e\u0442\u043c\u0435\u043d\u0451\u043d' };
  const statusColors = { pending: '#f59e0b', confirmed: '#3b82f6', shipped: '#8b5cf6', delivered: '#22c55e', cancelled: '#ef4444' };

  useEffect(() => {
    if (!tgUser) return;
    const fetchMyOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('telegram_id', tgUser.id)
        .order('created_at', { ascending: false });
      if (!error && data) setMyOrders(data);
    };
    const fetchDbUser = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', tgUser.id)
        .single();
      if (!error && data) setDbUser(data);
    };
    fetchMyOrders();
    fetchDbUser();
  }, [tgUser]);

  const activeOrders = myOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
  
  return (
    <div className="profile-page page-transition" style={{minHeight: '100vh', display: 'flex', flexDirection: 'column'}}>
      <header className="header" style={{position: 'sticky', top: 0, background: 'var(--bg-main)', zIndex: 10, justifyContent: 'center'}}>
        <div className="app-logo" style={{fontSize: '1.2rem'}}>Профиль</div>
      </header>

      <div style={{padding: '30px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1}}>
        {tgUser ? (
          <>
            {tgUser.photo_url ? (
              <img src={tgUser.photo_url} alt="Profile" style={{width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', marginBottom: '16px', border: '3px solid var(--surface-elevated)', boxShadow: 'var(--shadow-md)'}} />
            ) : (
              <div style={{width: '90px', height: '90px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', marginBottom: '16px'}}>
                {tgUser.first_name ? tgUser.first_name[0].toUpperCase() : <User size={40} />}
              </div>
            )}
            <h2 style={{fontSize: '1.4rem', marginBottom: '4px', textAlign: 'center'}}>{tgUser.first_name} {tgUser.last_name}</h2>
            {tgUser.username && <div style={{color: 'var(--text-muted)', marginBottom: '16px'}}>@{tgUser.username}</div>}
            
            {/* Баланс */}
            <div style={{width: '100%', maxWidth: '340px', background: 'var(--card-bg)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '24px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div>
                <div style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>Мой баланс</div>
                <div style={{fontSize: '1.5rem', fontWeight: 700}}>{dbUser?.balance || 0} ₽</div>
              </div>
              <button 
                className="btn-primary" 
                style={{padding: '8px 16px', fontSize: '0.9rem', borderRadius: 'var(--radius-full)', margin: 0, width: 'auto'}}
                onClick={() => {
                  const url = `https://t.me/DvkShopSupportBot`; // Заглушка
                  if (window.Telegram && window.Telegram.WebApp) {
                    window.Telegram.WebApp.openTelegramLink(url);
                  } else {
                    window.open(url, '_blank');
                  }
                }}
              >
                Пополнить
              </button>
            </div>

            {/* Orders block - dynamic */}
            <div style={{width: '100%', maxWidth: '340px', background: 'var(--card-bg)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '24px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)'}}>
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '1.1rem'}}>
                  <Package size={20} color="var(--primary)" />
                  Мои заказы
                </div>
                <div style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>{activeOrders.length} активных</div>
              </div>
              {myOrders.length === 0 ? (
                <div style={{textAlign: 'center', padding: '24px 0', background: 'var(--surface-elevated)', borderRadius: 'var(--radius-md)'}}>
                  <div style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>У вас пока нет заказов</div>
                </div>
              ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                  {myOrders.slice(0, 5).map(order => (
                    <div key={order.id} style={{background: 'var(--surface-elevated)', borderRadius: 'var(--radius-md)', padding: '12px'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px'}}>
                        <div style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{new Date(order.created_at).toLocaleDateString('ru-RU')}</div>
                        <div style={{
                          padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '0.7rem', fontWeight: 600,
                          background: `${statusColors[order.status]}20`, color: statusColors[order.status]
                        }}>
                          {statusLabels[order.status] || order.status}
                        </div>
                      </div>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <div style={{fontSize: '0.85rem'}}>{(order.items || []).length} товар{(order.items || []).length > 4 ? 'ов' : (order.items || []).length > 1 ? 'а' : ''}</div>
                        <div style={{fontWeight: 700}}>{order.total} ₽</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Меню информации */}
            <div style={{width: '100%', maxWidth: '340px', background: 'var(--card-bg)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '24px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)'}}>
              <div 
                style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: 'transparent'}}
                onClick={() => setShowDeliveryModal(true)}
              >
                <div style={{display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1rem', fontWeight: 500}}>
                  <Info size={20} color="var(--text-muted)" />
                  Условия доставки
                </div>
                <ChevronRight size={20} color="var(--text-muted)" />
              </div>
              <div 
                style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', cursor: 'pointer', background: 'transparent'}}
                onClick={() => {
                  const url = `https://t.me/DvkShopSupportBot`; // Заглушка
                  if (window.Telegram && window.Telegram.WebApp) {
                    window.Telegram.WebApp.openTelegramLink(url);
                  } else {
                    window.open(url, '_blank');
                  }
                }}
              >
                <div style={{display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1rem', fontWeight: 500}}>
                  <HelpCircle size={20} color="var(--text-muted)" />
                  Служба поддержки
                </div>
                <ChevronRight size={20} color="var(--text-muted)" />
              </div>
            </div>


            {isAdmin && (
              <button className="btn-primary" style={{marginTop: '0', width: '100%', maxWidth: '340px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}} onClick={openAdmin}>
                <Edit2 size={18} /> Админ-панель (Добавить товар)
              </button>
            )}
          </>
        ) : (
          <div style={{textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px'}}>
            <User size={60} style={{margin: '0 auto 16px', opacity: 0.5}} />
            <p>Запустите мини-приложение через Telegram,<br/>чтобы загрузить профиль.</p>
          </div>
        )}
      </div>

      {/* Модальное окно "Условия доставки" */}
      {showDeliveryModal && (
        <div style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(10px)'}}>
          <div style={{background: 'var(--card-bg)', width: '100%', maxWidth: '360px', borderRadius: 'var(--radius-lg)', padding: '24px', position: 'relative', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)'}}>
            <button onClick={() => setShowDeliveryModal(false)} style={{position: 'absolute', top: '16px', right: '16px', background: 'var(--surface-elevated)', border: 'none', color: 'var(--text-main)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <X size={18} />
            </button>
            <h3 style={{fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-main)'}}>Условия доставки</h3>
            <div style={{fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '16px'}}>
              <div style={{display: 'flex', gap: '12px', alignItems: 'flex-start'}}>
                <Truck size={20} color="var(--primary)" style={{flexShrink: 0, marginTop: '2px'}} />
                <div><span style={{color: 'var(--text-main)', fontWeight: 600}}>Доставка СДЭК:</span><br/>Осуществляется по всей России и СНГ. Время доставки зависит от региона (3-5 дней).</div>
              </div>
              <div style={{display: 'flex', gap: '12px', alignItems: 'flex-start'}}>
                <Zap size={20} color="var(--primary)" style={{flexShrink: 0, marginTop: '2px'}} />
                <div><span style={{color: 'var(--text-main)', fontWeight: 600}}>Курьерская доставка:</span><br/>Моментальная доставка в Москве и Санкт-Петербурге на следующий день.</div>
              </div>
              <div style={{display: 'flex', gap: '12px', alignItems: 'flex-start'}}>
                <CreditCard size={20} color="var(--primary)" style={{flexShrink: 0, marginTop: '2px'}} />
                <div><span style={{color: 'var(--text-main)', fontWeight: 600}}>Оплата:</span><br/>Безопасная оплата картой онлайн или при получении в пункте выдачи после примерки.</div>
              </div>
            </div>
            <button className="btn-primary" style={{width: '100%', marginTop: '20px'}} onClick={() => setShowDeliveryModal(false)}>
              Понятно
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
