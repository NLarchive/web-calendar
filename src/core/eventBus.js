export class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(eventName, listener) {
    const existing = this.listeners.get(eventName) || [];
    this.listeners.set(eventName, [...existing, listener]);

    return () => {
      const current = this.listeners.get(eventName) || [];
      this.listeners.set(
        eventName,
        current.filter((entry) => entry !== listener),
      );
    };
  }

  emit(eventName, payload) {
    const listeners = this.listeners.get(eventName) || [];
    listeners.forEach((listener) => listener(payload));
  }
}
