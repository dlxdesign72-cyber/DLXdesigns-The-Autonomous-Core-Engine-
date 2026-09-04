import fs from 'fs/promises';
import path from 'path';

export async function fetchTestItems() {
  const p = path.resolve(new URL(import.meta.url).pathname, '../worker/test_feed.json');
  // above path may result in URL-encoded path; use file URL resolution instead
  const file = path.resolve(new URL(import.meta.url).pathname).replace('/backend/worker/hunter_test_source.js','/backend/worker/test_feed.json');
  const content = await fs.readFile(file, 'utf8');
  return JSON.parse(content);
}
