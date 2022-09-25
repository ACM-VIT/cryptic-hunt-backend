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

  async get(key: string, storeFunction: () => Promise<any>) {
    const value = this.cache.get(key);
    if (value) {
      // console.log("In Cache");
      return value;
    }

    const result = await storeFunction();
    this.cache.set(key, result);
    return result;
  }

  del(keys: string) {
    return this.cache.del(keys);
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

  keys() {
    return this.cache.keys();
  }
}

const ttl = 60 * 60 * 1; // cache for 1 Hour
const cache = new Cache(ttl); // Create a new cache service instance

export default cache;
