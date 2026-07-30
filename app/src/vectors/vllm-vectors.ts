import fetch from 'node-fetch';
import urlJoin from 'url-join';
import { setAdditionalHeadersByType } from '../additional-headers.ts';
import { TEXTGEN_TYPES } from '../constants.ts';
import { trimV1 } from '../util.ts';
import type { UserDirectoryList } from '../users.ts';

interface VllmEmbeddingData {
    index: number;
    embedding: number[];
}

interface VllmResponse {
    data?: VllmEmbeddingData[];
}

/**
 * Gets the vector for the given text from VLLM
 */
export async function getVllmBatchVector(texts: string[], apiUrl: string, model: string, directories: UserDirectoryList): Promise<number[][]> {
    const url = new URL(urlJoin(trimV1(apiUrl), '/v1/embeddings'));

    const headers: Record<string, string> = {};
    setAdditionalHeadersByType(headers, TEXTGEN_TYPES.VLLM, apiUrl, directories);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
        body: JSON.stringify({ input: texts, model }),
    });

    if (!response.ok) {
        const responseText = await response.text();
        throw new Error(`VLLM: Failed to get vector for text: ${response.statusText} ${responseText}`);
    }

    const data = await response.json() as VllmResponse;

    if (!Array.isArray(data?.data)) {
        throw new Error('API response was not an array');
    }

    // Sort data by x.index to ensure the order is correct
    data.data.sort((a: VllmEmbeddingData, b: VllmEmbeddingData) => a.index - b.index);

    const vectors = data.data.map((x: VllmEmbeddingData) => x.embedding);
    return vectors;
}

/**
 * Gets the vector for the given text from VLLM
 */
export async function getVllmVector(text: string, apiUrl: string, model: string, directories: UserDirectoryList): Promise<number[]> {
    const vectors = await getVllmBatchVector([text], apiUrl, model, directories);
    return vectors[0];
}
