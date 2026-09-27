const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { createRendererPolicy } = require('./security.cjs');
const entry = path.resolve('synthetic-app/dist/index.html');
const policy = createRendererPolicy(entry, false);
test('only the packaged entry is trusted, with hash/query navigation allowed', () => {
  assert.equal(policy.isTrustedUrl(pathToFileURL(entry).href + '#view'), true);
  for (const url of ['https://example.test', 'file:///other/index.html', 'javascript:alert(1)', 'about:blank']) assert.equal(policy.isTrustedUrl(url), false);
});
test('subframes and other windows cannot invoke desktop capabilities', () => {
  const contents = { isDestroyed: () => false, mainFrame: { url: pathToFileURL(entry).href } };
  assert.equal(policy.isTrustedSender({ sender: contents, senderFrame: contents.mainFrame }, contents), true);
  assert.equal(policy.isTrustedSender({ sender: contents, senderFrame: { url: contents.mainFrame.url } }, contents), false);
  assert.equal(policy.isTrustedSender({ sender: {}, senderFrame: contents.mainFrame }, contents), false);
});
test('external links reject file, javascript and custom executable protocols', () => {
  for (const url of ['file:///a.exe', 'javascript:alert(1)', 'ms-settings:test', 'data:text/html,test']) assert.equal(policy.externalUrl(url), null);
  assert.equal(policy.externalUrl('https://example.test/path'), 'https://example.test/path');
});
