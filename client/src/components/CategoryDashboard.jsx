import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutGrid, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Tag, 
  Layers, 
  ListFilter,
  Sparkles
} from 'lucide-react';
import { getStoredCategories, getCategoryIconComponent } from '../utils/categoryStore';

export default function CategoryDashboard({
  text = '',
  onNavigateToCategory,
  onInsertCategory,
  currentDate = new Date(),
  customCategories
}) {
  const [filterMode, setFilterMode] = useState('active'); // 'active' | 'all'
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('openjournal_dash_collapsed') === 'true';
  });
  const [navState, setNavState] = useState({ categoryName: null, occurrenceIndex: 0 });

  const categories = customCategories || getStoredCategories();

  // Map category items by lowercase name for fast icon & info lookup
  const categoryMapByName = useMemo(() => {
    const map = new Map();
    categories.forEach(item => {
      map.set(item.name.toLowerCase(), {
        ...item,
        icon: getCategoryIconComponent(item.iconName)
      });
    });
    return map;
  }, [categories]);

  // Parse categories from currentText in document order with occurrence counts
  const extractedCategories = useMemo(() => {
    if (!text) return [];

    const regex = /(?:^|\n)\s*={2,3}\s*([^=]+?)\s*={2,3}/g;
    const categoryMap = new Map();
    let match;

    while ((match = regex.exec(text)) !== null) {
      const rawName = match[1].trim();
      if (!rawName) continue;

      if (categoryMap.has(rawName)) {
        const item = categoryMap.get(rawName);
        item.count += 1;
      } else {
        categoryMap.set(rawName, { name: rawName, count: 1 });
      }
    }

    return Array.from(categoryMap.values());
  }, [text]);

  // Total metrics
  const totalOccurrences = useMemo(() => {
    return extractedCategories.reduce((acc, cat) => acc + cat.count, 0);
  }, [extractedCategories]);

  // Combine extracted categories with defined list depending on filterMode
  const dashboardCards = useMemo(() => {
    const extractedMap = new Map();
    extractedCategories.forEach(item => {
      extractedMap.set(item.name.toLowerCase(), item);
    });

    if (filterMode === 'active') {
      return extractedCategories.map(item => {
        const matched = categoryMapByName.get(item.name.toLowerCase());
        return {
          name: item.name,
          count: item.count,
          icon: matched ? matched.icon : Tag,
          shortcut: matched ? matched.shortcut : null,
          isPredefined: !!matched
        };
      });
    }

    // Filter mode = 'all'
    const combined = [];
    // 1. Add all configured items (with count from text or 0)
    categories.forEach(item => {
      const found = extractedMap.get(item.name.toLowerCase());
      combined.push({
        name: item.name,
        count: found ? found.count : 0,
        icon: getCategoryIconComponent(item.iconName),
        shortcut: item.shortcut,
        isPredefined: true
      });
    });

    // 2. Add custom categories found in text that are not in configured list
    extractedCategories.forEach(item => {
      if (!categoryMapByName.has(item.name.toLowerCase())) {
        combined.push({
          name: item.name,
          count: item.count,
          icon: Tag,
          shortcut: null,
          isPredefined: false
        });
      }
    });

    return combined;
  }, [extractedCategories, filterMode, categories, categoryMapByName]);

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('openjournal_dash_collapsed', String(next));
      return next;
    });
  };

  const handleCardClick = (categoryName, count) => {
    if (count > 0) {
      let nextIndex = 0;
      if (navState.categoryName === categoryName) {
        nextIndex = (navState.occurrenceIndex + 1) % count;
      }
      setNavState({ categoryName, occurrenceIndex: nextIndex });

      if (onNavigateToCategory) {
        onNavigateToCategory(categoryName, nextIndex);
      }
    } else {
      if (onInsertCategory) {
        onInsertCategory(categoryName);
      }
    }
  };

  const formattedDate = currentDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  // Top quick suggestions for empty state (Principais categorias com maior frequência)
  const topCategoryNames = useMemo(() => [
    'OD',
    'RDM',
    'BGP',
    'SIP',
    'CX_COR_FIXA_N2',
    'CX_COR_MOVEL_N2',
    'Pendencia TX',
    'Pendência IP'
  ], []);

  const quickSuggestions = useMemo(() => {
    return topCategoryNames.map(name => {
      const found = categoryMapByName.get(name.toLowerCase());
      return {
        name,
        icon: found ? found.icon : Tag
      };
    });
  }, [topCategoryNames, categoryMapByName]);

  return (
    <div className={`category-dashboard-wrapper ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Header Bar */}
      <div className="dash-header">
        <div className="dash-header-left">
          <div className="dash-title-badge">
            <LayoutGrid size={15} color="var(--accent-primary)" />
            <span className="dash-title">Painel de Categorias</span>
          </div>

          <span className="dash-date-indicator">
            Passagem de {formattedDate}
          </span>

          <div className="dash-stats">
            <span className="dash-stat-pill active-pill" title="Categorias distintas nesta passagem">
              {extractedCategories.length} {extractedCategories.length === 1 ? 'categoria' : 'categorias'}
            </span>
            <span className="dash-stat-pill count-pill" title="Total de ocorrências">
              {totalOccurrences} {totalOccurrences === 1 ? 'ocorrência' : 'ocorrências'}
            </span>
          </div>
        </div>

        <div className="dash-header-right">
          {/* Filter Mode Toggle */}
          {!isCollapsed && (
            <div className="dash-filter-toggle">
              <button
                type="button"
                className={`dash-filter-btn ${filterMode === 'active' ? 'active' : ''}`}
                onClick={() => setFilterMode('active')}
                title="Exibir apenas categorias informadas no editor"
              >
                <ListFilter size={13} />
                <span>Ativas ({extractedCategories.length})</span>
              </button>

              <button
                type="button"
                className={`dash-filter-btn ${filterMode === 'all' ? 'active' : ''}`}
                onClick={() => setFilterMode('all')}
                title="Exibir todas as categorias disponíveis"
              >
                <Layers size={13} />
                <span>Todas ({categories.length})</span>
              </button>
            </div>
          )}

          {/* Collapse / Expand Toggle */}
          <button
            type="button"
            className="dash-collapse-btn"
            onClick={toggleCollapse}
            title={isCollapsed ? "Expandir Painel de Categorias" : "Recolher Painel de Categorias"}
          >
            {isCollapsed ? (
              <>
                <span>Ver Cards</span>
                <ChevronDown size={15} />
              </>
            ) : (
              <>
                <span>Recolher</span>
                <ChevronUp size={15} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Collapsed Bar Quick View */}
      {isCollapsed && (
        <div className="dash-collapsed-view">
          {extractedCategories.length > 0 ? (
            <div className="dash-collapsed-chips">
              {extractedCategories.map(({ name, count }) => {
                const isNavActive = navState.categoryName === name;
                return (
                  <button
                    key={name}
                    type="button"
                    className={`dash-collapsed-chip ${isNavActive ? 'nav-active' : ''}`}
                    onClick={() => handleCardClick(name, count)}
                    title={`Navegar para ${name} (${count}x)`}
                  >
                    <span>{name}</span>
                    <span className="dash-chip-badge">{count}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <span className="dash-collapsed-empty">
              Nenhuma categoria informada na passagem de hoje. Clique em "Ver Cards" ou insira uma categoria.
            </span>
          )}
        </div>
      )}

      {/* Full Cards Body */}
      {!isCollapsed && (
        <div className="dash-body">
          {dashboardCards.length > 0 ? (
            <div className="dash-cards-grid">
              {dashboardCards.map(card => {
                const IconComponent = card.icon;
                const isNavActive = navState.categoryName === card.name && card.count > 0;
                const hasCount = card.count > 0;

                return (
                  <div
                    key={card.name}
                    className={`category-card ${hasCount ? 'has-count' : 'empty-count'} ${isNavActive ? 'selected-nav' : ''}`}
                    onClick={() => handleCardClick(card.name, card.count)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCardClick(card.name, card.count);
                      }
                    }}
                    title={
                      hasCount
                        ? `Clique para navegar para ${card.name} (Ocorrência ${isNavActive ? (navState.occurrenceIndex % card.count) + 1 : 1}/${card.count})`
                        : `Clique para inserir a categoria ${card.name} no editor`
                    }
                  >
                    <div className="card-top">
                      <div className="card-icon-wrapper">
                        <IconComponent size={16} className="card-icon" />
                      </div>

                      {hasCount ? (
                        <span className="card-count-badge">
                          {card.count}
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="card-add-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onInsertCategory(card.name);
                          }}
                          title={`Inserir ${card.name}`}
                        >
                          <Plus size={13} />
                        </button>
                      )}
                    </div>

                    <div className="card-middle">
                      <span className="card-title">{card.name}</span>
                    </div>

                    <div className="card-footer">
                      {hasCount ? (
                        <span className="card-action-hint">
                          {isNavActive ? (
                            `Ocorrência ${(navState.occurrenceIndex % card.count) + 1} de ${card.count}`
                          ) : (
                            card.count === 1 ? '1 ocorrência (Ir)' : `${card.count} ocorrências`
                          )}
                        </span>
                      ) : (
                        <span className="card-action-add">
                          + Adicionar
                        </span>
                      )}

                      {card.shortcut && (
                        <span className="card-shortcut-key">{card.shortcut}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State Banner */
            <div className="dash-empty-banner">
              <div className="dash-empty-left">
                <Sparkles size={20} color="var(--accent-primary)" />
                <div>
                  <h4 className="dash-empty-title">Nenhuma categoria informada nesta passagem</h4>
                  <p className="dash-empty-sub">
                    Selecione uma categoria abaixo para inseri-la instantaneamente no editor da passagem de hoje:
                  </p>
                </div>
              </div>

              <div className="dash-quick-chips">
                {quickSuggestions.map(item => {
                  const IconComp = item.icon;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      className="dash-quick-chip"
                      onClick={() => onInsertCategory(item.name)}
                    >
                      <IconComp size={14} color="var(--accent-primary)" />
                      <span>+ {item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
