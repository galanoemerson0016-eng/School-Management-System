const { pathToFileURL } = require('node:url');

function createRendererPolicy(indexPath, isDev) {
  const entry = pathToFileURL(indexPath).href;
  function isTrustedUrl(value) {
    try {
      const url = new URL(value);
      if (isDev) return url.origin === 'http://localhost:3001';
      url.search = '';
      url.hash = '';
      return url.href === entry;
    } catch { return false; }
  }
  function isTrustedSender(event, contents) {
    return Boolean(contents && !contents.isDestroyed() && event.sender === contents &&
      event.senderFrame === contents.mainFrame && isTrustedUrl(event.senderFrame.url));
  }
  function externalUrl(value) {
    try {
      const url = new URL(value);
      return ['https:', 'http:', 'mailto:'].includes(url.protocol) ? url.href : null;
    } catch { return null; }
  }
  return { isTrustedUrl, isTrustedSender, externalUrl };
}
module.exports = { createRendererPolicy };
