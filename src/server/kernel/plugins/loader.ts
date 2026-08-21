import type { Plugin } from "../types";

export async function loadPlugins(_config: { root: string }): Promise<Plugin[]> {
  return [];
}
