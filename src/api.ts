import type { LawSearchResult } from './types';

const DEFAULT_API_BASE = 'https://laws.e-gov.go.jp/api/2';

export async function searchLaws(
  query: string,
  limit = 10,
  apiBaseUrl: string = DEFAULT_API_BASE,
  onError?: (e: unknown) => void
): Promise<LawSearchResult[]> {
  const q = query.trim();
  if (!q) return [];
  const url = `${apiBaseUrl}/laws?law_title=${encodeURIComponent(q)}&limit=50`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const laws = Array.isArray(data) ? data : (data.laws ?? []);
    const results: LawSearchResult[] = laws.map((item: Record<string, Record<string, unknown>>) => ({
      lawId: item.law_info?.law_id as string,
      lawTitle: item.revision_info?.law_title as string,
      lawNum: item.law_info?.law_num as string,
      isRepealed: (item.revision_info?.repeal_status as string) === 'Repeal',
    }));
    results.sort((a, b) => {
      const aRank = a.lawTitle === q ? 0 : a.lawTitle.startsWith(q) ? 1 : 2;
      const bRank = b.lawTitle === q ? 0 : b.lawTitle.startsWith(q) ? 1 : 2;
      return aRank - bRank;
    });
    return results.slice(0, limit);
  } catch (e) {
    onError?.(e);
    return [];
  }
}

export async function fetchRevisionCount(
  lawId: string,
  apiBaseUrl: string = DEFAULT_API_BASE,
  onError?: (e: unknown) => void
): Promise<number | undefined> {
  try {
    const res = await fetch(`${apiBaseUrl}/law_revisions/${lawId}`);
    if (!res.ok) return undefined;
    const data = await res.json();
    return (data.revisions ?? []).length;
  } catch (e) {
    onError?.(e);
    return undefined;
  }
}
