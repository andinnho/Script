import React, { useState, useRef, useMemo } from 'react';
import { 
  BookOpen, 
  Sun, 
  Moon, 
  Search, 
  Cloud, 
  HardDrive, 
  Star, 
  Tag,
  Settings,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  Download,
  Upload,
  ListOrdered,
  Folder,
  RefreshCw
} from 'lucide-react';
import CalendarView from './CalendarView';
import RedNotebookSearch from './RedNotebookSearch';
import FolderPickerModal from './FolderPickerModal';
import { API_BASE } from '../utils/apiConfig';

export default function Sidebar({
  theme,
  toggleTheme,
  currentDate,
  onSelectDate,
  monthData,
  tags,
  activeTag,
  onSelectTag,
  favorites,
  onToggleFavorite,
  searchQuery,
  onSearchQueryChange,
  onRefreshData,
  searchInputRef,
  currentText = '',
  onNavigateToCategory,
  onOpenUpdateModal
}) {
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const [navState, setNavState] = useState({ categoryName: '', occurrenceIndex: 0 });

  // Extract H2 categories from currentText in document order with occurrence counts
  const noteCategories = useMemo(() => {
    if (!currentText) return [];

    const regex = /(?:^|\n)\s*={2,3}\s*([^=]+?)\s*={2,3}/g;
    const categoryMap = new Map();
    let match;

    while ((match = regex.exec(currentText)) !== null) {
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
  }, [currentText]);

  const handleCategoryClick = (categoryName) => {
    let nextIndex = 0;
    if (navState.categoryName === categoryName) {
      nextIndex = navState.occurrenceIndex + 1;
    }
    setNavState({ categoryName, occurrenceIndex: nextIndex });

    if (onNavigateToCategory) {
      onNavigateToCategory(categoryName, nextIndex);
    }
  };

  // OneDrive & Storage State
  const [oneDriveInfo, setOneDriveInfo] = useState(null);
  const [checkingOneDrive, setCheckingOneDrive] = useState(false);
  const [storageConfig, setStorageConfig] = useState(null);
  const [customPathInput, setCustomPathInput] = useState('');
  const [copyExistingHistory, setCopyExistingHistory] = useState(true);
  const [savingStorage, setSavingStorage] = useState(false);
  const [storageFeedback, setStorageFeedback] = useState(null);
  const [isFolderPickerOpen, setIsFolderPickerOpen] = useState(false);

  // Backup State
  const [backupStatus, setBackupStatus] = useState(null);
  const [restoring, setRestoring] = useState(false);

  const settingsSectionRef = useRef(null);

  const fetchStorageConfig = () => {
    fetch(`${API_BASE}/api/storage/config`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStorageConfig(data);
          setCustomPathInput(data.activeDataDir || '');
        }
      })
      .catch(err => console.error('Erro ao carregar diretórios:', err));
  };

  const handleSaveStorageDirectory = async (targetDir) => {
    const dirToSave = targetDir || customPathInput;
    if (!dirToSave) {
      setStorageFeedback({ type: 'error', message: 'Selecione ou digite um caminho válido.' });
      return;
    }

    setSavingStorage(true);
    setStorageFeedback(null);

    try {
      const res = await fetch(`${API_BASE}/api/storage/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataDir: dirToSave,
          copyExisting: copyExistingHistory
        })
      });
      const data = await res.json();
      if (data.success) {
        setStorageFeedback({
          type: 'success',
          message: `Pasta ativada com sucesso! ${data.copiedCount ? `(${data.copiedCount} arquivos copiados)` : ''}`
        });
        fetchStorageConfig();
        if (onRefreshData) onRefreshData();
      } else {
        setStorageFeedback({ type: 'error', message: data.error || 'Erro ao alterar pasta.' });
      }
    } catch (err) {
      setStorageFeedback({ type: 'error', message: 'Falha na comunicação com o servidor.' });
    } finally {
      setSavingStorage(false);
    }
  };

  const checkOneDriveStatus = () => {
    setCheckingOneDrive(true);
    fetch(`${API_BASE}/api/onedrive`)
      .then(res => res.json())
      .then(data => setOneDriveInfo(data))
      .catch(err => console.error('Erro OneDrive:', err))
      .finally(() => setCheckingOneDrive(false));
  };

  const handleDownloadBackup = () => {
    window.location.href = `${API_BASE}/api/backup`;
  };

  const handleRestoreBackup = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setRestoring(true);
    setBackupStatus(null);
    const formData = new FormData();
    formData.append('backupZip', file);

    try {
      const res = await fetch(`${API_BASE}/api/restore`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setBackupStatus({ type: 'success', message: 'Backup restaurado com sucesso! Atualizando notas...' });
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setBackupStatus({ type: 'error', message: 'Erro ao restaurar backup: ' + (data.error || 'Falha') });
      }
    } catch (err) {
      setBackupStatus({ type: 'error', message: 'Erro de conexão: ' + err.message });
    } finally {
      setRestoring(false);
    }
  };

  const toggleSettingsAccordion = () => {
    setIsSettingsExpanded(prev => {
      const next = !prev;
      if (next) {
        fetchStorageConfig();
        if (!oneDriveInfo) {
          checkOneDriveStatus();
        }
      }
      if (next && settingsSectionRef.current) {
        setTimeout(() => {
          settingsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      }
      return next;
    });
  };

  return (
    <aside className="sidebar">
      {/* Top Header */}
      <div className="sidebar-header">
        <div className="logo-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img 
            src="/logo-script.png" 
            alt="Script Logo" 
            style={{ 
              height: '32px', 
              width: 'auto', 
              maxHeight: '32px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))'
            }} 
          />
        </div>

        <div className="sidebar-actions">
          <button 
            className="icon-btn" 
            onClick={toggleTheme} 
            title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <button 
            className={`icon-btn ${isSettingsExpanded ? 'active' : ''}`}
            onClick={toggleSettingsAccordion} 
            title="Configurações"
          >
            <Settings size={18} />
          </button>

          <button 
            className="icon-btn highlight-search-btn" 
            onClick={() => {
              if (searchInputRef?.current) {
                searchInputRef.current.focus();
                searchInputRef.current.select();
              }
            }} 
            title="Focar Pesquisa (Ctrl+F)"
          >
            <Search size={18} />
          </button>
        </div>
      </div>

      {/* Main Scrollable Area */}
      <div className="sidebar-content">
        {/* Interactive Calendar Card */}
        <CalendarView 
          currentDate={currentDate} 
          onSelectDate={onSelectDate}
          monthData={monthData}
        />

        {/* RedNotebook Search Component (Embedded search & replace & results table) */}
        <RedNotebookSearch
          currentDate={currentDate}
          onSelectDate={onSelectDate}
          searchQuery={searchQuery}
          onSearchQueryChange={onSearchQueryChange}
          onRefreshData={onRefreshData}
          inputRef={searchInputRef}
        />

        {/* Favorites Section */}
        {favorites && favorites.length > 0 && (
          <div className="sidebar-section">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <Star size={14} color="#f59e0b" fill="#f59e0b" />
              <span>Favoritos</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {favorites.map((favDate) => (
                <div 
                  key={favDate}
                  onClick={() => onSelectDate(new Date(favDate + 'T00:00:00'))}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-input)',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between'
                  }}
                >
                  <span>{favDate}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(favDate); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categorias da Anotação (Índice da Anotação Selecionada) */}
        {(!searchQuery || !searchQuery.trim()) && (
          <div className="sidebar-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ListOrdered size={14} color="var(--accent-primary)" />
                <span>Categorias da Anotação</span>
              </div>
            </div>

            <div className="tag-cloud">
              {noteCategories && noteCategories.length > 0 ? (
                noteCategories.map(({ name, count }) => {
                  const isActive = navState.categoryName === name;
                  return (
                    <button
                      key={name}
                      className={`tag-cloud-item ${isActive ? 'active' : ''}`}
                      onClick={() => handleCategoryClick(name)}
                      title={`Navegar para ${name} (${count} ocorrência${count > 1 ? 's' : ''})`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: isActive ? 700 : 500
                      }}
                    >
                      <span>{name}</span>
                      {count > 1 && (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          backgroundColor: isActive ? 'var(--accent-primary)' : 'var(--bg-card)',
                          color: isActive ? '#ffffff' : 'var(--text-muted)',
                          padding: '1px 5px',
                          borderRadius: '10px',
                          border: '1px solid var(--border-color)'
                        }}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Nenhuma categoria nesta anotação
                </span>
              )}
            </div>
          </div>
        )}

        {/* Settings Accordion Section (Menu Sanfona) */}
        <div className="sidebar-section" ref={settingsSectionRef}>
          <div 
            className="accordion-header"
            onClick={toggleSettingsAccordion}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              userSelect: 'none',
              padding: '6px 0'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Settings size={14} />
              <span>Configurações</span>
            </div>
            <ChevronDown 
              size={14} 
              style={{ 
                transform: isSettingsExpanded ? 'rotate(180deg)' : 'rotate(0deg)', 
                transition: 'transform 0.2s ease' 
              }} 
            />
          </div>

          {isSettingsExpanded && (
            <div className="accordion-content" style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Item 1: Local do Histórico (OneDrive / C: / Personalizado) */}
              <div style={{
                padding: '12px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--accent-primary)' }}>
                    <Cloud size={14} />
                    <span>Local de Salvamento (OneDrive / C:)</span>
                  </div>
                  {oneDriveInfo?.isAvailable && (
                    <span style={{ fontSize: '10px', color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                      OneDrive Ativo
                    </span>
                  )}
                </div>

                {/* Pasta Ativa Atual */}
                {storageConfig && (
                  <div style={{
                    padding: '8px 10px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    borderLeft: '3px solid #10b981'
                  }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                      Pasta Ativa Atual:
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', wordBreak: 'break-all', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {storageConfig.activeDataDir}
                    </span>
                  </div>
                )}

                {/* Botão de Navegação Visual e Campo Personalizado */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <button
                    type="button"
                    className="tool-btn"
                    onClick={() => setIsFolderPickerOpen(true)}
                    style={{
                      justifyContent: 'center',
                      fontSize: '11px',
                      padding: '8px 12px',
                      border: '1px solid var(--accent-primary)',
                      backgroundColor: 'rgba(56, 189, 248, 0.1)',
                      color: 'var(--accent-primary)',
                      fontWeight: 600,
                      gap: '6px'
                    }}
                  >
                    <Folder size={14} />
                    <span>📁 Navegar e Escolher Pasta no PC...</span>
                  </button>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      value={customPathInput}
                      onChange={(e) => setCustomPathInput(e.target.value)}
                      placeholder="Ex: C:\MeusDiarios"
                      style={{
                        flex: 1,
                        fontSize: '11px',
                        padding: '6px 8px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-mono)'
                      }}
                    />
                    <button
                      type="button"
                      className="tool-btn"
                      onClick={() => handleSaveStorageDirectory(customPathInput)}
                      disabled={savingStorage}
                      style={{
                        backgroundColor: 'var(--accent-primary)',
                        color: '#fff',
                        padding: '6px 10px',
                        fontSize: '11px',
                        fontWeight: 600
                      }}
                    >
                      {savingStorage ? 'Salvando...' : 'Aplicar'}
                    </button>
                  </div>
                </div>

                {/* Checkbox de Cópia */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={copyExistingHistory}
                    onChange={(e) => setCopyExistingHistory(e.target.checked)}
                  />
                  <span>Copiar histórico atual para o novo local</span>
                </label>

                {/* Feedback */}
                {storageFeedback && (
                  <div style={{
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: storageFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: storageFeedback.type === 'success' ? '#10b981' : '#ef4444'
                  }}>
                    {storageFeedback.type === 'success' ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                    <span>{storageFeedback.message}</span>
                  </div>
                )}
              </div>

              {/* Item 2: Backup & Restauração */}
              <div style={{
                padding: '12px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--accent-primary)' }}>
                  <HardDrive size={14} />
                  <span>Backup & Restauração</span>
                </div>

                {backupStatus && (
                  <div style={{
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    backgroundColor: backupStatus.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: backupStatus.type === 'success' ? '#10b981' : '#ef4444'
                  }}>
                    {backupStatus.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                    <span>{backupStatus.message}</span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <button className="tool-btn" onClick={handleDownloadBackup} style={{ border: '1px solid var(--border-color)', justifyContent: 'center', fontSize: '11px' }}>
                    <Download size={13} />
                    <span>Download Backup (ZIP)</span>
                  </button>

                  <label className="tool-btn" style={{ border: '1px solid var(--border-color)', justifyContent: 'center', fontSize: '11px', cursor: 'pointer' }}>
                    <Upload size={13} />
                    <span>{restoring ? 'Restaurando...' : 'Restaurar de ZIP'}</span>
                    <input type="file" accept=".zip" onChange={handleRestoreBackup} style={{ display: 'none' }} disabled={restoring} />
                  </label>
                </div>
              </div>

              {/* Item 3: Atualizações do Sistema */}
              <div style={{
                padding: '12px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--accent-primary)' }}>
                  <RefreshCw size={14} />
                  <span>Ajuda & Atualizações</span>
                </div>

                <button 
                  className="tool-btn" 
                  onClick={onOpenUpdateModal} 
                  style={{ border: '1px solid var(--border-color)', justifyContent: 'center', fontSize: '11px' }}
                >
                  <RefreshCw size={13} />
                  <span>Verificar Atualizações</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Folder Picker Modal */}
      <FolderPickerModal
        isOpen={isFolderPickerOpen}
        onClose={() => setIsFolderPickerOpen(false)}
        initialDir={storageConfig?.activeDataDir}
        onSelectFolder={(pickedFolder) => {
          setCustomPathInput(pickedFolder);
          handleSaveStorageDirectory(pickedFolder);
        }}
      />
    </aside>
  );
}
