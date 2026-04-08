const cache = new Map();

export function getCache(key) {
  const item = cache.get(key);
  if (!item) return null;

  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }

  return item.value;
}

export function setCache(key, value, ttl = 60000) {
  cache.set(key, {
    value,
    expiry: Date.now() + ttl
  });
}