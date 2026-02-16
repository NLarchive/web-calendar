export class PluginManager {
  constructor() {
    this.plugins = [];
  }

  register(plugin) {
    this.plugins.push(plugin);
  }

  async emit(hookName, payload) {
    for (const plugin of this.plugins) {
      if (typeof plugin[hookName] === 'function') {
        try {
          await plugin[hookName](payload);
        } catch (err) {
          console.error(`Plugin hook "${hookName}" failed:`, err);
        }
      }
    }
  }
}
