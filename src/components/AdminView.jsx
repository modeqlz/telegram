import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronRight, ChevronLeft, User, Package, UploadCloud, Edit2, Trash2, X, ArrowLeft } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { CATEGORIES } from '../constants';
export function AdminView({ products, addProduct, updateProduct, deleteProduct, goBack, banner, setBanner, showToast }) {
  const [adminTab, setAdminTab] = useState('orders');
  const [editingId, setEditingId] = useState(null);
  const [orders, setOrders] = useState([]);
  const [name, setName] = useState('');
  const priceRef = useRef(null);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [sizesRaw, setSizesRaw] = useState('');
  const [images, setImages] = useState([]);
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [clientSearchText, setClientSearchText] = useState('');
  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) setOrders(data);
    };
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('last_visit', { ascending: false });
      if (!error && data) setUsersList(data);
    };
    if (adminTab === 'orders') fetchOrders();
    if (adminTab === 'clients') fetchUsers();
  }, [adminTab]);
  const updateOrderStatus = async (orderId, newStatus) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);
    if (!error) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      showToast(`Статус обновлён: ${statusLabels[newStatus]}`);
    }
  };
  const statusLabels = {
    pending: 'Ожидает',
    confirmed: 'Подтверждён',
    shipped: 'Отправлен',
    delivered: 'Доставлен',
    cancelled: 'Отменён'
  };
  const statusColors = {
    pending: '#f59e0b',
    confirmed: '#3b82f6',
    shipped: '#8b5cf6',
    delivered: '#22c55e',
    cancelled: '#ef4444'
  };
  const handleBannerImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const isVid = file.type.startsWith('video/');
      const fileExt = file.name.split('.').pop();
      const fileName = `banner_${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      try {
        const { error } = await supabase.storage
          .from('product-images')
          .upload(fileName, file);
        if (error) {
          console.error("Banner upload error:", error);
          alert("Ошибка загрузки в Supabase. Проверьте права и лимиты.");
          return;
        }
        const { data } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);
        setBanner({ ...banner, image: data.publicUrl, isVideo: isVid });
      } catch (err) {
        console.error("Upload failed", err);
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
          const { error } = await supabase.storage
            .from('product-images')
            .upload(fileName, file);
          if (error) {
            console.error("Upload error:", error);
            alert("Ошибка загрузки. Проверьте права доступа в Supabase RLS.");
            continue;
          }
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
    if (priceRef.current) priceRef.current.value = product.price ? product.price.toString() : '';
    setCategory(product.category);
    setDescription(product.description || "");
    setSizesRaw(product.sizes ? product.sizes.join(', ') : "");
    setImages(product.images || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const cancelEdit = () => {
    setEditingId(null);
    setName('');
    if (priceRef.current) priceRef.current.value = '';
    setCategory(CATEGORIES[0]);
    setDescription('');
    setSizesRaw('');
    setImages([]);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    const sizes = sizesRaw.split(',').map(s => s.trim()).filter(s => s.length > 0);
    const priceVal = priceRef.current ? priceRef.current.value.trim() : '';
    if (!name || !priceVal || images.length === 0) {
      alert("Пожалуйста, заполните Имя, Цену и загрузите хотя бы 1 фото!");
      return;
    }
    let parsedPrice = priceVal;
    if (typeof parsedPrice === 'string') {
      let cleaned = parsedPrice.replace(/\s/g, '');
      if (cleaned.includes('.') && cleaned.includes(',')) {
        const dotPos = cleaned.lastIndexOf('.');
        const commaPos = cleaned.lastIndexOf(',');
        if (commaPos > dotPos) {
          cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        } else {
          cleaned = cleaned.replace(/,/g, '').replace('.', '.');
        }
      } else if ((cleaned.match(/\./g) || []).length > 1) {
        cleaned = cleaned.replace(/\./g, '');
      } else if ((cleaned.match(/,/g) || []).length > 1) {
        cleaned = cleaned.replace(/,/g, '');
      } else if (/^\d+[.,]\d{3}$/.test(cleaned)) {
        cleaned = cleaned.replace(/[.,]/g, '');
      } else {
        cleaned = cleaned.replace(',', '.');
      }
      parsedPrice = parseFloat(cleaned) || 0;
    }

    const payload = {
      brand: "DVK Shop",
      name,
      price: parsedPrice,
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
      <div className="categories" style={{padding: '0 20px 24px', margin: '0 -20px', width: 'calc(100% + 40px)', display: 'flex', overflowX: 'auto', WebkitOverflowScrolling: 'touch'}}>
        <div className={`category-pill ${adminTab === 'orders' ? 'active' : ''}`} onClick={() => { setAdminTab('orders'); cancelEdit(); }}>
          Заказы {orders.filter(o => o.status === 'pending').length > 0 && `(${orders.filter(o => o.status === 'pending').length})`}
        </div>
        <div className={`category-pill ${adminTab === 'clients' ? 'active' : ''}`} onClick={() => { setAdminTab('clients'); cancelEdit(); }}>
          Клиенты
        </div>
        <div className={`category-pill ${adminTab === 'add_product' ? 'active' : ''}`} onClick={() => { setAdminTab('add_product'); cancelEdit(); }}>
          {editingId ? 'Редакт.' : '+ Товар'}
        </div>
        <div className={`category-pill ${adminTab === 'list' ? 'active' : ''}`} onClick={() => { setAdminTab('list'); cancelEdit(); }}>
          Товары ({products.length})
        </div>
        <div className={`category-pill ${adminTab === 'banner' ? 'active' : ''}`} onClick={() => { setAdminTab('banner'); cancelEdit(); }}>
          Баннер
        </div>
      </div>
      {adminTab === 'clients' && (
        <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
          <div className="search-input-wrap" style={{width: '100%', marginBottom: '8px'}}>
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Поиск по ID, @username или имени..." 
              value={clientSearchText}
              onChange={(e) => setClientSearchText(e.target.value)}
              style={{padding: '12px 12px 12px 40px', fontSize: '0.9rem'}}
            />
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
            {usersList.filter(u => {
               if(!clientSearchText) return true;
               const q = clientSearchText.toLowerCase();
               return (u.username && u.username.toLowerCase().includes(q)) || 
                      (u.first_name && u.first_name.toLowerCase().includes(q)) || 
                      String(u.telegram_id).includes(q);
            }).map(user => (
              <div key={user.telegram_id} style={{background: 'var(--card-bg)', borderRadius: 'var(--radius-lg)', padding: '16px', border: '1px solid var(--border)', display: 'flex', gap: '16px', alignItems: 'center', boxShadow: 'var(--shadow-sm)'}}>
                <div style={{position: 'relative'}}>
                  {user.photo_url ? (
                    <img src={user.photo_url} alt="" style={{width: '46px', height: '46px', borderRadius: '50%', objectFit: 'cover'}} />
                  ) : (
                    <div style={{width: '46px', height: '46px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 700}}>{user.first_name ? user.first_name[0] : <User size={20}/>}</div>
                  )}
                  <div style={{position: 'absolute', bottom: 0, right: -2, width: '12px', height: '12px', borderRadius: '50%', background: (new Date() - new Date(user.last_visit)) < 15 * 60000 ? '#22c55e' : '#6b7280', border: '2px solid var(--card-bg)'}}></div>
                </div>
                <div style={{flex: 1}}>
                  <div style={{fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px'}}>
                    {user.first_name} {user.last_name}
                    {user.is_admin && <span style={{fontSize: '0.65rem', background: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '100px', fontWeight: 700}}>АДМИН</span>}
                  </div>
                  <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center'}}>
                    <span>{user.username ? `@${user.username}` : `ID: ${user.telegram_id}`}</span>
                    <span style={{fontWeight: 600, color: 'var(--text-main)', background: 'var(--surface-elevated)', border: '1px solid var(--border)', padding: '2px 6px', borderRadius: '6px', display: 'inline-block'}}>Баланс: {user.balance || 0} ₽</span>
                  </div>
                </div>
                <button 
                  style={{background: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', color: 'var(--text-main)'}}
                  onClick={async () => {
                    const newBalStr = window.prompt(`Введите новый баланс для ${user.first_name}:`, user.balance || 0);
                    if (newBalStr !== null) {
                      const newBal = Number(newBalStr);
                      if (!isNaN(newBal)) {
                         const { error } = await supabase.from('users').update({ balance: newBal }).eq('telegram_id', user.telegram_id);
                         if (!error) {
                           setUsersList(prev => prev.map(u => u.telegram_id === user.telegram_id ? {...u, balance: newBal} : u));
                           showToast('Баланс обновлён!');
                         } else {
                           showToast('Ошибка при обновлении баланса');
                         }
                      }
                    }
                  }}
                >
                  Баланс
                </button>
              </div>
            ))}
            {usersList.length === 0 && (
              <div style={{textAlign: 'center', color: 'var(--text-muted)', marginTop: '20px'}}>Загрузка...</div>
            )}
          </div>
        </div>
      )}
      {adminTab === 'orders' && (
        <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
          {orders.length === 0 ? (
            <div className="empty-state" style={{padding: '40px 20px', textAlign: 'center'}}>
              <Package size={48} style={{margin: '0 auto 16px', color: 'var(--text-muted)', opacity: 0.5}} />
              <p style={{color: 'var(--text-muted)'}}>Заказов пока нет</p>
            </div>
          ) : orders.map(order => (
            <div key={order.id} style={{background: 'var(--card-bg)', borderRadius: 'var(--radius-lg)', padding: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
                <div>
                  <div style={{fontWeight: 700, fontSize: '1rem'}}>{order.telegram_name || 'Покупатель'}</div>
                  {order.telegram_username && (
                    <div 
                      style={{fontSize: '0.8rem', color: 'var(--primary)', cursor: 'pointer', marginTop: '2px'}}
                      onClick={() => {
                        const url = `https://t.me/${order.telegram_username}`;
                        if (window.Telegram && window.Telegram.WebApp) {
                          window.Telegram.WebApp.openTelegramLink(url);
                        } else {
                          window.open(url, '_blank');
                        }
                      }}
                    >
                      @{order.telegram_username}
                    </div>
                  )}
                </div>
                <div style={{
                  padding: '4px 10px', 
                  borderRadius: 'var(--radius-full)', 
                  fontSize: '0.75rem', 
                  fontWeight: 600,
                  background: `${statusColors[order.status]}20`,
                  color: statusColors[order.status],
                  border: `1px solid ${statusColors[order.status]}40`
                }}>
                  {statusLabels[order.status] || order.status}
                </div>
              </div>
              <div style={{display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px'}}>
                {(order.items || []).map((item, idx) => (
                  <div key={idx} style={{display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem'}}>
                    {item.image && <img src={item.image} alt="" style={{width: '36px', height: '36px', objectFit: 'contain', borderRadius: '6px', background: 'var(--surface-elevated)'}} />}
                    <div style={{flex: 1}}>
                      <span style={{fontWeight: 500}}>{item.name}</span>
                      {item.size && <span style={{color: 'var(--text-muted)'}}> • {item.size}</span>}
                    </div>
                    <span style={{color: 'var(--text-muted)'}}>{item.qty}x</span>
                    <span style={{fontWeight: 600}}>{Number(item.price) * item.qty} ₽</span>
                  </div>
                ))}
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '10px', marginBottom: '12px'}}>
                <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>{new Date(order.created_at).toLocaleString('ru-RU')}</div>
                <div style={{fontWeight: 700, fontSize: '1.05rem'}}>{order.total} ₽</div>
              </div>
              {order.status !== 'delivered' && order.status !== 'cancelled' && (
                <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                  {order.status === 'pending' && (
                    <>
                      <button className="btn-primary" style={{flex: 1, padding: '8px', fontSize: '0.8rem'}} onClick={() => updateOrderStatus(order.id, 'confirmed')}>
                        Подтвердить
                      </button>
                      <button style={{flex: 1, padding: '8px', fontSize: '0.8rem', background: 'var(--surface-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer'}} onClick={() => updateOrderStatus(order.id, 'cancelled')}>
                        Отклонить
                      </button>
                    </>
                  )}
                  {order.status === 'confirmed' && (
                    <button style={{flex: 1, padding: '8px', fontSize: '0.8rem', background: '#8b5cf620', color: '#8b5cf6', border: '1px solid #8b5cf640', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600}} onClick={() => updateOrderStatus(order.id, 'shipped')}>
                      Отправлен
                    </button>
                  )}
                  {order.status === 'shipped' && (
                    <button style={{flex: 1, padding: '8px', fontSize: '0.8rem', background: '#22c55e20', color: '#22c55e', border: '1px solid #22c55e40', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600}} onClick={() => updateOrderStatus(order.id, 'delivered')}>
                      Доставлен
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
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
                <div className="promo-banner-standalone" style={{ minHeight: '180px', pointerEvents: 'none', position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', background: 'black', margin: 0 }}>
                    {banner.isVideo || banner.image.startsWith('data:video') ? (
                       <video src={banner.image} autoPlay loop muted playsInline controls={false} disablePictureInPicture preload="auto" className="promo-image-standalone" style={{objectFit: 'cover', width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}} />
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
                <div 
                  className={`preview-item ${draggedIdx === idx ? 'dragged' : ''}`} 
                  key={idx} 
                  data-index={idx}
                  draggable
                  onDragStart={(e) => {
                     setDraggedIdx(idx);
                     if(e.dataTransfer) {
                       e.dataTransfer.effectAllowed = 'move';
                       e.dataTransfer.setData('text/plain', '');
                     }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if(e.dataTransfer) e.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedIdx !== null && draggedIdx !== idx) {
                       setImages(prev => {
                         const newArr = [...prev];
                         const draggedItem = newArr.splice(draggedIdx, 1)[0];
                         newArr.splice(idx, 0, draggedItem);
                         return newArr;
                       });
                    }
                    setDraggedIdx(null);
                  }}
                  onDragEnd={() => setDraggedIdx(null)}
                  onTouchStart={(e) => {
                     setDraggedIdx(idx);
                  }}
                  onTouchMove={(e) => {
                    if (draggedIdx === null) return;
                    const touch = e.touches[0];
                    const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
                    const targetDiv = targetEl?.closest('.preview-item');
                    if (targetDiv) {
                       const targetIdx = parseInt(targetDiv.getAttribute('data-index'), 10);
                       if (!isNaN(targetIdx) && targetIdx !== draggedIdx) {
                           setImages(prev => {
                               const newArr = [...prev];
                               const draggedItem = newArr.splice(draggedIdx, 1)[0];
                               newArr.splice(targetIdx, 0, draggedItem);
                               return newArr;
                           });
                           setDraggedIdx(targetIdx); 
                       }
                    }
                  }}
                  onTouchEnd={() => setDraggedIdx(null)}
                  style={{ 
                    position: 'relative', 
                    border: idx === 0 ? '2px solid var(--primary)' : '1px solid var(--border)', 
                    padding: idx === 0 ? '2px' : '0',
                    opacity: draggedIdx === idx ? 0.4 : 1,
                    cursor: 'grab',
                    touchAction: 'none',
                    transform: draggedIdx === idx ? 'scale(0.95)' : 'scale(1)',
                    transition: 'transform 0.1s, opacity 0.1s'
                  }}
                >
                  <img src={imgSrc} alt={`upload-${idx}`} style={{ borderRadius: '4px', pointerEvents: 'none' }} />
                  {idx === 0 && (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '0.65rem', padding: '2px 0', textAlign: 'center', fontWeight: 'bold' }}>
                      ПРЕВЬЮ
                    </div>
                  )}
                  <button type="button" className="remove-btn-absolute" onClick={() => removeImage(idx)} style={{ zIndex: 10 }}>
                    <X size={14} />
                  </button>
                  {idx > 0 && (
                    <button 
                      type="button" 
                      onClick={() => {
                        setImages(prev => {
                          const newArr = [...prev];
                          const selected = newArr.splice(idx, 1)[0];
                          newArr.unshift(selected);
                          return newArr;
                        });
                      }}
                      style={{
                        position: 'absolute', top: '4px', left: '4px', background: 'rgba(0,0,0,0.7)', 
                        color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '4px', 
                        fontSize: '0.65rem', padding: '4px 6px', cursor: 'pointer', zIndex: 5
                      }}
                    >
                      ★ Главная
                    </button>
                  )}
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
            <label className="form-label">Цена (₽)</label>
            <input 
              type="text" 
              className="form-input" 
              ref={priceRef}
              defaultValue=""
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="Пример: 24890"
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
                 <div className="ad-item-price">{Number(product.price)} ₽</div>
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
