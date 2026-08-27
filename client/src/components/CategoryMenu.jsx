import React, { useState, useRef, useEffect } from 'react';
import { Menu, Settings } from 'lucide-react';
import { 
  DEFAULT_CATEGORIES, 
  getStoredCategories, 
  getCategoryIconComponent 
} from '../utils/categoryStore';

export const CATEGORY_ITEMS = DEFAULT_CATEGORIES.map(c => ({
  name: c.name,
  icon: getCategoryIconComponent(c.iconName),
  key: c.key,
  shortcut: c.shortcut
}));

export default function CategoryMenu({
  onSelectCategory,
  onOpenManagerModal,
  customCategories
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const categories = customCategories || getStoredCategories();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (categoryName) => {
    onSelectCategory(categoryName);
    setIsOpen(false);
  };

  const handleOpenManager = () => {
    setIsOpen(false);
    if (onOpenManagerModal) {
      onOpenManagerModal();
    }
  };

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button 
        className={`category-menu-btn ${isOpen ? 'active' : ''}`}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setIsOpen(!isOpen)}
        title="Categorias (Menu Sanduíche)"
      >
        <Menu size={18} />
        <span>Categorias</span>
      </button>

      {isOpen && (
        <div 
          className="category-dropdown-menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            width: '270px',
            maxHeight: '440px',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            padding: '6px'
          }}
        >
          {/* Header */}
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--text-muted)',
            padding: '6px 10px 8px 10px',
            borderBottom: '1px solid var(--border-color)',
            marginBottom: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Categoria</span>
            <span>Atalho</span>
          </div>

          {/* List Body */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {categories.map((item) => {
              const IconComponent = getCategoryIconComponent(item.iconName);
              return (
                <button
                  key={item.id || item.name}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(item.name)}
                  className="category-menu-item"
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 10px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background-color 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <IconComponent size={15} color="var(--accent-primary)" />
                    <span>{item.name}</span>
                  </div>
                  {item.shortcut ? (
                    <span className="category-shortcut-badge" style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {item.shortcut}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Fixed Footer Action: Gerenciar Categorias */}
          <div style={{
            borderTop: '1px solid var(--border-color)',
            paddingTop: '6px',
            marginTop: '4px'
          }}>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleOpenManager}
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--accent-primary)',
                backgroundColor: 'rgba(37, 99, 235, 0.08)',
                border: '1px dashed var(--accent-primary)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <Settings size={14} />
              <span>⚙️ Gerenciar Categorias...</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
