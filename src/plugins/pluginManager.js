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
        await plugin[hookName](payload);
      }
    }
  }
}
