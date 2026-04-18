/**
 * Version comparison utilities for CipherExam version gating.
 *
 * All versions are strict semver X.Y.Z. Comparison is numeric,
 * segment-by-segment. No string comparison, no parseFloat.
 */

export function normalizeVersion(version: string): string {
  return version.trim().replace(/^v/i, '');
}

export function isValidVersion(version: string): boolean {
  const parts = normalizeVersion(version).split('.').map(Number);
  return parts.length === 3 && parts.every(n => !Number.isNaN(n));
}

export function parseVersion(version: string): [number, number, number] {
  const parts = normalizeVersion(version).split('.').map(Number);

  if (parts.length !== 3 || parts.some(n => Number.isNaN(n))) {
    throw new Error(`Invalid version format: ${version}`);
  }

  return [parts[0], parts[1], parts[2]];
}

export function compareVersions(a: string, b: string): -1 | 0 | 1 {
  const av = parseVersion(a);
  const bv = parseVersion(b);

  for (let i = 0; i < 3; i++) {
    if (av[i] < bv[i]) return -1;
    if (av[i] > bv[i]) return 1;
  }

  return 0;
}

export function evaluateVersion(
  clientVersion: string,
  latestVersion: string,
  minimumVersion?: string
): 'ok' | 'warn' | 'block' {
  const rawMinimum = minimumVersion?.trim();
  const effectiveMinimum = rawMinimum || latestVersion;

  if (compareVersions(clientVersion, effectiveMinimum) === -1) {
    return 'block';
  }

  if (compareVersions(clientVersion, latestVersion) === -1) {
    return 'warn';
  }

  return 'ok';
}
