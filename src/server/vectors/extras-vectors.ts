import fetch from "node-fetch";

/**
 * Gets the vector for the given text from SillyTavern-extras
 */
export async function getExtrasBatchVector(texts: string[], apiUrl: string, apiKey: string): Promise<number[][]> {
  return getExtrasVectorImpl(texts, apiUrl, apiKey) as Promise<number[][]>;
}

/**
 * Gets the vector for the given text from SillyTavern-extras
 */
export async function getExtrasVector(text: string, apiUrl: string, apiKey: string): Promise<number[]> {
  return getExtrasVectorImpl(text, apiUrl, apiKey) as Promise<number[]>;
}

/**
 * Gets the vector for the given text from SillyTavern-extras
 */
async function getExtrasVectorImpl(
  text: string | string[],
  apiUrl: string,
  apiKey: string,
): Promise<number[] | number[][]> {
  let url: URL;
  try {
    url = new URL(apiUrl);
    url.pathname = "/api/embeddings/compute";
  } catch (error) {
    console.error("Failed to set up Extras API call:", error);
    console.debug("Extras API URL given was:", apiUrl);
    throw error;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Include the Extras API key, if enabled
  if (apiKey && apiKey.length > 0) {
    Object.assign(headers, {
      Authorization: `Bearer ${apiKey}`,
    });
  }

  const response = await fetch(url, {
    method: "POST",
    headers: headers,
    body: JSON.stringify({
      text: text, // The backend accepts {string|string[]} for one or multiple text items, respectively.
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.warn("Extras request failed", response.statusText, text);
    throw new Error("Extras request failed");
  }

  const data = (await response.json()) as { embedding: number[] | number[][] };
  const vector = data.embedding; // `embedding`: number[] (one text item), or number[][] (multiple text items).

  return vector;
}
