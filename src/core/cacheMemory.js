export class CacheMemory {
  constructor() {
    this.memory = new Map();
  }

  set(key, value) {
    this.memory.set(key, structuredClone(value));
  }

  get(key) {
    const value = this.memory.get(key);
    return value ? structuredClone(value) : null;
  }

  clear() {
    this.memory.clear();
  }
}
