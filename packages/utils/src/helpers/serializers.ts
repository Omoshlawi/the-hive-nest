type NestedObject = { [key: string]: any };
type FlattenedArray = (string | string)[]; // Changed to string | string since all values will be stringified

export function flattenObject(
  obj: NestedObject,
  parentKey: string = '',
): FlattenedArray {
  const result: FlattenedArray = [];

  Object.entries(obj).forEach(([key, value]) => {
    const accessor = parentKey ? `${parentKey}.${key}` : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result.push(...flattenObject(value, accessor));
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        const arrayAccessor = `${accessor}.${index}`;
        if (typeof item === 'object' && item !== null) {
          result.push(...flattenObject(item, arrayAccessor));
        } else {
          // Stringify primitive values to preserve type
          result.push(arrayAccessor, JSON.stringify(item));
        }
      });
    } else {
      // Stringify primitive values to preserve type
      result.push(accessor, JSON.stringify(value));
    }
  });

  return result;
}

type UnflattenedObject = { [key: string]: any };

export function unflattenArray(arr: FlattenedArray): UnflattenedObject {
  const result: UnflattenedObject = {};

  for (let i = 0; i < arr.length; i += 2) {
    const accessor = arr[i] as string;
    const stringifiedValue = arr[i + 1] as string;

    // Parse stringified value to restore its original type
    let value;
    try {
      value = JSON.parse(stringifiedValue);
    } catch (e) {
      // If parsing fails, use the original string value
      value = stringifiedValue;
    }

    const keys = accessor.split('.');
    let current = result;

    keys.forEach((key, index) => {
      if (index === keys.length - 1) {
        current[key] = value; // Assign the value at the deepest level
      } else {
        current[key] =
          current[key] || (isNaN(parseInt(keys[index + 1] || '')) ? {} : []); // Create an object or array
        current = current[key];
      }
    });
  }

  return result;
}
