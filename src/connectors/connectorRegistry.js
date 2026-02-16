import { McpTaskConnector } from './mcpTaskConnector.js';
import { GitHubTaskManagerConnector } from './githubTaskManagerConnector.js';
import { CalendarSyncConnector } from './calendarSyncConnector.js';

export class ConnectorRegistry {
  constructor() {
    this.connectors = new Map();
  }

  register(connector) {
    if (!connector || typeof connector.name !== 'string' || !connector.name.trim()) {
      throw new Error('Connector must define a non-empty name');
    }
    this.connectors.set(connector.name, connector);
    return connector;
  }

  get(name) {
    return this.connectors.get(name);
  }

  list() {
    return [...this.connectors.keys()];
  }
}

export function createDefaultConnectorRegistry() {
  const registry = new ConnectorRegistry();
  registry.register(new McpTaskConnector());
  registry.register(new GitHubTaskManagerConnector());
  registry.register(new CalendarSyncConnector());
  return registry;
}
