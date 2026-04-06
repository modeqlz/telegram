import React, { useState, useEffect, useRef } from 'react';
import { X, ShoppingBag } from 'lucide-react';

function FlyingItem({ item, onComplete }) {
  const animId = useRef('fly_' + Math.random().toString(36).slice(2, 8));
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const summaryEl = document.querySelector('.outfit-summary');
    let destX, destY;

    if (summaryEl) {
      const summaryRect = summaryEl.getBoundingClientRect();
      destX = summaryRect.left + 40 - (item.startX + item.width / 2);
      destY = summaryRect.top + summaryRect.height / 2 - (item.startY + item.height / 2);
    } else {
      destX = (window.innerWidth / 2) - (item.startX + item.width / 2);
      destY = window.innerHeight - 120 - (item.startY + item.height / 2);
    }

    const midX = destX * 0.4;
    const midY = destY * 0.3 - 40;

    const keyframes = `
      @keyframes ${animId.current} {
        0% { transform: translate3d(0, 0, 0) scale(1) rotate(0deg); opacity: 1; }
        40% { transform: translate3d(${midX}px, ${midY}px, 0) scale(0.55) rotate(${item.rot * 0.5}deg); opacity: 1; }
        100% { transform: translate3d(${destX}px, ${destY}px, 0) scale(0.12) rotate(${item.rot}deg); opacity: 1; }
      }
    `;
    const styleSheet = document.createElement('style');
    styleSheet.textContent = keyframes;
    document.head.appendChild(styleSheet);

    const startTimer = setTimeout(() => setAnimating(true), 30);
    const timer = setTimeout(() => onComplete(item.id), 480);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(timer);
      document.head.removeChild(styleSheet);
    };
  }, [item, onComplete]);

  return (
    <img
      src={item.img}
      style={{
        position: 'fixed',
        top: item.startY,
        left: item.startX,
        width: item.width,
        height: item.height,
        objectFit: 'contain',
        zIndex: 150,
        pointerEvents: 'none',
        willChange: 'transform',
        animation: animating ? `${animId.current} 0.45s cubic-bezier(0.32, 0, 0.15, 1) forwards` : 'none'
      }}
      alt=""
    />
  );
}

function DressupRow({ subtitle, subcategories, allItems, selected, onSelect, emptyText }) {
  const scrollRef = useRef(null);
  const subcatScrollRef = useRef(null);
  const [activeSub, setActiveSub] = useState('Все');

  // No more filteredItems variable needed, handling via CSS

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('centered');
        } else {
          entry.target.classList.remove('centered');
        }
      });
    }, {
      root: container,
      rootMargin: '0px -38% 0px -38%',
      threshold: 0
    });

    const children = container.querySelectorAll('.dressup-item');
    children.forEach(c => observer.observe(c));

    return () => observer.disconnect();
  }, [allItems]);

  useEffect(() => {
    const container = subcatScrollRef.current;
    if (!container) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('centered');
          setActiveSub(entry.target.dataset.key);
        } else {
          entry.target.classList.remove('centered');
        }
      });
    }, {
      root: container,
      rootMargin: '0px -49% 0px -49%', // Exact center only
      threshold: 0
    });

    const children = container.querySelectorAll('.dressup-subcat');
    children.forEach(c => observer.observe(c));

    return () => observer.disconnect();
  }, [subcategories]);

  // Get the active subcategory label for header
  const activeLabel = activeSub === 'Все' ? subcategories[0].label : subcategories.find(s => s.key === activeSub)?.label || subcategories[0].label;

  return (
    <div className="dressup-row-wrap">
      <div className="dressup-row-header">
        <span className="subtitle">{subtitle}</span>
      </div>
      <div className="dressup-subcats-wrap">
        <div className="dressup-subcats" ref={subcatScrollRef}>
          {subcategories.map(sub => (
            <div 
              key={sub.key} 
              data-key={sub.key}
              className={`dressup-subcat ${activeSub === sub.key ? 'centered' : ''}`}
              onClick={(e) => {
                const el = e.currentTarget;
                const container = el.parentElement;
                const scrollLeft = el.offsetLeft - container.offsetLeft - (container.clientWidth / 2) + (el.clientWidth / 2);
                container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
                container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
                setActiveSub(sub.key);
              }}
            >
              {sub.label}
            </div>
          ))}
        </div>
      </div>
      <div className="dressup-scroll" ref={scrollRef}>
        {allItems.length > 0 ? allItems.map(p => {
          const isMatch = activeSub === 'Все' || p.category === activeSub;
          return (
            <div 
              key={p.id} 
              className={`dressup-item ${selected?.id === p.id ? 'selected' : ''} ${!isMatch ? 'hidden' : ''}`}
              onClick={(e) => isMatch && onSelect(e, p)}
            >
              <img src={p.images && p.images.length > 0 ? p.images[0] : p.image} alt={p.name} />
            </div>
          );
        }) : <div className="dressup-empty">{emptyText}</div>}
      </div>
    </div>
  );
}

export function DressupView({ products, addToCart, showToast }) {
  const tops = products.filter(p => ["Худи", "Куртки", "Футболки"].includes(p.category));
  const bottoms = products.filter(p => ["Джинсы", "Брюки", "Шорты"].includes(p.category));
  const shoes = products.filter(p => ["Обувь"].includes(p.category));
  const accessories = products.filter(p => ["Аксессуары"].includes(p.category));

  const [selectedTop, setSelectedTop] = useState(null);
  const [selectedBottom, setSelectedBottom] = useState(null);
  const [selectedShoe, setSelectedShoe] = useState(null);
  const [flyingItems, setFlyingItems] = useState([]);
  const [previewProduct, setPreviewProduct] = useState(null);
  const [descExpanded, setDescExpanded] = useState(false);

  const handleSelect = (e, item, setter, slotIndex) => {
    const imgEl = e.currentTarget.querySelector('img');
    if (imgEl) {
      const rect = imgEl.getBoundingClientRect();
      const hash = String(item.id).split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
      const rot = (Math.abs(hash) % 24) - 12;
      
      setFlyingItems(prev => [...prev, {
        id: Date.now() + Math.random(),
        rot,
        img: item.images && item.images.length > 0 ? item.images[0] : item.image,
        startX: rect.left,
        startY: rect.top,
        width: rect.width,
        height: rect.height,
        slotIndex,
        executeSetter: () => setter(item)
      }]);
    } else {
      setter(item);
    }
  };

  const selectedItems = [selectedTop, selectedBottom, selectedShoe].filter(Boolean);
  const outfitTotal = selectedItems.reduce((sum, item) => sum + Number(item.price), 0);
  const itemCount = selectedItems.length;

  const handleBuyOutfit = () => {
    let count = 0;
    const defaultSize = (p) => p.sizes && p.sizes.length > 0 ? p.sizes[0] : null;
    
    if (selectedTop) { addToCart(selectedTop, 1, defaultSize(selectedTop), true); count++; }
    if (selectedBottom) { addToCart(selectedBottom, 1, defaultSize(selectedBottom), true); count++; }
    if (selectedShoe) { addToCart(selectedShoe, 1, defaultSize(selectedShoe), true); count++; }
    
    if (count > 0) {
      showToast(`Весь образ (${count} вещи) добавлен в корзину!`);
      setSelectedTop(null);
      setSelectedBottom(null);
      setSelectedShoe(null);
    } else {
      showToast('Сначала выберите крутые вещи!');
    }
  };

  return (
    <>
    <div className="dressup-view page-transition">
      <div className="dressup-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 20px', marginBottom: '12px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>Dressup</h2>
      </div>

      <DressupRow
        subtitle="TOPS"
        subcategories={[
          { key: 'Все', label: 'Все' },
          { key: 'Футболки', label: 'Футболки' },
          { key: 'Худи', label: 'Худи' },
          { key: 'Куртки', label: 'Куртки' },
        ]}
        allItems={tops}
        selected={selectedTop}
        onSelect={(e, p) => handleSelect(e, p, setSelectedTop, 0)}
        emptyText="Добавьте верх в админке"
      />

      <div className="dressup-divider" />

      <DressupRow
        subtitle="PANTS"
        subcategories={[
          { key: 'Все', label: 'Все' },
          { key: 'Джинсы', label: 'Джинсы' },
          { key: 'Брюки', label: 'Брюки' },
          { key: 'Шорты', label: 'Шорты' },
        ]}
        allItems={bottoms}
        selected={selectedBottom}
        onSelect={(e, p) => handleSelect(e, p, setSelectedBottom, selectedTop ? 1 : 0)}
        emptyText="Добавьте низ в админке"
      />

      <div className="dressup-divider" />

      <DressupRow
        subtitle="SHOES"
        subcategories={[
          { key: 'Все', label: 'Кроссовки' },
        ]}
        allItems={shoes}
        selected={selectedShoe}
        onSelect={(e, p) => handleSelect(e, p, setSelectedShoe, (selectedTop ? 1 : 0) + (selectedBottom ? 1 : 0))}
        emptyText="Добавьте обувь в админке"
      />

      <div style={{ paddingBottom: '120px' }}></div>
    </div>
      
      {/* Product Preview Bottom Sheet */}
      {previewProduct && (
        <>
          <div 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, animation: 'fadeIn 0.3s' }} 
            onClick={() => setPreviewProduct(null)}
          />
          <div 
            style={{
              position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: 'calc(100% - 40px)', maxWidth: '400px', background: 'var(--card-bg)', borderRadius: '24px',
              padding: '24px', zIndex: 1001,
              animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
            }}
          >
            <button 
               onClick={() => setPreviewProduct(null)} 
               style={{ position: 'absolute', top: '16px', right: '16px', background: 'var(--surface-elevated)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, boxShadow: 'var(--shadow-sm)' }}>
               <X size={16} strokeWidth={2.5} color="var(--text-muted)"/>
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', position: 'relative', marginTop: '12px' }}>
              <div 
               id="preview-modal-img"
               style={{ width: '100%', height: '220px', flexShrink: 0, borderRadius: '16px', background: 'var(--surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                <img src={previewProduct.item.images?.[0] || previewProduct.item.image} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '20px' }} alt="" />
              </div>
              <div style={{ width: '100%', textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', fontWeight: 700, lineHeight: 1.2, color: 'var(--text-main)' }}>{previewProduct.item.name}</h3>
                <p style={{ margin: '0 0 16px', fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>{Number(previewProduct.item.price)} ₽</p>
                <div onClick={() => setDescExpanded(!descExpanded)} style={{ cursor: 'pointer', background: 'var(--surface-elevated)', padding: '12px', borderRadius: '12px' }}>
                  <p style={{ 
                    margin: 0, fontSize: '0.95rem', color: 'var(--text-muted)', textAlign: 'left', lineHeight: 1.4,
                    display: descExpanded ? 'block' : '-webkit-box', 
                    WebkitLineClamp: descExpanded ? 'unset' : 3, 
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    transition: 'all 0.3s'
                  }}>
                    {previewProduct.item.description || 'Идеальное дополнение к вашему образу.'}
                  </p>
                  {!descExpanded && <div style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 700, marginTop: '6px', textAlign: 'left' }}>Развернуть</div>}
                </div>
              </div>
            </div>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                const defaultSize = previewProduct.item.sizes && previewProduct.item.sizes.length > 0 ? previewProduct.item.sizes[0] : null;
                addToCart(previewProduct.item, 1, defaultSize, true);
                showToast('Добавлено в корзину!');
                setPreviewProduct(null);
              }}
              style={{
                width: '100%', marginTop: '32px', marginBottom: '8px', padding: '16px', background: 'var(--primary)', color: 'white',
                border: 'none', borderRadius: 'var(--radius-full)', fontSize: '1.1rem', fontWeight: 800,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
            >
              Добавить в корзину
            </button>
          </div>
        </>
      )}
      
      {/* Flying transition objects */}
      {flyingItems.map(item => (
        <FlyingItem 
          key={item.id} 
          item={item} 
          onComplete={(id) => {
            if (item.executeSetter) item.executeSetter();
            setFlyingItems(prev => prev.filter(i => i.id !== id));
          }} 
        />
      ))}

      {/* Outfit Summary Bar */}
      {itemCount > 0 && (
        <div className="outfit-summary">
          <div className="outfit-avatars">
            {[
              { item: selectedTop, setter: setSelectedTop },
              { item: selectedBottom, setter: setSelectedBottom },
              { item: selectedShoe, setter: setSelectedShoe }
            ].map(({ item, setter }, i) => {
              if (!item) return null;
              return (
                <div key={i} className="outfit-avatar" onClick={() => {
                  setPreviewProduct({ item });
                  setDescExpanded(false);
                }}>
                  <img src={item.images?.[0] || item.image} alt="" />
                  <div className="remove-x" onClick={(e) => { e.stopPropagation(); setter(null); }}>
                    <X size={8} strokeWidth={3} color="var(--text-muted)" />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="outfit-info">
            <div className="count">{itemCount} {itemCount === 1 ? 'вещь' : itemCount < 5 ? 'вещи' : 'вещей'}</div>
            <div className="total">{outfitTotal.toLocaleString()} ₽</div>
          </div>
          <button className="outfit-buy-btn" onClick={handleBuyOutfit}>
            <ShoppingBag size={16} style={{ marginRight: '6px', verticalAlign: '-2px' }} />
            Купить лук
          </button>
        </div>
      )}
    </>
  );
}
