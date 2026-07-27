import { TEXTGEN_TYPES, OPENROUTER_HEADERS, FEATHERLESS_HEADERS } from './constants.js';
import { SECRET_KEYS, readSecret } from './endpoints/secrets.js';
import { getConfigValue } from './util.js';
import type { UserDirectoryList } from './users.js';

/**
 * Gets the headers for the Mancer API.
 */
function getMancerHeaders(directories: UserDirectoryList, secretId: string | null = null): Record<string, string> {
    const apiKey = readSecret(directories, SECRET_KEYS.MANCER, secretId);

    return apiKey ? ({
        'X-API-KEY': apiKey,
        'Authorization': `Bearer ${apiKey}`,
    }) : {};
}

/**
 * Gets the headers for the TogetherAI API.
 */
function getTogetherAIHeaders(directories: UserDirectoryList, secretId: string | null = null): Record<string, string> {
    const apiKey = readSecret(directories, SECRET_KEYS.TOGETHERAI, secretId);

    return apiKey ? ({
        'Authorization': `Bearer ${apiKey}`,
    }) : {};
}

/**
 * Gets the headers for the InfermaticAI API.
 */
function getInfermaticAIHeaders(directories: UserDirectoryList, secretId: string | null = null): Record<string, string> {
    const apiKey = readSecret(directories, SECRET_KEYS.INFERMATICAI, secretId);

    return apiKey ? ({
        'Authorization': `Bearer ${apiKey}`,
    }) : {};
}

/**
 * Gets the headers for the DreamGen API.
 */
function getDreamGenHeaders(directories: UserDirectoryList, secretId: string | null = null): Record<string, string> {
    const apiKey = readSecret(directories, SECRET_KEYS.DREAMGEN, secretId);

    return apiKey ? ({
        'Authorization': `Bearer ${apiKey}`,
    }) : {};
}

/**
 * Gets the headers for the OpenRouter API.
 */
function getOpenRouterHeaders(directories: UserDirectoryList, secretId: string | null = null): Record<string, string> {
    const apiKey = readSecret(directories, SECRET_KEYS.OPENROUTER, secretId);
    const baseHeaders = { ...OPENROUTER_HEADERS };

    return apiKey ? Object.assign(baseHeaders, { 'Authorization': `Bearer ${apiKey}` }) : baseHeaders;
}

/**
 * Gets the headers for the vLLM API.
 */
function getVllmHeaders(directories: UserDirectoryList, secretId: string | null = null): Record<string, string> {
    const apiKey = readSecret(directories, SECRET_KEYS.VLLM, secretId);

    return apiKey ? ({
        'Authorization': `Bearer ${apiKey}`,
    }) : {};
}

/**
 * Gets the headers for the Aphrodite API.
 */
function getAphroditeHeaders(directories: UserDirectoryList, secretId: string | null = null): Record<string, string> {
    const apiKey = readSecret(directories, SECRET_KEYS.APHRODITE, secretId);

    return apiKey ? ({
        'X-API-KEY': apiKey,
        'Authorization': `Bearer ${apiKey}`,
    }) : {};
}

/**
 * Gets the headers for the Tabby API.
 */
function getTabbyHeaders(directories: UserDirectoryList, secretId: string | null = null): Record<string, string> {
    const apiKey = readSecret(directories, SECRET_KEYS.TABBY, secretId);

    return apiKey ? ({
        'x-api-key': apiKey,
        'Authorization': `Bearer ${apiKey}`,
    }) : {};
}

/**
 * Gets the headers for the LlamaCPP API.
 */
function getLlamaCppHeaders(directories: UserDirectoryList, secretId: string | null = null): Record<string, string> {
    const apiKey = readSecret(directories, SECRET_KEYS.LLAMACPP, secretId);

    return apiKey ? ({
        'Authorization': `Bearer ${apiKey}`,
    }) : {};
}

/**
 * Gets the headers for the Ooba API.
 */
function getOobaHeaders(directories: UserDirectoryList, secretId: string | null = null): Record<string, string> {
    const apiKey = readSecret(directories, SECRET_KEYS.OOBA, secretId);

    return apiKey ? ({
        'Authorization': `Bearer ${apiKey}`,
    }) : {};
}

/**
 * Gets the headers for the KoboldCpp API.
 */
function getKoboldCppHeaders(directories: UserDirectoryList, secretId: string | null = null): Record<string, string> {
    const apiKey = readSecret(directories, SECRET_KEYS.KOBOLDCPP, secretId);

    return apiKey ? ({
        'Authorization': `Bearer ${apiKey}`,
    }) : {};
}

/**
 * Gets the headers for the Featherless API.
 */
function getFeatherlessHeaders(directories: UserDirectoryList, secretId: string | null = null): Record<string, string> {
    const apiKey = readSecret(directories, SECRET_KEYS.FEATHERLESS, secretId);
    const baseHeaders = { ...FEATHERLESS_HEADERS };

    return apiKey ? Object.assign(baseHeaders, { 'Authorization': `Bearer ${apiKey}` }) : baseHeaders;
}

/**
 * Gets the headers for the HuggingFace API.
 */
function getHuggingFaceHeaders(directories: UserDirectoryList, secretId: string | null = null): Record<string, string> {
    const apiKey = readSecret(directories, SECRET_KEYS.HUGGINGFACE, secretId);

    return apiKey ? ({
        'Authorization': `Bearer ${apiKey}`,
    }) : {};
}

/**
 * Gets the headers for the Generic text completion API.
 */
function getGenericHeaders(directories: UserDirectoryList, secretId: string | null = null): Record<string, string> {
    const apiKey = readSecret(directories, SECRET_KEYS.GENERIC, secretId);

    return apiKey ? ({
        'Authorization': `Bearer ${apiKey}`,
    }) : {};
}

interface RequestOverride {
    hosts?: string[];
    headers?: Record<string, string>;
}

export function getOverrideHeaders(urlHost: string): Record<string, string> {
    const requestOverrides = getConfigValue('requestOverrides', []) as RequestOverride[];
    const overrideHeaders = requestOverrides?.find((e) => e.hosts?.includes(urlHost))?.headers;
    if (overrideHeaders && urlHost) {
        return overrideHeaders;
    } else {
        return {};
    }
}

interface RequestArgs {
    headers: Record<string, string>;
    [key: string]: unknown;
}

/**
 * Sets additional headers for the request.
 */
export function setAdditionalHeaders(request: Express.Request, args: RequestArgs, server: string | null): void {
    const req = request as any;
    setAdditionalHeadersByType(args.headers, req.body.api_type, server, req.user.directories, req.body.secret_id);
}

/**
 *
 */
export function setAdditionalHeadersByType(requestHeaders: Record<string, string>, type: string, server: string | null, directories: UserDirectoryList, secretId: string | null = null): void {
    const headerGetters: Record<string, (directories: UserDirectoryList, secretId: string | null) => Record<string, string>> = {
        [TEXTGEN_TYPES.MANCER]: getMancerHeaders,
        [TEXTGEN_TYPES.VLLM]: getVllmHeaders,
        [TEXTGEN_TYPES.APHRODITE]: getAphroditeHeaders,
        [TEXTGEN_TYPES.TABBY]: getTabbyHeaders,
        [TEXTGEN_TYPES.TOGETHERAI]: getTogetherAIHeaders,
        [TEXTGEN_TYPES.OOBA]: getOobaHeaders,
        [TEXTGEN_TYPES.INFERMATICAI]: getInfermaticAIHeaders,
        [TEXTGEN_TYPES.DREAMGEN]: getDreamGenHeaders,
        [TEXTGEN_TYPES.OPENROUTER]: getOpenRouterHeaders,
        [TEXTGEN_TYPES.KOBOLDCPP]: getKoboldCppHeaders,
        [TEXTGEN_TYPES.LLAMACPP]: getLlamaCppHeaders,
        [TEXTGEN_TYPES.FEATHERLESS]: getFeatherlessHeaders,
        [TEXTGEN_TYPES.HUGGINGFACE]: getHuggingFaceHeaders,
        [TEXTGEN_TYPES.GENERIC]: getGenericHeaders,
    };

    const getHeaders = headerGetters[type];
    const headers = getHeaders ? getHeaders(directories, secretId) : {};

    if (typeof server === 'string' && server.length > 0) {
        try {
            const url = new URL(server);
            const overrideHeaders = getOverrideHeaders(url.host);

            if (overrideHeaders && Object.keys(overrideHeaders).length > 0) {
                Object.assign(headers, overrideHeaders);
            }
        } catch {
            // Do nothing
        }
    }

    Object.assign(requestHeaders, headers);
}
