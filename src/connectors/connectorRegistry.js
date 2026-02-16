import { McpTaskConnector } from './mcpTaskConnector.js';
import { GitHubTaskManagerConnector } from './githubTaskManagerConnector.js';

export class ConnectorRegistry {
  constructor() {
    this.connectors = new Map();
  }

  register(connector) {
    this.connectors.set(connector.name, connector);
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
  return registry;
}
