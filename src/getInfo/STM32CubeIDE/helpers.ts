/**
 * Finds a deeply nested key value pair inside an object or array and returns the parent
 * @param object The object to search in
 * @param key key to search for
 * @param value value to search for
 * @returns The parent when it has found the key/value pair, otherwise undefined
 */
export function deepFind(object: any, key: string, value: string): undefined | any {
  // the zero index array is included as the XML conversion 
  // can have an array with length 1 with the actual value inside.
  if (object.hasOwnProperty(key) && object[key] === value || object?.[key]?.[0] === value) {
    return object;
  }

  for (let objectKey of Object.keys(object)) {
    const typeOfObject = typeof object[objectKey];
    if (typeOfObject === "object") {
      let output: any = deepFind(object[objectKey], key, value);
      if (output !== undefined) { return output; }
    }
  }
  return undefined;
}
