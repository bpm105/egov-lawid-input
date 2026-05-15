export interface LawSearchResult {
  lawId: string;
  lawTitle: string;
  lawNum: string;
  isRepealed: boolean;
  revisionCount?: number;
}
