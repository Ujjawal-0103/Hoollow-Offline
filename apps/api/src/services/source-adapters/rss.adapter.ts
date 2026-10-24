import { RawSourceItem, SourceAdapter } from './source-adapter.interface';
import { safeFetchText } from './safe-fetch';

/**
 * Robust XML/RSS/Atom adapter without native C++ dependencies or XXE risks.
 */
export class RssSourceAdapter implements SourceAdapter {
  public readonly type = 'RSS';

  public supports(type: string): boolean {
    const t = type.toUpperCase();
    return t === 'RSS' || t === 'ATOM' || t === 'FEED';
  }

  public async fetchLatest(
    url: string,
    options: { maxItems?: number; timeoutMs?: number } = {}
  ): Promise<RawSourceItem[]> {
    const maxItems = options.maxItems ?? 10;
    const { text } = await safeFetchText(url, { timeoutMs: options.timeoutMs ?? 10000 });
    return this.parseFeed(text, maxItems);
  }

  /**
   * Parses RSS 2.0 or Atom XML content into normalized RawSourceItems.
   */
  public parseFeed(xmlText: string, maxItems = 10): RawSourceItem[] {
    const isAtom = xmlText.includes('<feed') || xmlText.includes('<entry>');
    if (isAtom) {
      return this.parseAtom(xmlText, maxItems);
    }
    return this.parseRss(xmlText, maxItems);
  }

  private parseRss(xml: string, maxItems: number): RawSourceItem[] {
    const items: RawSourceItem[] = [];
    const itemRegex = /<item[\s\S]*?<\/item>/gi;
    let match: RegExpExecArray | null;

    while ((match = itemRegex.exec(xml)) !== null && items.length < maxItems) {
      const block = match[0];
      const title = this.extractTag(block, 'title') || 'Untitled Event';
      const link = this.extractTag(block, 'link') || '';
      const guid = this.extractTag(block, 'guid') || link;
      const pubDateStr = this.extractTag(block, 'pubDate') || this.extractTag(block, 'dc:date');
      const description = this.extractTag(block, 'description') || '';
      const content = this.extractTag(block, 'content:encoded') || description;

      const publishedAt = pubDateStr ? new Date(pubDateStr) : new Date();
      const validDate = isNaN(publishedAt.getTime()) ? new Date() : publishedAt;

      if (link) {
        items.push({
          externalId: guid || undefined,
          canonicalUrl: link.trim(),
          title: this.cleanHtml(title).trim(),
          summary: this.cleanHtml(description).slice(0, 1000).trim(),
          content: this.cleanHtml(content).slice(0, 5000).trim(),
          publishedAt: validDate,
        });
      }
    }

    return items;
  }

  private parseAtom(xml: string, maxItems: number): RawSourceItem[] {
    const items: RawSourceItem[] = [];
    const entryRegex = /<entry[\s\S]*?<\/entry>/gi;
    let match: RegExpExecArray | null;

    while ((match = entryRegex.exec(xml)) !== null && items.length < maxItems) {
      const block = match[0];
      const title = this.extractTag(block, 'title') || 'Untitled Event';
      const id = this.extractTag(block, 'id') || '';

      // Atom link can be <link href="..." /> or <link>...</link>
      let link = '';
      const hrefMatch = /<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i.exec(block);
      if (hrefMatch) {
        link = hrefMatch[1];
      } else {
        link = this.extractTag(block, 'link') || '';
      }

      const publishedStr =
        this.extractTag(block, 'published') ||
        this.extractTag(block, 'updated') ||
        this.extractTag(block, 'dc:date');
      const summary =
        this.extractTag(block, 'summary') ||
        this.extractTag(block, 'content') ||
        '';

      const publishedAt = publishedStr ? new Date(publishedStr) : new Date();
      const validDate = isNaN(publishedAt.getTime()) ? new Date() : publishedAt;

      const canonicalUrl = link || id;
      if (canonicalUrl) {
        items.push({
          externalId: id || undefined,
          canonicalUrl: canonicalUrl.trim(),
          title: this.cleanHtml(title).trim(),
          summary: this.cleanHtml(summary).slice(0, 1000).trim(),
          content: this.cleanHtml(summary).slice(0, 5000).trim(),
          publishedAt: validDate,
        });
      }
    }

    return items;
  }

  private extractTag(xmlBlock: string, tagName: string): string {
    const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
    const match = regex.exec(xmlBlock);
    if (!match) return '';

    let content = match[1];
    // Strip CDATA wrapper if present
    content = content.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1');
    return content.trim();
  }

  private cleanHtml(html: string): string {
    return html
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }
}

export const rssSourceAdapter = new RssSourceAdapter();
