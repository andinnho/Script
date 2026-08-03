import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  AlertTriangle, 
  RotateCcw, 
  Network, 
  Headphones, 
  Smartphone, 
  Activity, 
  TrendingUp, 
  Server, 
  Radio, 
  Clipboard, 
  FileText, 
  Database, 
  Clock, 
  Hourglass, 
  Tag, 
  Phone, 
  Signal 
} from 'lucide-react';

export const CATEGORY_ITEMS = [
  { name: 'Afeta Clientes', icon: AlertTriangle, key: 'a', shortcut: 'Ctrl+A' },
  { name: 'BA Reverso', icon: RotateCcw, key: 'b', shortcut: 'Ctrl+B' },
  { name: 'BGP', icon: Network, key: 'g', shortcut: 'Ctrl+G' },
  { name: 'CX_COR_FIXA_N2', icon: Headphones, key: 'k', shortcut: 'Ctrl+K' },
  { name: 'CX_COR_MOVEL_N2', icon: Smartphone, key: 'm', shortcut: 'Ctrl+M' },
  { name: 'Em Monitoramento', icon: Activity, key: 'e', shortcut: 'Ctrl+E' },
  { name: 'Escalonamento', icon: TrendingUp, key: 'l', shortcut: 'Ctrl+L' },
  { name: 'IP', icon: Server, key: 'i', shortcut: 'Ctrl+I' },
  { name: 'ISUP', icon: Radio, key: 'u', shortcut: 'Ctrl+U' },
  { name: 'Observações', icon: Clipboard, key: 'o', shortcut: 'Ctrl+O' },
  { name: 'OD', icon: FileText, key: 'd', shortcut: 'Ctrl+D' },
  { name: 'OG', icon: Database, key: 'h', shortcut: 'Ctrl+H' },
  { name: 'Pendência IP', icon: Clock, key: 'p', shortcut: 'Ctrl+P' },
  { name: 'Pendencia TX', icon: Hourglass, key: 'y', shortcut: 'Ctrl+Y' },
  { name: 'RDM', icon: Tag, key: 'r', shortcut: 'Ctrl+R' },
  { name: 'SIP', icon: Phone, key: 's', shortcut: 'Ctrl+S' },
  { name: 'TX', icon: Signal, key: 't', shortcut: 'Ctrl+T' }
];

export default function CategoryMenu({ onSelectCategory }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

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
            width: '260px',
            maxHeight: '420px',
            overflowY: 'auto',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            padding: '6px'
          }}
        >
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

          {CATEGORY_ITEMS.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.name}
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
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
