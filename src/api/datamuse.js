import { config } from "../config.js";
import { cacheWordInfo, getCachedWordInfo } from "./cache.js";

export async function fetchWordInfo(word) {
  const cachedResult = await getCachedWordInfo(word);
  if (cachedResult) {
    return cachedResult;
  }

  const [rhymes, nearRhymes, similar, related, definitions] = await Promise.all([
    fetch(`${config.apiBaseUrl}?rel_rhy=${word}`).then((r) => r.json()),
    fetch(`${config.apiBaseUrl}?rel_nry=${word}`).then((r) => r.json()),
    fetch(`${config.apiBaseUrl}?ml=${word}`).then((r) => r.json()),
    fetch(`${config.apiBaseUrl}?rel_trg=${word}`).then((r) => r.json()),
    fetch(`${config.apiBaseUrl}?sp=${word}&md=d`).then((r) => r.json()),
  ]);

  const results = { rhymes, nearRhymes, similar, related, definitions };
  await cacheWordInfo(word, results);
  return results;
}
