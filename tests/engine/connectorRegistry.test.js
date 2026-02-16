import { describe, expect, it } from 'vitest';
import { ConnectorRegistry, createDefaultConnectorRegistry } from '../../src/connectors/connectorRegistry.js';
import { BaseConnector } from '../../src/connectors/baseConnector.js';

describe('connectorRegistry', () => {
  it('registers and retrieves connectors', () => {
    const registry = new ConnectorRegistry();
    const custom = new BaseConnector('custom');

    registry.register(custom);

    expect(registry.get('custom')).toBe(custom);
    expect(registry.list()).toContain('custom');
  });

  it('builds default connectors for integrations', () => {
    const registry = createDefaultConnectorRegistry();
    const names = registry.list();

    expect(names).toContain('mcp-task-connector');
    expect(names).toContain('github-task-manager-connector');
  });
});
