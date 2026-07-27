declare module '@agnai/sentencepiece-js' {
  export class SentencePieceProcessor {
    load(path: string): Promise<void>;
    encode(text: string): number[];
    decode(ids: number[]): string;
  }
}

declare module '@agnai/web-tokenizers' {
  export class Tokenizer {
    encode(text: string): number[];
    decode(ids: number[]): string;
  }
  
  export function loadTokenizer(path: string): Promise<Tokenizer>;
}

declare module '@iconfu/svg-inject' {
  export function SVGInject(elements: HTMLElement | HTMLElement[], options?: any): void;
}

declare module '@mozilla/readability' {
  export class Readability {
    constructor(doc: Document, options?: any);
    parse(): {
      title: string;
      content: string;
      textContent: string;
      length: number;
      excerpt: string;
      byline: string;
      dir: string;
      siteName: string;
    } | null;
  }
}

declare module '@zeldafan0225/ai_horde' {
  export class AIHorde {
    constructor(options?: any);
    getModels(): Promise<any>;
    getGenerations(id: string): Promise<any>;
    requestGeneration(options: any): Promise<any>;
  }
}

declare module 'agent-base' {
  import { Agent } from 'http';
  
  export class Agent extends Agent {
    constructor(options?: any);
    connect(req: any, options: any): Promise<any>;
  }
  
  export interface AgentConnectOpts {
    host?: string;
    port?: number;
    secureEndpoint?: boolean;
  }
}

declare module 'bing-translate-api' {
  export function translate(options: {
    text: string;
    from?: string;
    to: string;
  }): Promise<{
    translation: string;
    from: string;
    to: string;
  }>;
}

declare module 'csrf-sync' {
  import { RequestHandler } from 'express';
  
  export function csrfSync(options?: any): RequestHandler;
}

declare module 'droll' {
  export function parse(roll: string): {
    roll(): number;
    min: number;
    max: number;
    average: number;
  };
}

declare module 'fflate' {
  export function zip(data: Record<string, Uint8Array>, options?: any): Uint8Array;
  export function unzip(data: Uint8Array): Record<string, Uint8Array>;
  export function gzip(data: Uint8Array, options?: any): Uint8Array;
  export function gunzip(data: Uint8Array): Uint8Array;
  export function deflate(data: Uint8Array, options?: any): Uint8Array;
  export function inflate(data: Uint8Array): Uint8Array;
}

declare module 'google-translate-api-x' {
  export default function translate(text: string, options?: {
    from?: string;
    to?: string;
  }): Promise<{
    text: string;
    from: {
      language: {
        iso: string;
        name: string;
        didYouMean: boolean;
      };
    };
  }>;
}

declare module 'host-validation-middleware' {
  import { RequestHandler } from 'express';
  
  export default function hostValidation(options: {
    hosts: string[];
  }): RequestHandler;
}

declare module 'html-entities' {
  export function decode(text: string): string;
  export function encode(text: string): string;
}

declare module 'ip-matching' {
  export interface IPMatch {
    matches(ip: string): boolean;
  }
  
  export function getMatch(pattern: string): IPMatch;
  export function isValid(pattern: string): boolean;
}

declare module 'ip-regex' {
  export function v4(options?: { exact?: boolean }): RegExp;
  export function v6(options?: { exact?: boolean }): RegExp;
}

declare module 'isomorphic-git' {
  export function clone(options: any): Promise<void>;
  export function pull(options: any): Promise<void>;
  export function push(options: any): Promise<void>;
  export function log(options: any): Promise<any[]>;
  export function status(options: any): Promise<string>;
  export function add(options: any): Promise<void>;
  export function commit(options: any): Promise<string>;
}

declare module 'js-sha256' {
  export function sha256(message: string | Uint8Array): string;
  export function sha256ArrayBuffer(buffer: ArrayBuffer): string;
}

declare module 'morphdom' {
  export default function morphdom(
    fromNode: Node,
    toNode: Node | string,
    options?: any
  ): void;
}

declare module 'proxy-agent' {
  import { Agent } from 'http';
  
  export class ProxyAgent extends Agent {
    constructor(options?: any);
  }
}

declare module 'rate-limiter-flexible' {
  export class RateLimiterMemory {
    constructor(options: {
      points: number;
      duration: number;
    });
    
    consume(key: string, points?: number): Promise<RateLimiterRes>;
    get(key: string): Promise<RateLimiterRes | null>;
    delete(key: string): Promise<boolean>;
    penalty(key: string, points?: number): Promise<RateLimiterRes>;
    reward(key: string, points?: number): Promise<RateLimiterRes>;
    block(key: string, secDuration: number): Promise<RateLimiterRes>;
    
    points: number;
  }
  
  export class RateLimiterRes {
    remainingPoints: number;
    msBeforeNext: number;
    consumedPoints: number;
    isFirstInDuration: boolean;
  }
}

declare module 'sillytavern-transformers' {
  export function pipeline(task: string, model?: string, options?: any): Promise<any>;
  export function env(name: string): string | undefined;
}

declare module 'slidetoggle' {
  export default function slideToggle(element: HTMLElement, duration?: number): void;
}

declare module 'tiktoken' {
  export function getEncoding(encoding: string): {
    encode(text: string): number[];
    decode(tokens: number[]): string;
  };
}

declare module 'vectra' {
  export class LocalIndex {
    constructor(path: string);
    
    beginUpdate(): Promise<void>;
    endUpdate(): Promise<void>;
    insertItem(item: { vector: number[]; metadata?: any }): Promise<void>;
    queryItems(vector: number[], k: number): Promise<{
      item: { vector: number[]; metadata?: any };
      score: number;
    }[]>;
  }
}

declare module 'wavefile' {
  export class WaveFile {
    constructor(buffer?: Buffer);
    fromScratch(channels: number, sampleRate: number, bitDepth: number, samples: any): void;
    fromBuffer(buffer: Buffer): void;
    toBuffer(): Buffer;
    data: any;
    format: any;
  }
}

declare module 'bowser' {
  export function parse(userAgent: string): {
    browser: {
      name: string;
      version: string;
    };
    os: {
      name: string;
      version: string;
    };
    platform: {
      type: string;
      vendor: string;
    };
    engine: {
      name: string;
      version: string;
    };
  };
}

declare module 'droll' {
  export function parse(roll: string): {
    roll(): number;
    min: number;
    max: number;
    average: number;
  };
}

declare module 'env-paths' {
  export default function envPaths(name: string, options?: {
    suffix?: string;
  }): {
    data: string;
    config: string;
    cache: string;
    log: string;
    temp: string;
  };
}

declare module 'diff-match-patch' {
  export class diff_match_patch {
    diff_main(text1: string, text2: string): Array<[number, string]>;
    diff_cleanupSemantic(diffs: Array<[number, string]>): void;
    diff_cleanupEfficiency(diffs: Array<[number, string]>): void;
    patch_make(text1: string, text2: string): any[];
    patch_apply(patches: any[], text: string): [string, boolean[]];
  }
}

declare module 'host-validation-middleware' {
  import { RequestHandler } from 'express';
  
  export default function hostValidation(options: {
    hosts: string[];
  }): RequestHandler;
}
