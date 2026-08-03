/**
 * Resolve relative or absolute RedNotebook image/file paths to accessible web URLs.
 */
export function resolveAssetUrl(rawPath) {
  if (!rawPath) return '';

  let clean = rawPath.trim().replace(/\\/g, '/');

  // If already absolute HTTP/HTTPS or Data URI, return directly
  if (/^https?:\/\//i.test(clean) || /^data:/i.test(clean)) {
    return clean;
  }

  // Remove quotes if present
  clean = clean.replace(/^["']|["']$/g, '');

  // Extract relative images/ or files/ path if embedded in absolute path (e.g. C:/.../data/images/file.png)
  const assetMatch = clean.match(/(?:images|files)\/[^/]+$/i);
  if (assetMatch) {
    clean = assetMatch[0];
  } else {
    // If only filename was provided (e.g. file-123.png)
    const filenameMatch = clean.match(/[^/]+$/);
    if (filenameMatch) {
      const filename = filenameMatch[0];
      const isImg = /\.(png|jpe?g|gif|svg|webp|bmp)$/i.test(filename);
      clean = isImg ? `images/${filename}` : `files/${filename}`;
    }
  }

  // Strip leading slashes, data-assets/, or data/
  clean = clean.replace(/^\/?(data-assets\/|data\/)?/i, '');

  const isBrowser = typeof window !== 'undefined';
  const backendHost = (isBrowser && window.location.port !== '3001')
    ? 'http://localhost:3001'
    : '';

  return `${backendHost}/data-assets/${clean}`;
}

/**
 * RedNotebook txt2tags markup parser to HTML with Search Term Highlighting
 */
export function parseRedNotebookMarkup(text, highlightQuery = '') {
  if (!text) return '';

  let html = text;
  const placeholders = [];

  const storePlaceholder = (htmlSnippet) => {
    const key = `KEYPH${placeholders.length}PH`;
    placeholders.push({ key, htmlSnippet });
    return key;
  };

  // 0. Extract Code Blocks (```lang ... ``` or ``` ... ```)
  html = html.replace(/```(\w*)\r?\n?([\s\S]*?)```/g, (match, lang, codeText) => {
    const escapedCode = codeText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const langClass = lang ? ` class="language-${lang}"` : '';
    const blockHtml = `<pre class="journal-code-block"><code${langClass}>${escapedCode.trim()}</code></pre>`;
    return storePlaceholder(blockHtml);
  });

  // 0.1 Extract Inline Code (`code`)
  html = html.replace(/`([^`\r\n]+)`/g, (match, inlineCode) => {
    const escapedCode = inlineCode
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const inlineHtml = `<code class="journal-inline-code">${escapedCode}</code>`;
    return storePlaceholder(inlineHtml);
  });

  // 1. Extract Images: [image: path/filename]
  html = html.replace(/\[image:\s*([^\]]+)\]/gi, (match, imagePath) => {
    const src = resolveAssetUrl(imagePath);
    const imgHtml = `<div class="journal-image-wrapper"><img src="${src}" alt="Anexo do Diário" class="journal-image" /></div>`;
    return storePlaceholder(imgHtml);
  });

  // 2. Extract Explicit Links: [link text http://url] or [link text path/to/file]
  html = html.replace(/\[([^\]]+?)\s+(https?:\/\/[^\s\]]+)\]/gi, (match, linkText, url) => {
    const linkHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer" class="journal-link">${linkText}</a>`;
    return storePlaceholder(linkHtml);
  });

  html = html.replace(/\[([^\]]+?)\s+((?:files|images|\/data-assets)[^\s\]]+)\]/gi, (match, linkText, targetPath) => {
    const fileUrl = resolveAssetUrl(targetPath);
    const linkHtml = `<a href="${fileUrl}" target="_blank" rel="noopener noreferrer" class="journal-link">${linkText}</a>`;
    return storePlaceholder(linkHtml);
  });

  // 3. Extract Standalone URLs: http:// or https://
  html = html.replace(/(^|[^\w"'>=])(\bhttps?:\/\/[^\s<\]]+)/gi, (match, prefix, url) => {
    const linkHtml = `${prefix}<a href="${url}" target="_blank" rel="noopener noreferrer" class="journal-link">${url}</a>`;
    return storePlaceholder(linkHtml);
  });

  // 4. Escape HTML entities on remaining text
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 5. Headings
  html = html.replace(/^====\s*(.*?)\s*====$/gm, '<h3>$1</h3>');
  html = html.replace(/^===\s*(.*?)\s*===$/gm, '<h2>$1</h2>');
  html = html.replace(/^==\s*(.*?)\s*==$/gm, '<h1>$1</h1>');

  // 6. Formatting: Bold, Italic, Underline, Strikethrough
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\/\/(.*?)\/\//g, '<em>$1</em>');
  html = html.replace(/__(.*?)__/g, '<u>$1</u>');
  html = html.replace(/--(.*?)--/g, '<s>$1</s>');

  // 7. Hashtags
  html = html.replace(/(^|[^\w&#])(#[\p{L}\p{N}_]+)/gu, '$1<span class="hashtag-pill">$2</span>');

  // 8. Bullet lists & Line breaks
  const lines = html.split('\n');
  let inList = false;
  const processedLines = [];

  for (const line of lines) {
    if (/^\s*-\s+(.*)/.test(line)) {
      if (!inList) {
        processedLines.push('<ul class="journal-list">');
        inList = true;
      }
      processedLines.push(line.replace(/^\s*-\s+(.*)/, '<li>$1</li>'));
    } else {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      processedLines.push(line);
    }
  }
  if (inList) {
    processedLines.push('</ul>');
  }

  html = processedLines.join('\n');
  html = html.replace(/\n/g, '<br/>');

  // 9. Restore Placeholders
  for (const { key, htmlSnippet } of placeholders) {
    html = html.replace(key, htmlSnippet);
  }

  // 10. Search Term Highlighting
  if (highlightQuery && highlightQuery.trim().length > 0) {
    const cleanQ = highlightQuery.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(`(${cleanQ})`, 'gi');

    // Replace text nodes without breaking HTML tags
    html = html.replace(/(<[^>]+>)|([^<]+)/g, (match, isTag, isText) => {
      if (isTag) return isTag;
      return isText.replace(searchRegex, '<mark class="search-highlight">$1</mark>');
    });
  }

  return html;
}
