import { SourceAdapter } from './source-adapter.interface';
import { rssSourceAdapter } from './rss.adapter';
import { officialReleaseSourceAdapter } from './official-release.adapter';

export class SourceAdapterRegistry {
  private adapters: SourceAdapter[] = [rssSourceAdapter, officialReleaseSourceAdapter];

  public register(adapter: SourceAdapter): void {
    this.adapters.push(adapter);
  }

  public getAdapter(type: string): SourceAdapter | null {
    for (const adapter of this.adapters) {
      if (adapter.supports(type)) {
        return adapter;
      }
    }
    return null;
  }
}

export const sourceAdapterRegistry = new SourceAdapterRegistry();
