import React, { useState, useEffect, useRef } from 'react';
import { Link as LinkIcon, X, ExternalLink, Globe } from 'lucide-react';

export default function LinkModal({
  isOpen,
  onClose,
  onConfirm,
  initialText = '',
  initialUrl = ''
}) {
  const [displayText, setDisplayText] = useState(initialText);
  const [linkUrl, setLinkUrl] = useState(initialUrl);

  const textInputRef = useRef(null);
  const urlInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setDisplayText(initialText);
      setLinkUrl(initialUrl);

      // Auto-focus management
      setTimeout(() => {
        if (initialText && !initialUrl) {
          urlInputRef.current?.focus();
        } else {
          textInputRef.current?.focus();
          textInputRef.current?.select();
        }
      }, 50);
    }
  }, [isOpen, initialText, initialUrl]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    let cleanUrl = linkUrl.trim();
    if (!cleanUrl) {
      alert('Por favor, informe o endereço (URL) do link.');
      urlInputRef.current?.focus();
      return;
    }

    // Prepend http:// if missing scheme and not relative asset path
    if (!/^(https?:\/\/|\/|data:)/i.test(cleanUrl)) {
      cleanUrl = `http://${cleanUrl}`;
    }

    const cleanText = displayText.trim() || cleanUrl;

    onConfirm({
      displayText: cleanText,
      linkUrl: cleanUrl
    });

    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} onKeyDown={handleKeyDown}>
      <div 
        className="modal-card link-modal-card" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px' }}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(37, 99, 235, 0.12)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <LinkIcon size={18} />
            </div>
            <span className="modal-title" style={{ fontSize: '16px' }}>Inserir Link</span>
          </div>

          <button 
            type="button" 
            className="icon-btn" 
            onClick={onClose}
            title="Fechar (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Field 1: Texto a apresentar */}
          <div className="settings-field">
            <label className="settings-label" htmlFor="link-text-input">
              Texto a apresentar:
            </label>
            <input
              id="link-text-input"
              ref={textInputRef}
              type="text"
              className="settings-input"
              placeholder="Ex: Documentação de Suporte / Portal Intranet"
              value={displayText}
              onChange={(e) => setDisplayText(e.target.value)}
            />
          </div>

          {/* Field 2: Endereço (URL) */}
          <div className="settings-field">
            <label className="settings-label" htmlFor="link-url-input">
              Endereço:
            </label>
            <div className="link-url-input-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                id="link-url-input"
                ref={urlInputRef}
                type="text"
                className="settings-input"
                placeholder="Ex: https://empresa.com ou servidor/pasta"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                style={{ flex: 1 }}
              />
              <div 
                style={{
                  height: '40px',
                  width: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-muted)'
                }}
                title="Endereço Web"
              >
                <Globe size={18} />
              </div>
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="link-preview-box" style={{
            padding: '10px 12px',
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '2px'
          }}>
            <ExternalLink size={14} color="var(--accent-primary)" />
            <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <span style={{ color: 'var(--text-muted)', marginRight: '6px' }}>Como aparecerá:</span>
              <span className="journal-link" style={{ fontWeight: 600 }}>
                {displayText.trim() || linkUrl.trim() || 'Texto do Link'}
              </span>
            </div>
          </div>

          {/* Modal Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            marginTop: '8px'
          }}>
            <button
              type="button"
              className="tool-btn"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                border: '1px solid var(--border-color)',
                fontSize: '13px',
                fontWeight: 600
              }}
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
                fontSize: '13px',
                fontWeight: 700
              }}
            >
              Inserir
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
