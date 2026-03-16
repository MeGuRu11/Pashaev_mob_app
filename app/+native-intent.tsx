export function redirectSystemPath({
  path,
  initial: _initial,
}: { path: string; initial: boolean }) {
  if (!path) return '/';

  try {
    const normalized = path.trim();
    if (!normalized) return '/';

    if (normalized.startsWith('/')) {
      return normalized;
    }

    const parsed = new URL(normalized, 'surgicoach-app://app');
    const pathname = parsed.pathname || '/';
    return `${pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return '/';
  }
}
