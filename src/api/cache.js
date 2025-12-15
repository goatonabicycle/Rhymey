import { config } from "../config.js";
import {
  getLocalBrowserStorage,
  setLocalBrowserStorage,
} from "../utils/storage.js";

export async function getCachedWordInfo(word) {
  try {
    const { wordCache = {} } = await getLocalBrowserStorage(["wordCache"]);
    const cached = wordCache[word];

    if (cached && Date.now() - cached.timestamp < config.cacheExpiry) {
      return cached.results;
    }
    return null;
  } catch (error) {
    console.error("Error reading from cache:", error);
    return null;
  }
}

export async function cacheWordInfo(word, results) {
  try {
    const { wordCache = {} } = await getLocalBrowserStorage(["wordCache"]);

    wordCache[word] = {
      results,
      timestamp: Date.now(),
    };

    const entries = Object.entries(wordCache);
    if (entries.length > config.cacheSize) {
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toRemove = entries.slice(0, entries.length - config.cacheSize);
      for (const [key] of toRemove) {
        delete wordCache[key];
      }
    }

    await setLocalBrowserStorage({ wordCache });
  } catch (error) {
    console.error("Error writing to cache:", error);
  }
}
