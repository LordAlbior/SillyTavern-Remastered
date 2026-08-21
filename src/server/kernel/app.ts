import { App } from "./types";
import { loadConfig } from "./config";
import { initBus } from "./events";
import { loadPlugins } from "./plugins/loader";

export async function createKernel(): Promise<App> {
  const config = await loadConfig();
  const bus = initBus(config);
  const plugins = await loadPlugins(config);
  return { config, bus, plugins };
}
