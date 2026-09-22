const path = require('path');

function validateReleaseTag(tag, version) {
  if (!/^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(tag)) {
    return {
      ok: false,
      message: `Release tag must use the v<version> format; received "${tag || '(missing)'}".`,
    };
  }

  if (tag.slice(1) !== version) {
    return {
      ok: false,
      message: `Release tag ${tag} does not match app/package.json version ${version}.`,
    };
  }

  return {
    ok: true,
    message: `Release tag ${tag} matches app/package.json version ${version}.`,
  };
}

if (require.main === module) {
  const version = require(path.join(__dirname, '..', 'package.json')).version;
  const tag = process.env.RELEASE_TAG || process.env.GITHUB_REF_NAME || '';
  const result = validateReleaseTag(tag, version);

  (result.ok ? console.log : console.error)(result.message);
  process.exitCode = result.ok ? 0 : 1;
}

module.exports = { validateReleaseTag };
