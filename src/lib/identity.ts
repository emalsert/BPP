const IDENTITY_PREFIX = 'tally:identity:';
const PAGES_KEY = 'tally:pages';

export interface KnownPage {
  slug: string;
  title: string;
  lastOpened: string;
}

export function getLocalIdentity(pageSlug: string): string | null {
  return localStorage.getItem(IDENTITY_PREFIX + pageSlug);
}

export function setLocalIdentity(pageSlug: string, personId: string): void {
  localStorage.setItem(IDENTITY_PREFIX + pageSlug, personId);
}

export function clearLocalIdentity(pageSlug: string): void {
  localStorage.removeItem(IDENTITY_PREFIX + pageSlug);
}

export function getKnownPages(): KnownPage[] {
  const raw = localStorage.getItem(PAGES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as KnownPage[];
  } catch {
    return [];
  }
}

export function rememberPage(page: KnownPage): void {
  const pages = getKnownPages().filter((p) => p.slug !== page.slug);
  pages.unshift(page);
  localStorage.setItem(PAGES_KEY, JSON.stringify(pages));
}
