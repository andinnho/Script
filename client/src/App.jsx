import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import CategoryMenu, { CATEGORY_ITEMS } from './components/CategoryMenu';
import { API_BASE } from './utils/apiConfig';
import { Star } from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState(localStorage.getItem('openjournal_theme') || 'dark');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('split'); // 'edit' | 'split' | 'preview'
  
  const [monthData, setMonthData] = useState({ days: {} });
  const [currentText, setCurrentText] = useState('');
  const [tags, setTags] = useState([]);
  const [activeTag, setActiveTag] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightQuery, setHighlightQuery] = useState('');
  const [favorites, setFavorites] = useState(JSON.parse(localStorage.getItem('openjournal_favorites') || '[]'));

  const saveTimeoutRef = useRef(null);
  const searchInputRef = useRef(null);
  const editorRef = useRef(null);

  const handleInsertCategory = (categoryName) => {
    if (editorRef.current) {
      editorRef.current.insertCategory(categoryName);
    }
  };

  // Global Keyboard Shortcuts (Ctrl+F for search, Ctrl+[letter] for Categories)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;

      const pressedKey = e.key.toLowerCase();

      // Ctrl + F for Search Focus
      if (pressedKey === 'f') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
        return;
      }

      // Check Category Shortcuts
      const matchedCategory = CATEGORY_ITEMS.find(item => item.key === pressedKey);
      if (matchedCategory) {
        e.preventDefault();
        handleInsertCategory(matchedCategory.name);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Theme Sync
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('openjournal_theme', theme);
  }, [theme]);

  // Load Month Data on Date Change
  useEffect(() => {
    fetchMonthData(currentDate.getFullYear(), currentDate.getMonth() + 1);
    fetchTags();
  }, [currentDate.getFullYear(), currentDate.getMonth()]);

  // Update current text when date or monthData changes
  useEffect(() => {
    const dayNum = currentDate.getDate();
    if (monthData.days && monthData.days[dayNum]) {
      setCurrentText(monthData.days[dayNum].text || '');
    } else {
      setCurrentText('');
    }
  }, [currentDate, monthData]);

  const fetchMonthData = async (year, month) => {
    try {
      const res = await fetch(`${API_BASE}/api/month/${year}/${month}`);
      const data = await res.json();
      if (data.success && data.data) {
        setMonthData(data.data);
      }
    } catch (err) {
      console.error('Erro ao carregar mês:', err);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/tags`);
      const data = await res.json();
      if (data.success) {
        setTags(data.tags);
      }
    } catch (err) {
      console.error('Erro ao carregar tags:', err);
    }
  };

  const handleSearchQueryChange = (q) => {
    setSearchQuery(q);
    setHighlightQuery(q);
  };

  // Select Date with optional Highlight Query
  const handleSelectDate = (date, queryToHighlight = '') => {
    setCurrentDate(date);
    if (queryToHighlight) {
      setSearchQuery(queryToHighlight);
      setHighlightQuery(queryToHighlight);
      if (viewMode === 'edit') {
        setViewMode('split');
      }
    }
  };

  // Auto-Save Strategy
  const handleTextChange = (newText) => {
    setCurrentText(newText);

    // Update local monthData memory state
    const dayNum = currentDate.getDate();
    const updatedDays = {
      ...monthData.days,
      [dayNum]: {
        ...(monthData.days[dayNum] || {}),
        day: dayNum,
        text: newText
      }
    };
    setMonthData({ ...monthData, days: updatedDays });

    // Debounce save request (1000ms)
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveMonthData(currentDate.getFullYear(), currentDate.getMonth() + 1, updatedDays);
    }, 1000);
  };

  const saveMonthData = async (year, month, days) => {
    try {
      await fetch(`${API_BASE}/api/month/${year}/${month}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days })
      });
      fetchTags();
    } catch (err) {
      console.error('Erro ao salvar:', err);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const formattedDateTitle = currentDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
  const isFavorite = favorites.includes(dateKey);

  const toggleFavorite = (targetDateKey = dateKey) => {
    let updated;
    if (favorites.includes(targetDateKey)) {
      updated = favorites.filter(d => d !== targetDateKey);
    } else {
      updated = [...favorites, targetDateKey];
    }
    setFavorites(updated);
    localStorage.setItem('openjournal_favorites', JSON.stringify(updated));
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <Sidebar
        theme={theme}
        toggleTheme={toggleTheme}
        currentDate={currentDate}
        onSelectDate={(d, q) => handleSelectDate(d, q)}
        monthData={monthData}
        tags={tags}
        activeTag={activeTag}
        onSelectTag={(t) => {
          setActiveTag(t);
          if (t) {
            handleSearchQueryChange(`#${t}`);
          } else {
            handleSearchQueryChange('');
          }
        }}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
        searchQuery={searchQuery}
        onSearchQueryChange={handleSearchQueryChange}
        onRefreshData={() => {
          fetchMonthData(currentDate.getFullYear(), currentDate.getMonth() + 1);
          fetchTags();
        }}
        searchInputRef={searchInputRef}
        currentText={currentText}
        onNavigateToCategory={(catName, occurrenceIndex) => {
          if (editorRef.current) {
            editorRef.current.navigateToCategory(catName, occurrenceIndex);
          }
        }}
      />

      {/* Main Content Workspace */}
      <div className="main-wrapper">
        {/* Top Navigation Bar */}
        <header className="top-navbar">
          <div className="navbar-left">
            <button 
              className="icon-btn" 
              onClick={() => toggleFavorite()}
              title={isFavorite ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
            >
              <Star 
                size={18} 
                color={isFavorite ? "#f59e0b" : "var(--text-muted)"} 
                fill={isFavorite ? "#f59e0b" : "none"} 
              />
            </button>
            <h1 className="current-date-title" style={{ textTransform: 'capitalize' }}>
              {formattedDateTitle}
            </h1>
          </div>

          <div className="navbar-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <CategoryMenu onSelectCategory={handleInsertCategory} />

            <div style={{ fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap', fontWeight: 500 }}>
              {(currentText || '').trim().split(/\s+/).filter(Boolean).length} palavras
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="content-body">
          <Editor
            ref={editorRef}
            text={currentText}
            onChangeText={handleTextChange}
            viewMode={viewMode}
            onChangeViewMode={setViewMode}
            highlightQuery={highlightQuery}
            onClearHighlight={() => {
              setHighlightQuery('');
              setSearchQuery('');
            }}
          />
        </div>
      </div>
    </div>
  );
}
