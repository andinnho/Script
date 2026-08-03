import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  FolderPlus, 
  ChevronRight, 
  ArrowUp, 
  Cloud, 
  HardDrive, 
  Home, 
  FileText, 
  Monitor, 
  X, 
  Check, 
  Loader2 
} from 'lucide-react';
import { API_BASE } from '../utils/apiConfig';

export default function FolderPickerModal({ isOpen, onClose, onSelectFolder, initialDir }) {
  const [currentDir, setCurrentDir] = useState('');
  const [browseData, setBrowseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDirectory(initialDir || '');
    }
  }, [isOpen, initialDir]);

  const loadDirectory = async (dirPath) => {
    setLoading(true);
    setError(null);
    setShowCreateFolder(false);
    setNewFolderName('');

    try {
      const url = dirPath ? `${API_BASE}/api/storage/browse?dir=${encodeURIComponent(dirPath)}` : `${API_BASE}/api/storage/browse`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setBrowseData(data);
        setCurrentDir(data.currentDir);
      } else {
        setError(data.error || 'Erro ao carregar diretório');
      }
    } catch (err) {
      setError('Falha de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !currentDir) return;
    setCreatingFolder(true);
    try {
      const res = await fetch(`${API_BASE}/api/storage/create-folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentDir: currentDir, folderName: newFolderName.trim() })
      });
      const data = await res.json();
      if (data.success && data.folderPath) {
        setShowCreateFolder(false);
        setNewFolderName('');
        loadDirectory(data.folderPath);
      } else {
        alert(data.error || 'Erro ao criar pasta');
      }
    } catch (err) {
      alert('Erro de conexão ao criar pasta');
    } finally {
      setCreatingFolder(false);
    }
  };

  if (!isOpen) return null;

  // Split currentDir for Breadcrumbs
  const dirParts = currentDir ? currentDir.split(/[/\\]/).filter(Boolean) : [];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-tertiary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>
            <Folder color="var(--accent-primary)" size={20} />
            <span>Selecionar Pasta de Histórico</span>
          </div>
          <button 
            onClick={onClose} 
            className="icon-btn" 
            style={{ padding: '4px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Access Bar */}
        {browseData?.quickPaths && (
          <div style={{
            padding: '10px 16px',
            backgroundColor: 'var(--bg-card)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto'
          }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Atalhos:</span>
            {browseData.quickPaths.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => loadDirectory(qp.path)}
                style={{
                  fontSize: '11px',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: currentDir === qp.path ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-tertiary)',
                  color: currentDir === qp.path ? 'var(--accent-primary)' : 'var(--text-primary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 500
                }}
              >
                {qp.type === 'onedrive' && <Cloud size={13} color="#38bdf8" />}
                {qp.type === 'docs' && <FileText size={13} color="#a855f7" />}
                {qp.type === 'desktop' && <Monitor size={13} color="#f59e0b" />}
                {qp.type === 'user' && <Home size={13} color="#10b981" />}
                {qp.type === 'cdrive' && <HardDrive size={13} color="#ec4899" />}
                <span>{qp.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Breadcrumb Path Bar */}
        <div style={{
          padding: '10px 16px',
          backgroundColor: 'var(--bg-tertiary)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {browseData?.parentDir && (
            <button
              onClick={() => loadDirectory(browseData.parentDir)}
              title="Subir um nível"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              <ArrowUp size={13} />
              <span>Subir</span>
            </button>
          )}

          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-primary)',
            overflowX: 'auto',
            whiteSpace: 'nowrap'
          }}>
            {dirParts.map((part, index) => {
              const partPath = dirParts.slice(0, index + 1).join('\\');
              // Fix drive letter on Windows (e.g. C:)
              const fullPartPath = part.endsWith(':') ? `${part}\\` : partPath;
              return (
                <React.Fragment key={index}>
                  {index > 0 && <ChevronRight size={12} color="var(--text-muted)" />}
                  <span
                    onClick={() => loadDirectory(fullPartPath)}
                    style={{
                      cursor: 'pointer',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: index === dirParts.length - 1 ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                      color: index === dirParts.length - 1 ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      fontWeight: index === dirParts.length - 1 ? 600 : 400
                    }}
                  >
                    {part}
                  </span>
                </React.Fragment>
              );
            })}
          </div>

          <button
            onClick={() => setShowCreateFolder(!showCreateFolder)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              backgroundColor: showCreateFolder ? 'var(--accent-primary)' : 'var(--bg-card)',
              color: showCreateFolder ? '#fff' : 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            <FolderPlus size={13} />
            <span>Nova Pasta</span>
          </button>
        </div>

        {/* Create Folder Inline Form */}
        {showCreateFolder && (
          <div style={{
            padding: '10px 16px',
            backgroundColor: 'rgba(56, 189, 248, 0.08)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Nome da Nova Pasta:</span>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Ex: OpenJournalData"
              style={{
                flex: 1,
                fontSize: '12px',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)'
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder(); }}
              autoFocus
            />
            <button
              onClick={handleCreateFolder}
              disabled={creatingFolder || !newFolderName.trim()}
              style={{
                fontSize: '11px',
                padding: '4px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: 'var(--accent-primary)',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {creatingFolder ? 'Criando...' : 'Criar'}
            </button>
          </div>
        )}

        {/* Subfolders List View */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 16px',
          minHeight: '260px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '8px', color: 'var(--text-muted)', fontSize: '13px' }}>
              <Loader2 className="animate-spin" size={18} />
              <span>Carregando pastas...</span>
            </div>
          ) : error ? (
            <div style={{ color: '#ef4444', textAlign: 'center', padding: '20px', fontSize: '13px' }}>
              {error}
            </div>
          ) : browseData?.subfolders && browseData.subfolders.length > 0 ? (
            browseData.subfolders.map((folder, idx) => (
              <div
                key={idx}
                onClick={() => loadDirectory(folder.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  transition: 'all 0.15s ease'
                }}
                className="folder-item-row"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Folder size={16} color="#38bdf8" />
                  <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {folder.name}
                  </span>
                </div>
                <ChevronRight size={14} color="var(--text-muted)" />
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '12px' }}>
              Nenhuma subpasta nesta localização. Clique em <strong>"Selecionar Esta Pasta"</strong> abaixo para usar este local.
            </div>
          )}
        </div>

        {/* Modal Footer / Action Bar */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-tertiary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
              Pasta Selecionada:
            </span>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#10b981', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentDir}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                onSelectFolder(currentDir);
                onClose();
              }}
              disabled={!currentDir}
              style={{
                padding: '6px 16px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: 'var(--accent-primary)',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Check size={14} />
              <span>Selecionar Esta Pasta</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
