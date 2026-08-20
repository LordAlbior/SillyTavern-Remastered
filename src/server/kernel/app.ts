import { App } from "./types.js";
import { loadConfig } from "./config.js";
import { initBus } from "./events.js";
import { loadPlugins } from "./plugins/loader.js";

export async function createKernel(): Promise<App> {
  const config = await loadConfig();
  const bus = initBus(config);
  const plugins = await loadPlugins(config);
  return { config, bus, plugins };
}
