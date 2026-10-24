export interface RawSourceItem {
  externalId?: string;
  canonicalUrl: string;
  title: string;
  summary?: string;
  content?: string;
  publishedAt: Date;
  sourceName?: string;
  tags?: string[];
}

export interface SourceAdapter {
  readonly type: string;
  supports(type: string): boolean;
  fetchLatest(url: string, options?: { maxItems?: number; timeoutMs?: number }): Promise<RawSourceItem[]>;
}
