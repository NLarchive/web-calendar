import { BaseConnector } from './baseConnector.js';

export class McpTaskConnector extends BaseConnector {
  constructor() {
    super('mcp-task-connector');
  }

  async pull() {
    return [];
  }

  async push(payload) {
    return { ok: true, items: Array.isArray(payload) ? payload.length : 1 };
  }
}
