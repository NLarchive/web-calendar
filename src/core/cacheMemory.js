export class CacheMemory {
  constructor() {
    this.memory = new Map();
  }

  set(key, value) {
    this.memory.set(key, structuredClone(value));
  }

  get(key) {
    if (!this.memory.has(key)) return null;
    return structuredClone(this.memory.get(key));
  }

  clear() {
    this.memory.clear();
  }
}
