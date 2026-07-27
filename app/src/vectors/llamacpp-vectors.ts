import fetch from 'node-fetch';
import urlJoin from 'url-join';
import { setAdditionalHeadersByType } from '../additional-headers.js';
import { TEXTGEN_TYPES } from '../constants.js';
import { trimV1 } from '../util.js';
import type { UserDirectoryList } from '../users.js';

interface LlamaCppEmbeddingData {
    index: number;
    embedding: number[];
}

interface LlamaCppResponse {
    data?: LlamaCppEmbeddingData[];
}

/**
 * Gets the vector for the given text from LlamaCpp
 */
export async function getLlamaCppBatchVector(texts: string[], apiUrl: string, directories: UserDirectoryList): Promise<number[][]> {
    const url = new URL(urlJoin(trimV1(apiUrl), '/v1/embeddings'));

    const headers: Record<string, string> = {};
    setAdditionalHeadersByType(headers, TEXTGEN_TYPES.LLAMACPP, apiUrl, directories);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
        body: JSON.stringify({ input: texts }),
    });

    if (!response.ok) {
        const responseText = await response.text();
        throw new Error(`LlamaCpp: Failed to get vector for text: ${response.statusText} ${responseText}`);
    }

    const data = await response.json() as LlamaCppResponse;

    if (!Array.isArray(data?.data)) {
        throw new Error('API response was not an array');
    }

    // Sort data by x.index to ensure the order is correct
    data.data.sort((a: LlamaCppEmbeddingData, b: LlamaCppEmbeddingData) => a.index - b.index);

    const vectors = data.data.map((x: LlamaCppEmbeddingData) => x.embedding);
    return vectors;
}

/**
 * Gets the vector for the given text from LlamaCpp
 */
export async function getLlamaCppVector(text: string, apiUrl: string, directories: UserDirectoryList): Promise<number[]> {
    const vectors = await getLlamaCppBatchVector([text], apiUrl, directories);
    return vectors[0];
}
