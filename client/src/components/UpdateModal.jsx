import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, CheckCircle, AlertTriangle, X, ShieldCheck, Sparkles, ExternalLink } from 'lucide-react';

export default function UpdateModal({ isOpen, onClose, apiBase = '' }) {
  const [status, setStatus] = useState('checking'); // 'checking' | 'up-to-date' | 'available' | 'downloading' | 'error'
  const [manifest, setManifest] = useState(null);
  const [currentVersion, setCurrentVersion] = useState('1.0.0');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      checkUpdates();
    }
  }, [isOpen]);

  const compareVersions = (v1, v2) => {
    const p1 = (v1 || '1.0.0').replace(/^v/, '').split('.').map(Number);
    const p2 = (v2 || '1.0.0').replace(/^v/, '').split('.').map(Number);
    for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
      const val1 = p1[i] || 0;
      const val2 = p2[i] || 0;
      if (val1 > val2) return 1;
      if (val1 < val2) return -1;
    }
    return 0;
  };

  const checkUpdates = async () => {
    setStatus('checking');
    setErrorMsg('');

    try {
      // Get version from Electron API or fallback
      let appVer = '1.0.0';
      if (window.electronAPI && window.electronAPI.getCurrentVersion) {
        appVer = await window.electronAPI.getCurrentVersion();
      }
      setCurrentVersion(appVer);

      const res = await fetch(`${apiBase}/api/check-updates`);
      if (!res.ok) {
        throw new Error('Não foi possível conectar ao servidor de atualizações.');
      }
      const data = await res.json();
      setManifest(data);

      const comp = compareVersions(data.version, appVer);
      if (comp > 0) {
        setStatus('available');
      } else {
        setStatus('up-to-date');
      }
    } catch (err) {
      console.error('Erro ao verificar atualizações:', err);
      setErrorMsg(err.message || 'Falha ao conectar com o servidor.');
      setStatus('error');
    }
  };

  const handleStartUpdate = async () => {
    if (!manifest) return;
    setStatus('downloading');

    try {
      const installerUrl = manifest.installerUrl || '/api/download/installer';
      const fullUrl = installerUrl.startsWith('http') ? installerUrl : `${apiBase}${installerUrl}`;

      if (window.electronAPI && window.electronAPI.downloadAndUpdate) {
        // Disparar download e execução automática do instalador via Electron IPC
        const result = await window.electronAPI.downloadAndUpdate(fullUrl);
        if (!result.success) {
          throw new Error(result.error || 'Falha ao executar o instalador.');
        }
      } else {
        // Modo navegador Web: abrir download em nova aba
        window.open(fullUrl, '_blank');
        setStatus('up-to-date');
      }
    } catch (err) {
      console.error('Erro ao iniciar atualização:', err);
      setErrorMsg(err.message);
      setStatus('error');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '520px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden',
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(30, 41, 59, 0.8)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'rgba(225, 29, 72, 0.15)',
              color: '#f43f5e',
              padding: '0.5rem',
              borderRadius: '10px',
              display: 'flex'
            }}>
              <RefreshCw className={status === 'checking' || status === 'downloading' ? 'spin-icon' : ''} size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Verificação de Atualizações</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>Central de Distribuição Script</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '6px',
              display: 'flex'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.5rem' }}>
          {status === 'checking' && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <RefreshCw size={36} style={{ color: '#e11d48', marginBottom: '1rem', animation: 'spin 1.5s linear infinite' }} />
              <p style={{ margin: 0, fontWeight: 500 }}>Verificando existência de novas versões...</p>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.4rem' }}>Consultando o servidor de distribuição na intranet</p>
            </div>
          )}

          {status === 'up-to-date' && (
            <div style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
              <div style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <CheckCircle size={32} />
              </div>
              <h4 style={{ fontSize: '1.2rem', margin: '0 0 0.4rem', fontWeight: 600 }}>Você está na versão mais recente!</h4>
              <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: 0 }}>
                O Script está atualizado para a versão <strong>v{currentVersion}</strong>.
              </p>
            </div>
          )}

          {status === 'available' && manifest && (
            <div>
              <div style={{
                background: 'rgba(225, 29, 72, 0.1)',
                border: '1px solid rgba(225, 29, 72, 0.3)',
                padding: '1rem',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.25rem'
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#fda4af', fontWeight: 600, textTransform: 'uppercase' }}>Nova Versão Disponível</span>
                  <h4 style={{ fontSize: '1.25rem', margin: '0.1rem 0 0', color: '#f8fafc', fontWeight: 700 }}>
                    Versão v{manifest.version}
                  </h4>
                </div>
                <span style={{
                  background: '#e11d48',
                  color: 'white',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  padding: '0.25rem 0.6rem',
                  borderRadius: '6px'
                }}>
                  {manifest.releaseDate || 'Nova'}
                </span>
              </div>

              <h5 style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={16} color="#e11d48" /> Novidades e Correções:
              </h5>
              <div style={{
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '10px',
                padding: '1rem',
                maxHeight: '160px',
                overflowY: 'auto',
                marginBottom: '1.25rem'
              }}>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                  {(manifest.changelog || ['Melhorias de desempenho e correções de segurança.']).map((item, idx) => (
                    <li key={idx} style={{ marginBottom: '0.4rem' }}>{item}</li>
                  ))}
                </ul>
              </div>

              <div style={{
                background: 'rgba(51, 65, 85, 0.4)',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <ShieldCheck size={18} color="#10b981" />
                <span>Seus arquivos e preferências em <code>%APPDATA%</code> serão mantidos intactos.</span>
              </div>
            </div>
          )}

          {status === 'downloading' && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <Download size={36} style={{ color: '#e11d48', marginBottom: '1rem', animation: 'bounce 1s infinite' }} />
              <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>Baixando atualização...</h4>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>
                O instalador está sendo preparado. O aplicativo fechará automaticamente para aplicar a atualização.
              </p>
            </div>
          )}

          {status === 'error' && (
            <div style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
              <AlertTriangle size={36} style={{ color: '#f59e0b', marginBottom: '0.75rem' }} />
              <h4 style={{ margin: '0 0 0.4rem', color: '#f8fafc' }}>Não foi possível verificar atualizações</h4>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 1rem' }}>{errorMsg}</p>
              <a
                href={`${apiBase}/downloads`}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#38bdf8', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
              >
                Abrir Portal de Downloads na Intranet <ExternalLink size={14} />
              </a>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid #334155',
          background: 'rgba(15, 23, 42, 0.4)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.75rem'
        }}>
          {status === 'available' && (
            <>
              <button
                onClick={onClose}
                style={{
                  padding: '0.6rem 1.2rem',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  background: 'transparent',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Depois
              </button>
              <button
                onClick={handleStartUpdate}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#e11d48',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Download size={16} /> Baixar e Atualizar
              </button>
            </>
          )}

          {(status === 'up-to-date' || status === 'error') && (
            <button
              onClick={onClose}
              style={{
                padding: '0.6rem 1.25rem',
                borderRadius: '8px',
                border: 'none',
                background: '#334155',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Fechar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
