// Bypasses code signing during build
module.exports = async function (configuration) {
  console.log(`🛡️ Skipping code signing for: ${configuration.path}`);
  return true;
};
