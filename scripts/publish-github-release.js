const fs = require('fs/promises');
const path = require('path');

/**
 * @param {import('@octokit/rest')} octokit
 * @param {{ repo: { owner: string; repo: string } }} params
 * @return {Promise<void>}
 */
async function publishRelease(octokit, { repo }) {
  const changelog = await fs.readFile(
    path.join(__dirname, '..', 'CHANGELOG.md'),
    'utf-8',
  );

  const versionHeader = /^##/gm;

  // we leverage statefulness of `g` regex here for the second `exec` to start of the `lastIndex` from the first match
  const start = versionHeader.exec(changelog).index;
  const end = versionHeader.exec(changelog)?.index || changelog.length;

  const latestChangelogEntry = changelog.slice(start, end);
  const [match, version] = latestChangelogEntry.match(/## (.+)\s*$/m);

  const tagName = `v${version}`;
  const content = latestChangelogEntry.slice(match.length).trim();

  await octokit.repos.createRelease({
    name: tagName,
    tag_name: tagName,
    body: content,
    ...repo,
  });
}

module.exports = { publishRelease };
