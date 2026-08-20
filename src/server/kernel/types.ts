export interface App {
  config: { root: string };
  bus: EventBus;
  plugins: Plugin[];
}

export interface Plugin {
  name: string;
  init?(): void | Promise<void>;
}
