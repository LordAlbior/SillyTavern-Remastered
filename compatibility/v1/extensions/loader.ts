export type ExtensionModule = Record<string, unknown>;

export async function loadExtension(_path: string): Promise<ExtensionModule> {
  return {};
}
