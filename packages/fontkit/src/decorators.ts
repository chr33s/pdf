// @ts-nocheck

/**
 * This decorator caches the results of a getter or method such that
 * the results are lazily computed once, and then cached.
 * @private
 */
export function cache(
  target: object,
  key: PropertyKey,
  descriptor: PropertyDescriptor,
) {
  if (!descriptor) {
    return target;
  }

  if (descriptor.get) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const originalGet = descriptor.get;
    const callOriginalGet = (self: Record<PropertyKey, unknown>) =>
      Reflect.apply(originalGet!, self, []);
    descriptor.get = function (this: Record<PropertyKey, unknown>) {
      const value = callOriginalGet(this);
      Object.defineProperty(this, key, { value });
      return value;
    };
  } else if (typeof descriptor.value === "function") {
    let fn: (...args: unknown[]) => unknown = descriptor.value;

    return {
      get(this: Record<PropertyKey, unknown>) {
        let cache = new Map();
        function memoized(
          this: Record<PropertyKey, unknown>,
          ...args: unknown[]
        ) {
          let key = args.length > 0 ? args[0] : "value";
          if (cache.has(key)) {
            return cache.get(key);
          }

          let result = fn.apply(this, args);
          cache.set(key, result);
          return result;
        }

        Object.defineProperty(this, key, { value: memoized });
        return memoized;
      },
    };
  }
}
