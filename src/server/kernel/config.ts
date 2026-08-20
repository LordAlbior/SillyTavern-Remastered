export interface KernelConfig {
  root: string;
}

export async function loadConfig(): Promise<KernelConfig> {
  return { root: process.cwd() };
}
