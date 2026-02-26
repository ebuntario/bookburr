export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Node.js 25 exposes localStorage via experimental Web Storage, but
    // getItem/setItem fail without --localstorage-file. Polyfill it here
    // so any SSR'd client code that touches localStorage doesn't crash.
    try {
      const working = typeof localStorage?.getItem === "function";
      if (!working) {
        Object.defineProperty(globalThis, "localStorage", {
          value: {
            _data: {} as Record<string, string>,
            getItem(key: string) {
              return Object.prototype.hasOwnProperty.call(this._data, key)
                ? this._data[key]
                : null;
            },
            setItem(key: string, value: string) {
              this._data[key] = String(value);
            },
            removeItem(key: string) {
              delete this._data[key];
            },
            clear() {
              this._data = {};
            },
            get length() {
              return Object.keys(this._data).length;
            },
            key(index: number) {
              return Object.keys(this._data)[index] ?? null;
            },
          },
          configurable: true,
          writable: true,
        });
      }
    } catch {
      // localStorage is frozen or non-configurable — acceptable
    }
  }
}
