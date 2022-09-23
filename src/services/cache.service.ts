import NodeCache from "node-cache";

class Cache {
  cache: any;
  constructor(ttlSeconds: number) {
    this.cache = new NodeCache({
      stdTTL: ttlSeconds,
      checkperiod: ttlSeconds,
      useClones: false,
    });
  }

  get(key: any, storeFunction: () => any) {
    const value = this.cache.get(key);
    if (value) {
      console.log("In Cache");
      return Promise.resolve(value);
    }

    const result = storeFunction();
    this.cache.set(key, result);
    return result;
  }

  del(keys: any) {
    this.cache.del(keys);
  }

  delStartWith(startStr = "") {
    if (!startStr) {
      return;
    }

    const keys = this.cache.keys();
    for (const key of keys) {
      if (key.indexOf(startStr) === 0) {
        this.del(key);
      }
    }
  }

  flush() {
    this.cache.flushAll();
  }
}

const ttl = 60 * 60 * 1; // cache for 1 Hour
const cache = new Cache(ttl); // Create a new cache service instance

export default cache;
