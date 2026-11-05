import { writeFile, readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const USERNAME = 'ColinMcC76';
const LIMIT = 12;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.resolve(__dirname, '../public/github-repos.json');

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function keepExistingOrEmpty(reason) {
  console.warn(`[sync:repos] ${reason}`);
  if (await fileExists(OUT_FILE)) {
    console.warn(`[sync:repos] Keeping existing ${OUT_FILE}`);
    return;
  }
  await writeFile(OUT_FILE, `${JSON.stringify([], null, 2)}\n`, 'utf8');
  console.warn(`[sync:repos] Wrote empty snapshot to ${OUT_FILE}`);
}

async function main() {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'personal-hub-sync-repos',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  let response;
  try {
    response = await fetch(
      `https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=pushed&direction=desc`,
      { headers },
    );
  } catch (error) {
    await keepExistingOrEmpty(`Network error: ${error instanceof Error ? error.message : error}`);
    return;
  }

  if (!response.ok) {
    await keepExistingOrEmpty(`GitHub API ${response.status} ${response.statusText}`);
    return;
  }

  /** @type {Array<Record<string, unknown>>} */
  const repos = await response.json();
  if (!Array.isArray(repos)) {
    await keepExistingOrEmpty('Unexpected GitHub API payload');
    return;
  }

  const cards = repos
    .filter((repo) => !repo.fork && !repo.archived)
    .sort((a, b) => {
      const aTime = Date.parse(String(a.pushed_at ?? '')) || 0;
      const bTime = Date.parse(String(b.pushed_at ?? '')) || 0;
      return bTime - aTime;
    })
    .slice(0, LIMIT)
    .map((repo) => ({
      name: String(repo.name ?? ''),
      description: typeof repo.description === 'string' ? repo.description : null,
      html_url: String(repo.html_url ?? ''),
      language: typeof repo.language === 'string' ? repo.language : null,
      stargazers_count: Number(repo.stargazers_count ?? 0),
      pushed_at: String(repo.pushed_at ?? ''),
      homepage: typeof repo.homepage === 'string' && repo.homepage.trim() ? repo.homepage : null,
    }))
    .filter((repo) => repo.name && repo.html_url);

  await writeFile(OUT_FILE, `${JSON.stringify(cards, null, 2)}\n`, 'utf8');
  console.log(`[sync:repos] Wrote ${cards.length} repos to ${OUT_FILE}`);
}

await main();
