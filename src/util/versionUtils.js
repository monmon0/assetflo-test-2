export const getVersionWithoutReleaseType = (version) => {
  // Version is not available, return it as is
  if (!version) {
    return version;
  }
  // If version is legacy
  if (typeof version === 'number') {
    return version.toString();
  }
  const versionParts = version.split('.');
  if (versionParts.length === 7) {
    // If the version is in the format 'hardwareVersion.protocol.useCase.major.minor.patch.releaseType'
    // Skip useCase and releaseType
    const [hardwareVersion, protocol, , major, minor, patch] = versionParts;
    return `${hardwareVersion}.${protocol}.${major}.${minor}.${patch}`;
  }
  // If the version is in the format 'hardwareVersion.protocol.major.minor.patch'
  return version;
};
