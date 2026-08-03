import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Heading1, 
  Heading2, 
  List, 
  Link as LinkIcon, 
  Paperclip,
  Eye,
  Edit3,
  Search,
  X,
  Copy,
  Check,
  Minus
} from 'lucide-react';
import { parseRedNotebookMarkup } from '../utils/rednotebookParser';
import { API_BASE } from '../utils/apiConfig';

const Editor = forwardRef(function Editor({
  text,
  onChangeText,
  viewMode,
  onChangeViewMode,
  highlightQuery = '',
  onClearHighlight = () => {}
}, ref) {
  const textareaRef = useRef(null);
  const previewRef = useRef(null);
  const [copied, setCopied] = useState(false);

  useImperativeHandle(ref, () => ({
    insertCategory(categoryName) {
      insertCategoryHeader(categoryName);
    },
    navigateToCategory(categoryName, occurrenceIndex = 0) {
      scrollToCategoryOccurrence(categoryName, occurrenceIndex);
    }
  }));

  const scrollToCategoryOccurrence = (categoryName, occurrenceIndex = 0) => {
    if (!text) return;

    const escapedName = categoryName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(?:^|\\n)\\s*={2,3}\\s*${escapedName}\\s*={2,3}`, 'gi');
    const matches = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      const matchIndex = match.index + (match[0].startsWith('\n') ? 1 : 0);
      matches.push({ index: matchIndex, length: match[0].trim().length });
    }

    if (matches.length > 0) {
      const targetOccurrence = matches[occurrenceIndex % matches.length];

      if (textareaRef.current) {
        const textarea = textareaRef.current;
        textarea.focus();
        textarea.setSelectionRange(targetOccurrence.index, targetOccurrence.index + targetOccurrence.length);

        const textBefore = text.substring(0, targetOccurrence.index);
        const lineNumber = textBefore.split('\n').length - 1;
        const lineHeight = 22;
        textarea.scrollTop = Math.max(0, lineNumber * lineHeight - 60);
      }
    }

    if (previewRef.current) {
      const headings = previewRef.current.querySelectorAll('h1, h2, h3, .journal-heading');
      const matchedHeadings = Array.from(headings).filter(h => {
        const cleanHeadingText = h.textContent.trim().toLowerCase();
        return cleanHeadingText === categoryName.toLowerCase();
      });

      if (matchedHeadings.length > 0) {
        const targetHeading = matchedHeadings[occurrenceIndex % matchedHeadings.length];
        targetHeading.scrollIntoView({ behavior: 'smooth', block: 'center' });

        targetHeading.classList.add('category-nav-active');
        setTimeout(() => {
          targetHeading.classList.remove('category-nav-active');
        }, 2000);
      }
    }
  };

  const insertCategoryHeader = (categoryName) => {
    const textarea = textareaRef.current;
    const headerMarkup = `=== ${categoryName} ===\n`;

    if (!textarea) {
      const newText = (text ? text + '\n\n' : '') + headerMarkup;
      onChangeText(newText);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentScroll = textarea.scrollTop;

    const needLeadingNewline = start > 0 && text[start - 1] !== '\n';
    const prefix = needLeadingNewline ? '\n\n' : '';
    const fullInsertion = prefix + headerMarkup;

    const newText = text.substring(0, start) + fullInsertion + text.substring(end);
    onChangeText(newText);

    const targetPos = start + fullInsertion.length;

    setTimeout(() => {
      textarea.focus({ preventScroll: true });
      textarea.setSelectionRange(targetPos, targetPos);
      textarea.scrollTop = currentScroll;
    }, 10);
  };

  const insertSeparatorLine = () => {
    const textarea = textareaRef.current;
    const separator = '=========================================================\n';

    if (!textarea) {
      const newText = (text ? text + '\n' : '') + separator;
      onChangeText(newText);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentScroll = textarea.scrollTop;

    const needLeadingNewline = start > 0 && text[start - 1] !== '\n';
    const prefix = needLeadingNewline ? '\n' : '';
    const fullInsertion = prefix + separator;

    const newText = text.substring(0, start) + fullInsertion + text.substring(end);
    onChangeText(newText);

    const targetPos = start + fullInsertion.length;

    setTimeout(() => {
      textarea.focus({ preventScroll: true });
      textarea.setSelectionRange(targetPos, targetPos);
      textarea.scrollTop = currentScroll;
    }, 10);
  };

  // Auto-scroll and select search query in Textarea and Preview
  useEffect(() => {
    if (!highlightQuery || !text) return;

    const timer = setTimeout(() => {
      const lowerText = text.toLowerCase();
      const lowerQuery = highlightQuery.toLowerCase();
      const index = lowerText.indexOf(lowerQuery);

      if (index !== -1) {
        // 1. Scroll and select inside Textarea
        if (textareaRef.current) {
          const textBefore = text.substring(0, index);
          const lineCount = textBefore.split('\n').length;
          const lineHeight = 25.5; // Font 15px * 1.7 line height
          const targetScrollTop = Math.max(0, (lineCount - 4) * lineHeight);

          textareaRef.current.scrollTop = targetScrollTop;

          // Focus and select if activeElement is not the search input field
          const isSearchInputFocused = document.activeElement && (
            document.activeElement.classList.contains('rn-search-input')
          );

          if (!isSearchInputFocused) {
            textareaRef.current.focus({ preventScroll: true });
            textareaRef.current.setSelectionRange(index, index + highlightQuery.length);
          }
        }

        // 2. Scroll inside Preview to yellow mark highlight
        if (previewRef.current) {
          const markElement = previewRef.current.querySelector('mark.search-highlight');
          if (markElement) {
            markElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }
    }, 60);

    return () => clearTimeout(timer);
  }, [highlightQuery, text, viewMode]);

  const insertMarkup = (prefix, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentScroll = textarea.scrollTop;
    const selectedText = text.substring(start, end) || 'texto';
    const newText = text.substring(0, start) + prefix + selectedText + suffix + text.substring(end);

    onChangeText(newText);

    setTimeout(() => {
      textarea.focus({ preventScroll: true });
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length
      );
      textarea.scrollTop = currentScroll;
    }, 10);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE}/api/upload-media`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success && data.rednotebookMarkup) {
        insertMarkup('\n' + data.rednotebookMarkup + '\n');
      } else {
        alert('Erro ao enviar arquivo: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (err) {
      alert('Erro de conexão ao enviar arquivo: ' + err.message);
    }
  };

  const handleCopyContent = async () => {
    if (!text || !text.trim()) return;

    const renderedHtml = parseRedNotebookMarkup(text);

    const htmlPayload = `
      <div style="font-family: Arial, sans-serif; color: #0f172a; max-width: 800px; font-size: 15px; line-height: 1.7;">
        ${renderedHtml}
      </div>
    `;

    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const blobHtml = new Blob([htmlPayload], { type: 'text/html' });
        const blobText = new Blob([text], { type: 'text/plain' });
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': blobHtml,
            'text/plain': blobText
          })
        ]);
      } else {
        await navigator.clipboard.writeText(text);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch (fallbackErr) {
        console.error('Erro ao copiar:', fallbackErr);
      }
    }
  };

  return (
    <div className="editor-container">
      {/* Editor Toolbar */}
      <div className="editor-toolbar">
        <button className="tool-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => insertMarkup('**', '**')} title="Negrito (**texto**)">
          <Bold size={15} />
        </button>
        <button className="tool-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => insertMarkup('//', '//')} title="Itálico (//texto//)">
          <Italic size={15} />
        </button>
        <button className="tool-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => insertMarkup('__', '__')} title="Sublinhado (__texto__)">
          <Underline size={15} />
        </button>
        <button className="tool-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => insertMarkup('--', '--')} title="Tachado (--texto--)">
          <Strikethrough size={15} />
        </button>

        <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--border-color)', margin: '0 4px' }} />

        <button className="tool-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => insertMarkup('== ', ' ==')} title="Título 1 (== Título ==)">
          <Heading1 size={15} />
        </button>
        <button className="tool-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => insertMarkup('=== ', ' ===')} title="Título 2 (=== Título ===)">
          <Heading2 size={15} />
        </button>

        <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--border-color)', margin: '0 4px' }} />

        <button className="tool-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => insertMarkup('- ')} title="Lista de Tópicos (- item)">
          <List size={15} />
        </button>
        <button className="tool-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => insertMarkup('[Link ', ' http://exemplo.com]')} title="Inserir Link">
          <LinkIcon size={15} />
        </button>

        <label className="tool-btn" onMouseDown={(e) => e.preventDefault()} style={{ cursor: 'pointer' }} title="Inserir Imagem / Anexo">
          <Paperclip size={15} />
          <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} />
        </label>

        <button className="tool-btn" onMouseDown={(e) => e.preventDefault()} onClick={insertSeparatorLine} title="Inserir Linha Separadora (=========================================================)">
          <Minus size={15} />
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px', alignItems: 'center' }}>
          <button 
            className={`tool-btn ${copied ? 'active' : ''}`} 
            onClick={handleCopyContent}
            title={copied ? "Conteúdo Copiado!" : "Copiar Visão Dividida"}
            style={{ color: copied ? '#10b981' : undefined }}
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
          </button>

          <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--border-color)', margin: '0 2px' }} />

          <button 
            className={`tool-btn ${viewMode === 'edit' ? 'active' : ''}`} 
            onClick={() => onChangeViewMode('edit')}
            title="Apenas Editar"
          >
            <Edit3 size={15} />
          </button>
          <button 
            className={`tool-btn ${viewMode === 'split' ? 'active' : ''}`} 
            onClick={() => onChangeViewMode('split')}
            title="Visão Dividida"
          >
            <Eye size={15} />
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="editor-split-view">
        {(viewMode === 'edit' || viewMode === 'split') && (
          <textarea
            ref={textareaRef}
            className="editor-textarea"
            placeholder="Escreva suas reflexões ou tratativas do dia..."
            value={text}
            onChange={(e) => onChangeText(e.target.value)}
          />
        )}

        {(viewMode === 'split' || viewMode === 'preview') && (
          <div 
            ref={previewRef}
            className="editor-preview"
            dangerouslySetInnerHTML={{ __html: parseRedNotebookMarkup(text, highlightQuery) }}
          />
        )}
      </div>
    </div>
  );
});

export default Editor;
