import EventEmitter from 'node:events';
import process from 'node:process';

import type { ServerEventMap } from '../index.ts';

/** The default event source. */
export const serverEvents = new EventEmitter<ServerEventMap>();
process.serverEvents = serverEvents;
export default serverEvents;

/**
 * Names of events emitted on `serverEvents`.
 */
export const EVENT_NAMES = Object.freeze({
    /**
     * Emitted when the server has started.
     */
    SERVER_STARTED: 'server-started',
} as const);
