/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
export class QueryParamsUtils {
  /**
   * Validate if a string has matching key-value pairs
   * @param value String to validate
   * @returns True if valid, false otherwise
   */
  static isValidPairString(value: string): boolean {
    if (!value || value.trim() === '') {
      return true; // Empty string is valid
    }

    const parts = value.split(',');

    // Must have even number of parts (key-value pairs)
    if (parts.length % 2 !== 0) {
      return false;
    }

    // Check each key (odd indices) is not empty and follows dot notation pattern
    for (let i = 0; i < parts.length; i += 2) {
      const key = parts[i];

      // Key must not be empty
      if (!key || key.trim() === '') {
        return false;
      }

      // Key should only contain alphanumeric, dots, and underscores
      if (!/^[a-zA-Z0-9_.]+$/.test(key)) {
        return false;
      }

      // Key should not start or end with a dot
      if (key.startsWith('.') || key.endsWith('.')) {
        return false;
      }

      // Key should not have consecutive dots
      if (key.includes('..')) {
        return false;
      }
    }

    return true;
  }

  /**
   * Convert nested object to flat string representation
   * @param value Object to convert
   * @returns Comma-separated string with dot-notation paths
   */
  static objectToString(value: Record<string, any>): string {
    const pairs: string[] = [];

    const flatten = (obj: any, prefix: string = ''): void => {
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const path = prefix ? `${prefix}.${key}` : key;
          const val = obj[key];

          if (val === null || val === undefined) {
            pairs.push(path, '');
          } else if (Array.isArray(val)) {
            val.forEach((item, index) => {
              const arrayPath = `${path}.${index}`;
              if (
                typeof item === 'object' &&
                item !== null &&
                !Array.isArray(item)
              ) {
                flatten(item, arrayPath);
              } else {
                pairs.push(arrayPath, String(item));
              }
            });
          } else if (typeof val === 'object') {
            flatten(val, path);
          } else {
            pairs.push(path, String(val));
          }
        }
      }
    };

    flatten(value);
    return pairs.join(',');
  }

  /**
   * Parse object string
   * @param value Comma separated key,value pairs with dot notation
   * @returns Reconstructed nested object
   */
  static parseObject(value: string): Record<string, any> {
    if (!value) return {};

    const parts = value.split(',');
    const result: Record<string, any> = {};

    for (let i = 0; i < parts.length; i += 2) {
      const path = parts[i];
      const val = parts[i + 1] || '';

      if (!path) continue;

      const keys = path.split('.');
      let current: any = result;

      for (let j = 0; j < keys.length; j++) {
        const key = keys[j];
        const isLast = j === keys.length - 1;
        const nextKey = keys[j + 1];
        const isNextArray = nextKey && /^\d+$/.test(nextKey);

        if (isLast) {
          current[key] = val;
        } else {
          if (!current[key]) {
            current[key] = isNextArray ? [] : {};
          }
          current = current[key];
        }
      }
    }

    return result;
  }
  /**
   * Convert array to comma-separated string
   * @param value Array to convert
   * @returns Comma-separated string
   */
  static arrayToString(value: string[]): string {
    return value.join(',');
  }

  /**
   * Parse comma-separated string to array
   * @param value Comma-separated string
   * @returns Array of strings
   */
  static parseArray(value: string): string[] {
    if (!value || value.trim() === '') {
      return [];
    }
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item !== '');
  }

  /**
   * Validate if a string is a valid comma-separated array
   * @param value String to validate
   * @returns True if valid, false otherwise
   */
  static isValidArrayString(value: string): boolean {
    if (!value || value.trim() === '') {
      return true; // Empty string is valid
    }

    // Check if string doesn't start or end with comma
    if (value.startsWith(',') || value.endsWith(',')) {
      return false;
    }

    // Check for consecutive commas
    if (value.includes(',,')) {
      return false;
    }

    return true;
  }
}
