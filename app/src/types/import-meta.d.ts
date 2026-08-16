// @types/node v18 doesn't include import.meta.dirname (available in Node 21+ / @types/node 20+)
interface ImportMeta {
  readonly dirname: string;
  readonly filename: string;
}
