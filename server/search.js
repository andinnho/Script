// Hashtag Regex matching RedNotebook rules
const HASHTAG_REGEX = /(?:^|[^\w&#])(#[\p{L}\p{N}_]+)/gu;

export function extractHashtags(text) {
  if (!text) return [];
  const matches = [...text.matchAll(HASHTAG_REGEX)];
  const tags = new Set();
  for (const match of matches) {
    const rawTag = match[1].substring(1).toLowerCase();
    if (rawTag && !/^[0-9a-fA-F]{6}$/.test(rawTag)) { // Exclude hex color codes
      tags.add(rawTag);
    }
  }
  return Array.from(tags);
}

export function searchJournal(monthsData, query = '', selectedTag = '', dateFrom = null, dateTo = null) {
  const results = [];
  const cleanQuery = query.trim().toLowerCase();
  const cleanTag = selectedTag ? selectedTag.toLowerCase().replace(/^#/, '') : '';

  for (const [monthKey, monthObj] of Object.entries(monthsData)) {
    if (!monthObj.days) continue;

    for (const [dayNum, dayData] of Object.entries(monthObj.days)) {
      const year = monthObj.year;
      const month = monthObj.month;
      const day = parseInt(dayNum, 10);

      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // Date filter check
      if (dateFrom && dateStr < dateFrom) continue;
      if (dateTo && dateStr > dateTo) continue;

      const text = dayData.text || '';
      const dayTags = extractHashtags(text);
      
      // Check categories in raw day object
      const categories = dayData.categories || {};
      const categoryKeys = Object.keys(categories);
      categoryKeys.forEach(cat => {
        const catTag = cat.toLowerCase();
        if (!dayTags.includes(catTag)) dayTags.push(catTag);
      });

      // Tag filter check
      if (cleanTag && !dayTags.includes(cleanTag)) {
        continue;
      }

      // Query text check
      if (cleanQuery) {
        const lowerText = text.toLowerCase();
        const textMatch = lowerText.includes(cleanQuery);
        const dateMatch = dateStr.includes(cleanQuery);
        const tagMatch = dayTags.some(t => t.includes(cleanQuery));

        if (!textMatch && !dateMatch && !tagMatch) {
          continue;
        }

        // Generate context snippet
        let snippet = '';
        if (textMatch) {
          const idx = lowerText.indexOf(cleanQuery);
          const start = Math.max(0, idx - 40);
          const end = Math.min(text.length, idx + cleanQuery.length + 40);
          snippet = (start > 0 ? '... ' : '') + text.substring(start, end) + (end < text.length ? ' ...' : '');
        } else {
          snippet = text.substring(0, 100) + (text.length > 100 ? '...' : '');
        }

        results.push({
          date: dateStr,
          year,
          month,
          day,
          snippet,
          tags: dayTags,
          wordCount: text.trim().split(/\s+/).filter(Boolean).length
        });
      } else {
        // No text query, but tag / date filter matched
        results.push({
          date: dateStr,
          year,
          month,
          day,
          snippet: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
          tags: dayTags,
          wordCount: text.trim().split(/\s+/).filter(Boolean).length
        });
      }
    }
  }

  // Sort descending by date
  return results.sort((a, b) => b.date.localeCompare(a.date));
}

export function getAllTagsWithCounts(monthsData) {
  const tagCounts = {};

  for (const monthObj of Object.values(monthsData)) {
    if (!monthObj.days) continue;
    for (const dayData of Object.values(monthObj.days)) {
      const text = dayData.text || '';
      const tags = extractHashtags(text);

      const categories = dayData.categories || {};
      Object.keys(categories).forEach(cat => {
        const catTag = cat.toLowerCase();
        if (!tags.includes(catTag)) tags.push(catTag);
      });

      tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  }

  return Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function replaceInJournal(monthsData, storage, oldQuery, newText) {
  if (!oldQuery) return { success: false, error: 'Query vazia' };

  let totalReplacements = 0;
  let modifiedDaysCount = 0;
  const regex = new RegExp(oldQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');

  for (const [monthKey, monthObj] of Object.entries(monthsData)) {
    if (!monthObj.days) continue;
    let monthModified = false;

    for (const [dayNum, dayData] of Object.entries(monthObj.days)) {
      const text = dayData.text || '';
      if (regex.test(text)) {
        const matches = text.match(regex);
        const count = matches ? matches.length : 0;
        totalReplacements += count;
        modifiedDaysCount++;

        dayData.text = text.replace(regex, newText);
        monthModified = true;
      }
    }

    if (monthModified) {
      storage.saveMonth(monthObj.year, monthObj.month, monthObj.days);
    }
  }

  return {
    success: true,
    totalReplacements,
    modifiedDaysCount
  };
}

