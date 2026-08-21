import express from "express";

import { getPipeline } from "../transformers";

const TASK = "text-classification";

export const router = express.Router();

/**
 * Cache for classification results
 */
const cacheObject = new Map<string, object>();

router.post("/labels", async (req, res) => {
  try {
    const pipe = await getPipeline(TASK);
    const result = Object.keys(pipe.model.config.label2id);
    return res.json({ labels: result });
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});

router.post("/", async (req, res) => {
  try {
    const { text } = req.body;

    /**
     * Get classification result for a given text
     */
    async function getResult(text: string): Promise<object> {
      if (cacheObject.has(text)) {
        return cacheObject.get(text)!;
      } else {
        const pipe = await getPipeline(TASK);
        const result = (await pipe(text, { topk: 5 })) as Array<{ score: number; [key: string]: unknown }>;
        result.sort((a, b) => b.score - a.score);
        cacheObject.set(text, result);
        return result;
      }
    }

    console.debug("Classify input:", text);
    const result = await getResult(text);
    console.debug("Classify output:", result);

    return res.json({ classification: result });
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});
