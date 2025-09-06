// Advanced search utilities with typo tolerance and fuzzy matching

export interface SearchOptions {
  threshold?: number; // Similarity threshold (0-1)
  keys?: string[]; // Fields to search in
  includeScore?: boolean;
  caseSensitive?: boolean;
}

// Levenshtein distance for typo tolerance
export const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
};

// Calculate similarity score
export const similarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
};

// Fuzzy search function
export const fuzzySearch = <T>(
  items: T[],
  query: string,
  options: SearchOptions = {}
): T[] => {
  const {
    threshold = 0.3,
    keys = ['name', 'title'],
    includeScore = false,
    caseSensitive = false
  } = options;

  if (!query.trim()) return items;

  const searchQuery = caseSensitive ? query : query.toLowerCase();
  
  const results = items
    .map(item => {
      let bestScore = 0;
      let matchedField = '';

      keys.forEach(key => {
        const value = (item as any)[key];
        if (typeof value === 'string') {
          const searchValue = caseSensitive ? value : value.toLowerCase();
          
          // Exact match gets highest score
          if (searchValue.includes(searchQuery)) {
            bestScore = Math.max(bestScore, 1);
            matchedField = key;
            return;
          }

          // Fuzzy match
          const score = similarity(searchQuery, searchValue);
          if (score > bestScore) {
            bestScore = score;
            matchedField = key;
          }
        }
      });

      return {
        item,
        score: bestScore,
        matchedField
      };
    })
    .filter(result => result.score >= threshold)
    .sort((a, b) => b.score - a.score);

  return includeScore ? results as any : results.map(r => r.item);
};

// Highlight matching text
export const highlightMatch = (text: string, query: string): string => {
  if (!query.trim()) return text;
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

// Search suggestions based on common typos
export const getSearchSuggestions = (query: string, dictionary: string[]): string[] => {
  if (!query.trim()) return [];
  
  return dictionary
    .map(word => ({
      word,
      score: similarity(query.toLowerCase(), word.toLowerCase())
    }))
    .filter(item => item.score > 0.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(item => item.word);
};

// Category and filter utilities
export const applyFilters = <T>(
  items: T[],
  filters: Record<string, any>
): T[] => {
  return items.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      if (value === null || value === undefined || value === '') return true;
      
      const itemValue = (item as any)[key];
      
      if (Array.isArray(value)) {
        return value.includes(itemValue);
      }
      
      if (typeof value === 'object' && value.min !== undefined && value.max !== undefined) {
        const numValue = parseFloat(itemValue);
        return numValue >= value.min && numValue <= value.max;
      }
      
      return itemValue === value;
    });
  });
};
