export class CacheMemory {
  constructor(maxSize = 50) {
    this.memory = new Map();
    this.maxSize = maxSize;
  }

  set(key, value) {
    if (this.memory.has(key)) this.memory.delete(key);
    this.memory.set(key, structuredClone(value));
    if (this.memory.size > this.maxSize) {
      const oldest = this.memory.keys().next().value;
      this.memory.delete(oldest);
    }
  }

  get(key) {
    if (!this.memory.has(key)) return null;
    // Move to end (most recently used)
    const value = this.memory.get(key);
    this.memory.delete(key);
    this.memory.set(key, value);
    return structuredClone(value);
  }

  clear() {
    this.memory.clear();
  }
}
