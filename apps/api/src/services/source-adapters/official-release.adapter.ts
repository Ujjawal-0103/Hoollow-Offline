import { RawSourceItem, SourceAdapter } from './source-adapter.interface';
import { safeFetchText } from './safe-fetch';

export class OfficialReleaseSourceAdapter implements SourceAdapter {
  public readonly type = 'OFFICIAL_RELEASE';

  public supports(type: string): boolean {
    const t = type.toUpperCase();
    return t === 'OFFICIAL_RELEASE' || t === 'RELEASE' || t === 'GITHUB_RELEASE';
  }

  public async fetchLatest(
    url: string,
    options: { maxItems?: number; timeoutMs?: number } = {}
  ): Promise<RawSourceItem[]> {
    const maxItems = options.maxItems ?? 10;
    const { text } = await safeFetchText(url, {
      timeoutMs: options.timeoutMs ?? 10000,
      headers: {
        Accept: 'application/vnd.github.v3+json, application/json',
      },
    });

    return this.parseReleaseJson(text, maxItems);
  }

  /**
   * Parses JSON release format (such as GitHub releases API or standard release changelogs).
   */
  public parseReleaseJson(jsonText: string, maxItems = 10): RawSourceItem[] {
    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      return [];
    }

    const items: any[] = Array.isArray(parsed) ? parsed : [parsed];
    const results: RawSourceItem[] = [];

    for (const item of items) {
      if (results.length >= maxItems) break;

      const title = item.name || item.tag_name || item.title || 'Official Release';
      const link = item.html_url || item.url || item.link || '';
      const id = String(item.id || item.tag_name || link);
      const body = item.body || item.description || item.changelog || '';
      const publishedDateStr = item.published_at || item.created_at || item.date;

      const publishedAt = publishedDateStr ? new Date(publishedDateStr) : new Date();
      const validDate = isNaN(publishedAt.getTime()) ? new Date() : publishedAt;

      if (link) {
        results.push({
          externalId: id,
          canonicalUrl: link,
          title: String(title).trim(),
          summary: String(body).slice(0, 1000).trim(),
          content: String(body).slice(0, 5000).trim(),
          publishedAt: validDate,
        });
      }
    }

    return results;
  }
}

export const officialReleaseSourceAdapter = new OfficialReleaseSourceAdapter();
