export class BaseConnector {
  constructor(name) {
    this.name = name;
  }

  async connect() {
    return { connected: true, connector: this.name };
  }

  async pull() {
    return [];
  }

  async push(_payload) {
    return { ok: true };
  }
}
