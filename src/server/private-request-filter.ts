import net from "node:net";
import tls from "node:tls";
import http from "node:http";
import https from "node:https";
import dns from "node:dns";
import ipMatch from "ip-matching";
import ipRegex from "ip-regex";
import { Agent } from "agent-base";
import { color } from "./util.ts";
import { filterValidIpPatterns } from "./express-common.ts";

const LOG_HEADER = "[Private Request Filter]";

const privateIpRanges: import("ip-matching").IPMatch[] = [
  // Loopback (IPv4)
  ipMatch.getMatch("127.0.0.0/8"),
  // Class A private network
  ipMatch.getMatch("10.0.0.0/8"),
  // Class B private network
  ipMatch.getMatch("172.16.0.0/12"),
  // Class C private network
  ipMatch.getMatch("192.168.0.0/16"),
  // Link-local address (IPv4)
  ipMatch.getMatch("169.254.0.0/16"),
  // Loopback (IPv6)
  ipMatch.getMatch("::1/128"),
  // Unique local address (IPv6)
  ipMatch.getMatch("fc00::/7"),
  // Link-local address (IPv6)
  ipMatch.getMatch("fe80::/10"),
];

interface PrivateRequestAgentOptions {
  privateAddressWhitelist?: string[];
  logBlocked?: boolean;
  logAllowed?: boolean;
  allowUnresolvedHosts?: boolean;
  enableKeepAlive?: boolean;
}

/**
 * Custom HTTP/HTTPS agent that blocks requests to private IP addresses unless they are explicitly allowed in the private address whitelist.
 * This is used to prevent Server-Side Request Forgery (SSRF) attacks by ensuring that the server cannot make requests to internal services or resources that are not intended to be exposed.
 * The agent checks if the target host resolves to a private IP address and blocks the request if it does, unless the IP address is included in the private address whitelist.
 * The private address whitelist can contain specific IP addresses or CIDR ranges that are allowed to be accessed even if they fall within private IP ranges.
 */
class PrivateRequestAgent extends Agent {
  /**
   * List of private IP addresses or CIDR ranges to allow
   */
  privateAddressWhitelist: readonly import("ip-matching").IPMatch[] = [];

  /**
   * Whether to log blocked requests to the console
   */
  logBlocked = true;

  /**
   * Whether to log allowed requests to the console
   */
  logAllowed = false;

  /**
   * Whether to allow requests to hosts that cannot be resolved
   */
  allowUnresolvedHosts = false;

  /**
   * Create a new PrivateRequestAgent instance.
   */
  constructor(
    options: PrivateRequestAgentOptions = {
      privateAddressWhitelist: [],
      logBlocked: true,
      logAllowed: false,
      allowUnresolvedHosts: false,
      enableKeepAlive: false,
    },
  ) {
    super({ keepAlive: options.enableKeepAlive });

    const logEntryWarning = (entry: string, message: string) =>
      `${color.red("Warning")}: Ignoring invalid private whitelist entry ${color.yellow(entry)} - ${message}`;
    const whitelistArray = Array.isArray(options.privateAddressWhitelist) ? options.privateAddressWhitelist : [];
    this.privateAddressWhitelist = Object.freeze(
      filterValidIpPatterns(whitelistArray, logEntryWarning).map((pattern) => ipMatch.getMatch(pattern)),
    );
    this.allowUnresolvedHosts = options.allowUnresolvedHosts ?? false;
    this.logBlocked = options.logBlocked ?? true;
    this.logAllowed = options.logAllowed ?? false;
  }

  /**
   * Check if the given address is a private IP address.
   */
  #isPrivateIp(address: string): boolean {
    return privateIpRanges.some((range) => range.matches(address));
  }

  /**
   * Check if the given address is allowed based on the private address whitelist.
   */
  #isAllowedPrivateAddress(address: string): boolean {
    // Permit the request if the private IP address is in the whitelist
    return this.privateAddressWhitelist.some((match) => match.matches(address));
  }

  /**
   * Connect method that checks if the target host resolves to a private IP address and blocks the request if it does.
   */
  async connect(
    _req: http.ClientRequest,
    options: import("agent-base").AgentConnectOpts,
  ): Promise<net.Socket | tls.TLSSocket> {
    /**
     * Raise an error and log it if necessary.
     */
    const raiseError = (message: string, log = true): never => {
      if (log) {
        console.error(color.red(LOG_HEADER), message);
      }
      throw new Error(message);
    };

    /**
     * Establish a connection to the target host using either TLS or a regular socket based on the options provided.
     */
    const connect = (hostOverride: string | null = null): net.Socket | tls.TLSSocket => {
      if (hostOverride) {
        options.host = hostOverride;
      }
      if (options.secureEndpoint) {
        return tls.connect(options);
      } else {
        return net.connect(options as any);
      }
    };

    /**
     * Validate the given IP address against the private address whitelist and connect if it's allowed.
     */
    const validateIpAddress = (ip: string): net.Socket | tls.TLSSocket => {
      // Not a private IP address, allow the request
      if (!this.#isPrivateIp(ip)) {
        return connect(ip);
      }

      // Private IP address, check if it's allowed in the whitelist
      if (this.#isAllowedPrivateAddress(ip)) {
        if (this.logAllowed) {
          console.info(color.green(LOG_HEADER), "Allowed request to private IP address:", color.blue(ip));
        }

        return connect(ip);
      }

      return raiseError(`Blocked request to private IP address: ${ip}`, this.logBlocked);
    };

    /**
     * Resolve the given host to an IP address using DNS lookup.
     */
    const lookupHost = async (host: string): Promise<string> => {
      try {
        return (await dns.promises.lookup(host)).address;
      } catch {
        return "";
      }
    };

    const host = options.host;

    if (!host) {
      return raiseError("No host specified in request options", true);
    }

    const isIp = ipRegex.v4({ exact: true }).test(host) || ipRegex.v6({ exact: true }).test(host);

    if (isIp) {
      return validateIpAddress(host);
    } else {
      const address = await lookupHost(host);
      if (!address) {
        if (this.allowUnresolvedHosts) {
          return connect();
        } else {
          return raiseError(
            `Unable to resolve host: ${host}. Set privateAddressWhitelist.allowUnresolvedHosts to true to bypass this check.`,
            true,
          );
        }
      }

      return validateIpAddress(address);
    }
  }
}

interface InitPrivateRequestFilterOptions {
  listen: boolean;
  enabled: boolean;
  privateAddressWhitelist: string[];
  logBlocked: boolean;
  logAllowed: boolean;
  allowUnresolvedHosts: boolean;
  enableKeepAlive: boolean;
}

/**
 * Initialize the private request filter by replacing the global HTTP and HTTPS agents with an instance of PrivateRequestAgent.
 */
export default function initPrivateRequestFilter({
  listen,
  enabled,
  privateAddressWhitelist,
  logBlocked,
  logAllowed,
  allowUnresolvedHosts,
  enableKeepAlive,
}: InitPrivateRequestFilterOptions): void {
  if (!enabled) {
    if (listen) {
      console.warn();
      console.warn(
        color.yellow(
          "Warning: listen is enabled but private request filter is disabled. This may expose your server to SSRF attacks.",
        ),
      );
      console.warn(
        color.blue(
          "To enable, provide trusted addresses in privateAddressWhitelist.allowedRanges and set privateAddressWhitelist.enabled to true in config.yaml and restart the server.",
        ),
      );
    }
    return;
  }

  const agent = new PrivateRequestAgent({
    privateAddressWhitelist,
    logBlocked,
    logAllowed,
    allowUnresolvedHosts,
    enableKeepAlive,
  });

  http.globalAgent = agent as any;
  https.globalAgent = agent as any;

  console.info();
  console.info(color.green(LOG_HEADER), "Enabled");
  if (agent.privateAddressWhitelist.length > 0) {
    console.info(
      color.green(LOG_HEADER),
      "Allowed private addresses:",
      color.blue(agent.privateAddressWhitelist.join(", ")),
    );
  }
  console.info();
}
