const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

// can't use `fs/promises` for now because GitHub Actions run on node12, see https://github.com/actions/github-script/pull/182#issuecomment-903966153
const readFile = promisify(fs.readFile);

/**
 * @param {import('@octokit/rest')} octokit
 * @param {{ repo: { owner: string; repo: string } }} params
 * @return {Promise<void>}
 */
async function publishRelease(octokit, { repo }) {
  const changelog = await readFile(
    path.join(__dirname, '..', 'CHANGELOG.md'),
    'utf-8',
  );

  const versionHeader = /^## \d+\.\d+\.\d+/gm;

  // we leverage statefulness of `g` regex here for the second `exec` to start of the `lastIndex` from the first match
  const start = versionHeader.exec(changelog).index;
  // can't use optional chaining for now because GitHub Actions run on node12, see https://github.com/actions/github-script/pull/182#issuecomment-903966153
  const endExecResult = versionHeader.exec(changelog);
  const end = endExecResult ? endExecResult.index : changelog.length;

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
