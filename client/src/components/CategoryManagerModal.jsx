import React, { useState, useMemo } from 'react';
import { 
  X, 
  Plus, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  Check, 
  AlertCircle, 
  Search, 
  Settings,
  ChevronLeft
} from 'lucide-react';
import { 
  ICON_MAP, 
  getCategoryIconComponent, 
  getStoredCategories, 
  saveStoredCategories, 
  resetStoredCategoriesToDefault 
} from '../utils/categoryStore';

// Atalhos nativos essenciais do sistema/navegador que não podem ser sobrescritos
const RESERVED_KEYS = ['c', 'v', 'z', 'f', 's', 'x', 'a', 'p', 'r', 't', 'w', 'q', 'n'];

const AVAILABLE_KEYS = [
  'Nenhum',
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
  'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'
];

export default function CategoryManagerModal({
  isOpen,
  onClose,
  onCategoriesUpdated
}) {
  const [categories, setCategories] = useState(getStoredCategories);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'form'
  const [editingCategory, setEditingCategory] = useState(null); // null when creating

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    iconName: 'Tag',
    key: 'Nenhum',
    format: '=== [NOME] ==='
  });

  const [formError, setFormError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  if (!isOpen) return null;

  const handleOpenForm = (categoryToEdit = null) => {
    setFormError('');
    if (categoryToEdit) {
      setEditingCategory(categoryToEdit);
      setFormData({
        name: categoryToEdit.name,
        iconName: categoryToEdit.iconName || 'Tag',
        key: categoryToEdit.key || 'Nenhum',
        format: categoryToEdit.format || '=== [NOME] ==='
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        iconName: 'Tag',
        key: 'Nenhum',
        format: '=== [NOME] ==='
      });
    }
    setViewMode('form');
  };

  const handleSaveForm = (e) => {
    e.preventDefault();
    setFormError('');

    const cleanName = formData.name.trim();
    if (!cleanName) {
      setFormError('Informe um nome válido para a categoria.');
      return;
    }

    // Check duplicate name
    const duplicateName = categories.find(
      c => c.name.toLowerCase() === cleanName.toLowerCase() && c.id !== (editingCategory?.id)
    );

    if (duplicateName) {
      setFormError(`Já existe uma categoria cadastrada com o nome "${cleanName}".`);
      return;
    }

    // Check duplicate key/shortcut if assigned
    if (formData.key && formData.key !== 'Nenhum') {
      const selectedKey = formData.key.toLowerCase();

      // Check duplicate shortcut
      const duplicateKey = categories.find(
        c => c.key?.toLowerCase() === selectedKey && c.id !== (editingCategory?.id)
      );

      if (duplicateKey) {
        setFormError(`O atalho Ctrl+${selectedKey.toUpperCase()} já está atribuído à categoria "${duplicateKey.name}".`);
        return;
      }
    }

    let updatedList;
    if (editingCategory) {
      // Edit existing
      updatedList = categories.map(c => {
        if (c.id === editingCategory.id) {
          return {
            ...c,
            name: cleanName,
            iconName: formData.iconName,
            key: formData.key === 'Nenhum' ? '' : formData.key.toLowerCase(),
            shortcut: formData.key === 'Nenhum' ? '' : `Ctrl+${formData.key.toUpperCase()}`,
            format: formData.format
          };
        }
        return c;
      });
    } else {
      // Add new
      const newCat = {
        id: `cat-custom-${Date.now()}`,
        name: cleanName,
        iconName: formData.iconName,
        key: formData.key === 'Nenhum' ? '' : formData.key.toLowerCase(),
        shortcut: formData.key === 'Nenhum' ? '' : `Ctrl+${formData.key.toUpperCase()}`,
        format: formData.format,
        isDefault: false
      };
      updatedList = [...categories, newCat];
    }

    setCategories(updatedList);
    saveStoredCategories(updatedList);
    if (onCategoriesUpdated) onCategoriesUpdated(updatedList);

    setViewMode('list');
  };

  const handleDeleteCategory = (id) => {
    const updatedList = categories.filter(c => c.id !== id);
    setCategories(updatedList);
    saveStoredCategories(updatedList);
    if (onCategoriesUpdated) onCategoriesUpdated(updatedList);
    setConfirmDeleteId(null);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Tem certeza que deseja restaurar as categorias padrão do sistema? Suas personalizações serão sobrescritas.')) {
      const defaultList = resetStoredCategoriesToDefault();
      setCategories(defaultList);
      if (onCategoriesUpdated) onCategoriesUpdated(defaultList);
    }
  };

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card category-manager-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {viewMode === 'form' && (
              <button 
                type="button" 
                className="icon-btn" 
                onClick={() => setViewMode('list')}
                title="Voltar para a Lista"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <Settings size={18} color="var(--accent-primary)" />
            <span className="modal-title">
              {viewMode === 'list' 
                ? 'Gerenciar Categorias' 
                : (editingCategory ? `Editar: ${editingCategory.name}` : 'Nova Categoria')}
            </span>
          </div>

          <button type="button" className="icon-btn" onClick={onClose} title="Fechar (Esc)">
            <X size={18} />
          </button>
        </div>

        {/* View Mode 1: List View */}
        {viewMode === 'list' && (
          <div className="manager-list-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Top Toolbar: Search + Add Button */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div className="rn-input-group" style={{ flex: 1 }}>
                <Search size={14} color="var(--text-muted)" style={{ marginLeft: '8px' }} />
                <input
                  type="text"
                  className="rn-search-input"
                  placeholder="Pesquisar categoria..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="tool-btn"
                onClick={() => handleOpenForm(null)}
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '12px',
                  padding: '6px 12px',
                  whiteSpace: 'nowrap'
                }}
              >
                <Plus size={14} />
                <span>Nova Categoria</span>
              </button>
            </div>

            {/* List Body */}
            <div className="manager-items-list" style={{ maxHeight: '340px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {filteredCategories.length > 0 ? (
                filteredCategories.map((cat) => {
                  const IconComp = getCategoryIconComponent(cat.iconName);
                  const isDeleting = confirmDeleteId === cat.id;

                  return (
                    <div 
                      key={cat.id}
                      className="manager-item-row"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-input)',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--bg-card)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--accent-primary)',
                          border: '1px solid var(--border-color)'
                        }}>
                          <IconComp size={15} />
                        </div>

                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {cat.name}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {cat.shortcut ? (
                          <span className="category-shortcut-badge" style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '10px',
                            fontWeight: 700,
                            color: 'var(--text-secondary)',
                            backgroundColor: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            padding: '2px 6px',
                            borderRadius: '4px'
                          }}>
                            {cat.shortcut}
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Sem atalho
                          </span>
                        )}

                        {isDeleting ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button
                              type="button"
                              className="tool-btn"
                              onClick={() => handleDeleteCategory(cat.id)}
                              style={{ backgroundColor: '#ef4444', color: '#fff', fontSize: '10px', padding: '2px 6px' }}
                              title="Confirmar Exclusão"
                            >
                              Excluir
                            </button>
                            <button
                              type="button"
                              className="tool-btn"
                              onClick={() => setConfirmDeleteId(null)}
                              style={{ fontSize: '10px', padding: '2px 6px' }}
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={() => handleOpenForm(cat)}
                              title={`Editar ${cat.name}`}
                              style={{ width: '28px', height: '28px' }}
                            >
                              <Edit3 size={14} />
                            </button>

                            <button
                              type="button"
                              className="icon-btn"
                              onClick={() => setConfirmDeleteId(cat.id)}
                              title={`Excluir ${cat.name}`}
                              style={{ width: '28px', height: '28px', color: '#ef4444' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Nenhuma categoria encontrada.
                </div>
              )}
            </div>

            {/* Bottom Reset Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
              <button
                type="button"
                className="tool-btn"
                onClick={handleResetDefaults}
                style={{ fontSize: '11px', color: 'var(--text-muted)' }}
                title="Restaurar lista original de categorias do sistema"
              >
                <RotateCcw size={13} />
                <span>Restaurar Padrões</span>
              </button>

              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {categories.length} categorias cadastradas
              </span>
            </div>
          </div>
        )}

        {/* View Mode 2: Form View (Add/Edit) */}
        {viewMode === 'form' && (
          <form onSubmit={handleSaveForm} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {formError && (
              <div style={{
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <AlertCircle size={14} />
                <span>{formError}</span>
              </div>
            )}

            {/* Name Input */}
            <div className="settings-field">
              <label className="settings-label" htmlFor="cat-name-input">
                Nome da Categoria *
              </label>
              <input
                id="cat-name-input"
                type="text"
                className="settings-input"
                placeholder="Ex: Incidente Crítico / Backup"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Icon Picker */}
            <div className="settings-field">
              <label className="settings-label">
                Selecione um Ícone
              </label>
              <div 
                className="icon-picker-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(9, 1fr)',
                  gap: '6px',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  backgroundColor: 'var(--bg-input)',
                  padding: '8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)'
                }}
              >
                {Object.keys(ICON_MAP).map((iconKey) => {
                  const IconComp = ICON_MAP[iconKey];
                  const isSelected = formData.iconName === iconKey;
                  return (
                    <button
                      key={iconKey}
                      type="button"
                      onClick={() => setFormData({ ...formData, iconName: iconKey })}
                      style={{
                        aspectRatio: '1',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--bg-card)',
                        color: isSelected ? '#ffffff' : 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      title={iconKey}
                    >
                      <IconComp size={16} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Shortcut Selector */}
            <div className="settings-field">
              <label className="settings-label" htmlFor="cat-key-select">
                Atalho de Teclado (Ctrl + Tecla)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  id="cat-key-select"
                  className="settings-input"
                  style={{ flex: 1 }}
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                >
                  {AVAILABLE_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {k === 'Nenhum' ? 'Sem Atalho' : `Ctrl + ${k.toUpperCase()}`}
                    </option>
                  ))}
                </select>

                {formData.key && formData.key !== 'Nenhum' && (
                  <span className="category-shortcut-badge" style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--accent-primary)',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    whiteSpace: 'nowrap'
                  }}>
                    Ctrl+{formData.key.toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <button
                type="button"
                className="tool-btn"
                onClick={() => setViewMode('list')}
                style={{ padding: '8px 16px', border: '1px solid var(--border-color)' }}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="tool-btn"
                style={{
                  padding: '8px 20px',
                  backgroundColor: 'var(--accent-primary)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700
                }}
              >
                <Check size={14} />
                <span>Salvar Categoria</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
