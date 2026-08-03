import React, { useState, useEffect } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import { API_BASE } from '../utils/apiConfig';

export default function RedNotebookSearch({
  currentDate,
  onSelectDate,
  searchQuery,
  onSearchQueryChange,
  onRefreshData,
  inputRef
}) {
  const [replaceQuery, setReplaceQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Current selected date string YYYY-MM-DD
  const currentDateStr = currentDate ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}` : '';

  useEffect(() => {
    if (!searchQuery || !searchQuery.trim()) {
      setResults([]);
      return;
    }
    performSearch(searchQuery);
  }, [searchQuery]);

  const performSearch = async (queryToSearch) => {
    if (!queryToSearch || !queryToSearch.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(queryToSearch)}`);
      const data = await res.json();
      if (data.success) {
        setResults(data.results || []);
      }
    } catch (err) {
      console.error('Erro na pesquisa:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReplace = async () => {
    if (!searchQuery || !searchQuery.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/replace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldQuery: searchQuery,
          newText: replaceQuery
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg(`${data.totalReplacements} ocorrência(s) substituída(s) em ${data.modifiedDaysCount} dia(s)`);
        setTimeout(() => setStatusMsg(''), 4000);
        if (onRefreshData) onRefreshData();
        performSearch(replaceQuery || searchQuery);
      } else {
        setStatusMsg('Erro ao substituir: ' + (data.error || 'Falha'));
      }
    } catch (err) {
      setStatusMsg('Erro de conexão ao substituir');
    }
  };

  const highlightSnippet = (snippet, query) => {
    if (!snippet || !query) return snippet;
    const cleanQ = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${cleanQ})`, 'gi');
    const parts = snippet.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="search-highlight-inline">{part}</mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="rednotebook-search-box">
      {/* Search Input Box */}
      <div className="rn-input-group">
        <Search size={15} color="var(--text-muted)" style={{ marginLeft: '8px', flexShrink: 0 }} />
        <input
          ref={inputRef}
          type="text"
          className="rn-search-input"
          placeholder="Buscar no diário..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            className="rn-icon-btn"
            onClick={() => onSearchQueryChange('')}
            title="Limpar busca"
          >
            <X size={14} />
          </button>
        )}
        <button
          type="button"
          className={`rn-icon-btn ${showReplace ? 'active' : ''}`}
          onClick={() => setShowReplace(!showReplace)}
          title="Alternar campo Substituir (Replace)"
        >
          <ChevronDown size={14} style={{ transform: showReplace ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
      </div>

      {/* Replace Box (Shows when Replace toggle is ON or search query is present) */}
      {(showReplace || (searchQuery && searchQuery.trim().length > 0)) && (
        <div className="rn-replace-group">
          <input
            type="text"
            className="rn-search-input"
            placeholder="Replace"
            value={replaceQuery}
            onChange={(e) => setReplaceQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleReplace();
            }}
          />
          <button
            type="button"
            className="rn-replace-btn"
            onClick={handleReplace}
            title="Substituir todas as ocorrências"
          >
            Substituir
          </button>
        </div>
      )}

      {statusMsg && (
        <div className="rn-status-msg">{statusMsg}</div>
      )}

      {/* Results Table (RedNotebook style Date | Text headers) */}
      {searchQuery && searchQuery.trim().length > 0 && (
        <div className="rn-results-table">
          <div className="rn-table-header">
            <div className="rn-col-date">Date</div>
            <div className="rn-col-text">Text</div>
          </div>
          <div className="rn-table-body">
            {loading ? (
              <div className="rn-table-empty">Buscando...</div>
            ) : results.length > 0 ? (
              results.map((item) => {
                const isSelected = currentDateStr === item.date;
                return (
                  <div
                    key={item.date}
                    className={`rn-table-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      if (document.activeElement && typeof document.activeElement.blur === 'function') {
                        document.activeElement.blur();
                      }
                      onSelectDate(new Date(item.date + 'T00:00:00'), searchQuery);
                    }}
                  >
                    <div className="rn-col-date">{item.date}</div>
                    <div className="rn-col-text" title={item.snippet}>
                      {highlightSnippet(item.snippet, searchQuery)}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rn-table-empty">Nenhum resultado encontrado.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
