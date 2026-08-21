import process from "node:process";
import http from "node:http";
import https from "node:https";
import { ProxyAgent } from "proxy-agent";
import { isValidUrl, color } from "./util";

const LOG_HEADER = "[Request Proxy]";

export interface ProxySettings {
  /** Whether proxy is enabled. */
  enabled: boolean;
  /** Proxy URL. */
  url: string;
  /** List of URLs to bypass proxy. */
  bypass: string[];
  /** Enable HTTP/HTTPS keep-alive. */
  enableKeepAlive: boolean;
  /** Whether the private request filter is enabled. */
  privateRequestFilterEnabled: boolean;
}

/**
 * Initialize request proxy.
 */
export default function initRequestProxy({
  enabled,
  url,
  bypass,
  enableKeepAlive,
  privateRequestFilterEnabled,
}: ProxySettings) {
  try {
    // No proxy is enabled, so return
    if (!enabled) {
      return;
    }

    if (privateRequestFilterEnabled) {
      console.warn(
        color.yellow(LOG_HEADER),
        "Warning: Request proxy is enabled while private request filter is also enabled. Only URLs that BYPASS the request proxy will be checked.",
      );
      console.warn(
        color.yellow(LOG_HEADER),
        "To ensure all requests are properly filtered, disable the request proxy.",
      );
    }

    if (!url) {
      console.error(color.red(LOG_HEADER), "No proxy URL provided");
      return;
    }

    if (!isValidUrl(url)) {
      console.error(color.red(LOG_HEADER), "Invalid proxy URL provided");
      return;
    }

    // ProxyAgent uses proxy-from-env under the hood
    // Reference: https://github.com/Rob--W/proxy-from-env
    process.env.all_proxy = url;

    if (Array.isArray(bypass) && bypass.length > 0) {
      process.env.no_proxy = bypass.join(",");
    }

    const httpAgent = http.globalAgent;
    const httpsAgent = https.globalAgent;

    const proxyAgent = new ProxyAgent({ httpAgent, httpsAgent, keepAlive: enableKeepAlive });

    http.globalAgent = proxyAgent as any;
    https.globalAgent = proxyAgent as any;

    console.info();
    console.info(color.green(LOG_HEADER), "Proxy URL is used:", color.blue(url));
    console.info();
  } catch (error) {
    console.error(color.red(LOG_HEADER), "Failed to initialize request proxy:", error);
  }
}
