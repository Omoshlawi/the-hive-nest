/**
 * TypeScript implementation of Django Taggit string parsing logic
 *
 * Parsing rules:
 * 1. If no commas or double quotes: space-delimited
 * 2. If contains commas or quotes:
 *    - Quoted groups take precedence (can contain commas)
 *    - Unclosed quotes are ignored
 *    - If unquoted commas exist: comma-delimited
 *    - Otherwise: space-delimited
 */

export interface ParsedTags {
  tags: string[];
  delimiter: 'space' | 'comma';
}

/**
 * Parses a tag string according to Django Taggit rules
 * @param input - The tag string to parse
 * @returns Object containing parsed tags and delimiter used
 */
export function parseTagString(input: string): ParsedTags {
  if (!input || typeof input !== 'string') {
    return { tags: [], delimiter: 'space' };
  }

  const trimmedInput = input.trim();
  if (!trimmedInput) {
    return { tags: [], delimiter: 'space' };
  }

  // Check if input contains commas or double quotes
  const hasCommas = trimmedInput.includes(',');
  const hasQuotes = trimmedInput.includes('"');

  // Simple case: no commas or quotes - space delimited
  if (!hasCommas && !hasQuotes) {
    const tags = trimmedInput.split(/\s+/).filter((tag) => tag.length > 0);
    return { tags, delimiter: 'space' };
  }

  // Complex case: parse with quotes and commas
  const { quotedSegments, remainder } = extractQuotedSegments(trimmedInput);

  // Check if there are unquoted commas
  const hasUnquotedCommas = remainder.includes(',');

  let tags: string[];
  let delimiter: 'space' | 'comma';

  if (hasUnquotedCommas) {
    // Comma-delimited parsing
    tags = parseCommaDelimited(trimmedInput, quotedSegments);
    delimiter = 'comma';
  } else {
    // Space-delimited parsing
    tags = parseSpaceDelimited(trimmedInput, quotedSegments);
    delimiter = 'space';
  }

  return { tags, delimiter };
}

/**
 * Extracts quoted segments and returns them with the remainder
 */
function extractQuotedSegments(input: string): {
  quotedSegments: Array<{ start: number; end: number; content: string }>;
  remainder: string;
} {
  const quotedSegments: Array<{ start: number; end: number; content: string }> =
    [];
  let remainder = input;

  // Regex to find properly closed quoted segments
  const quotedRegex = /"([^"]*)"/g;
  let match;

  while ((match = quotedRegex.exec(input)) !== null) {
    quotedSegments.push({
      start: match.index,
      end: match.index + match[0].length,
      content: match[1],
    });
  }

  // Remove quoted segments from remainder to check for unquoted commas
  quotedSegments
    .sort((a, b) => b.start - a.start) // Sort in reverse order for safe removal
    .forEach((segment) => {
      remainder =
        remainder.slice(0, segment.start) +
        ' '.repeat(segment.end - segment.start) +
        remainder.slice(segment.end);
    });

  return { quotedSegments, remainder };
}

/**
 * Parses input as comma-delimited, respecting quoted segments
 */
function parseCommaDelimited(
  input: string,
  quotedSegments: Array<{ start: number; end: number; content: string }>,
): string[] {
  const tags: string[] = [];

  // Create a map of positions that are inside quotes
  const quotedPositions = new Set<number>();
  quotedSegments.forEach((segment) => {
    for (let i = segment.start; i < segment.end; i++) {
      quotedPositions.add(i);
    }
  });

  let currentTag = '';
  let i = 0;

  while (i < input.length) {
    const char = input[i];

    if (char === ',' && !quotedPositions.has(i)) {
      // Unquoted comma - end current tag
      const trimmedTag = currentTag.trim();
      if (trimmedTag) {
        tags.push(cleanupTag(trimmedTag));
      }
      currentTag = '';
    } else {
      currentTag += char;
    }
    i++;
  }

  // Add the last tag
  const trimmedTag = currentTag.trim();
  if (trimmedTag) {
    tags.push(cleanupTag(trimmedTag));
  }

  return tags.filter((tag) => tag.length > 0);
}

/**
 * Parses input as space-delimited, respecting quoted segments
 */
function parseSpaceDelimited(
  input: string,
  quotedSegments: Array<{ start: number; end: number; content: string }>,
): string[] {
  const tags: string[] = [];

  // Create a map of positions that are inside quotes
  const quotedPositions = new Set<number>();
  quotedSegments.forEach((segment) => {
    for (let i = segment.start; i < segment.end; i++) {
      quotedPositions.add(i);
    }
  });

  let currentTag = '';
  let i = 0;

  while (i < input.length) {
    const char = input[i];

    if (/\s/.test(char) && !quotedPositions.has(i)) {
      // Unquoted whitespace - end current tag
      const trimmedTag = currentTag.trim();
      if (trimmedTag) {
        tags.push(cleanupTag(trimmedTag));
      }
      currentTag = '';
    } else {
      currentTag += char;
    }
    i++;
  }

  // Add the last tag
  const trimmedTag = currentTag.trim();
  if (trimmedTag) {
    tags.push(cleanupTag(trimmedTag));
  }

  return tags.filter((tag) => tag.length > 0);
}

/**
 * Removes surrounding quotes from a tag if present
 */
function cleanupTag(tag: string): string {
  const trimmed = tag.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length > 1) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

/**
 * Converts an array of tags back to a string using the specified delimiter
 */
export function tagsToString(
  tags: string[],
  delimiter: 'space' | 'comma' = 'space',
): string {
  if (!tags || tags.length === 0) {
    return '';
  }

  const processedTags = tags.map((tag) => {
    // Quote tags that contain spaces or commas
    if (tag.includes(' ') || tag.includes(',')) {
      return `"${tag}"`;
    }
    return tag;
  });

  return delimiter === 'comma'
    ? processedTags.join(', ')
    : processedTags.join(' ');
}

/**
 * Regex patterns for common validation tasks
 */
export const TagRegex = {
  // Matches properly quoted segments
  quotedSegments: /"([^"]*)"/g,

  // Matches unquoted commas (commas not inside quotes)
  unquotedCommas: /,(?=(?:[^"]*"[^"]*")*[^"]*$)/g,

  // Validates tag format (allows letters, numbers, spaces, hyphens, underscores)
  validTag: /^[\w\s\-]+$/,

  // Finds unclosed quotes
  unclosedQuotes: /"[^"]*$/,
};
