import crypto from 'crypto';
import { IndustryEvent, IndustrySource, PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../lib/prisma';
import { sourceAdapterRegistry } from './source-adapters/source-adapter.registry';
import { skillCatalogService } from './skill-catalog.service';

export interface CreateSourceInput {
  name: string;
  type: string;
  url: string;
  technologies: string[];
  pollingIntervalMinutes?: number;
  isActive?: boolean;
}

export interface UpdateSourceInput {
  name?: string;
  url?: string;
  technologies?: string[];
  pollingIntervalMinutes?: number;
  isActive?: boolean;
}

export interface ScanResult {
  sourceId: string;
  sourceName: string;
  success: boolean;
  newEventsCount: number;
  error?: string;
}

export interface MonitoringStatus {
  totalSources: number;
  activeSources: number;
  totalEvents: number;
  pendingAnalysisCount: number;
  analyzedEventsCount: number;
  lastScanAt: Date | null;
  sources: Array<{
    id: string;
    name: string;
    type: string;
    isActive: boolean;
    lastSuccessfulCheck: Date | null;
    lastAttemptedCheck: Date | null;
    errorState: string | null;
  }>;
}

export class IndustryMonitorService {
  constructor(private readonly prismaClient?: PrismaClient) {}

  private get client(): PrismaClient {
    return this.prismaClient ?? getPrismaClient();
  }

  /**
   * Default reliable seed sources for technologies currently in Hoollow roadmaps.
   */
  public static readonly DEFAULT_SOURCES: CreateSourceInput[] = [
    {
      name: 'React Official Releases & Blog',
      type: 'RSS',
      url: 'https://react.dev/feed.xml',
      technologies: ['React', 'JavaScript', 'Frontend'],
      pollingIntervalMinutes: 360,
      isActive: true,
    },
    {
      name: 'TypeScript Official Releases',
      type: 'OFFICIAL_RELEASE',
      url: 'https://api.github.com/repos/microsoft/TypeScript/releases',
      technologies: ['TypeScript', 'JavaScript'],
      pollingIntervalMinutes: 360,
      isActive: true,
    },
    {
      name: 'Next.js Official Feed',
      type: 'RSS',
      url: 'https://nextjs.org/feed.xml',
      technologies: ['Next.js', 'React', 'Full-Stack'],
      pollingIntervalMinutes: 360,
      isActive: true,
    },
  ];

  /**
   * Seeds default industry sources if none exist.
   */
  public async seedDefaultSources(): Promise<IndustrySource[]> {
    const existing = await this.client.industrySource.findMany();
    if (existing.length > 0) {
      return existing;
    }

    const created: IndustrySource[] = [];
    for (const s of IndustryMonitorService.DEFAULT_SOURCES) {
      const src = await this.client.industrySource.create({
        data: {
          name: s.name,
          type: s.type,
          url: s.url,
          technologies: s.technologies,
          pollingIntervalMinutes: s.pollingIntervalMinutes ?? 360,
          isActive: s.isActive ?? true,
        },
      });
      created.push(src);
    }
    return created;
  }

  /**
   * Lists all industry sources.
   */
  public async getSources(): Promise<IndustrySource[]> {
    const sources = await this.client.industrySource.findMany({
      orderBy: { createdAt: 'asc' },
    });
    if (sources.length === 0) {
      return this.seedDefaultSources();
    }
    return sources;
  }

  /**
   * Creates a new industry source.
   */
  public async createSource(input: CreateSourceInput): Promise<IndustrySource> {
    return this.client.industrySource.create({
      data: {
        name: input.name,
        type: input.type,
        url: input.url,
        technologies: input.technologies,
        pollingIntervalMinutes: input.pollingIntervalMinutes ?? 360,
        isActive: input.isActive ?? true,
      },
    });
  }

  /**
   * Updates an existing industry source.
   */
  public async updateSource(id: string, input: UpdateSourceInput): Promise<IndustrySource> {
    return this.client.industrySource.update({
      where: { id },
      data: input,
    });
  }

  /**
   * Scans a single source by ID, persists new events, and maps skills.
   */
  public async scanSource(sourceId: string): Promise<ScanResult> {
    const source = await this.client.industrySource.findUnique({
      where: { id: sourceId },
    });

    if (!source) {
      return { sourceId, sourceName: 'Unknown', success: false, newEventsCount: 0, error: 'Source not found' };
    }

    if (!source.isActive) {
      return { sourceId, sourceName: source.name, success: true, newEventsCount: 0 };
    }

    const adapter = sourceAdapterRegistry.getAdapter(source.type);
    if (!adapter) {
      const err = `No adapter registered for source type: ${source.type}`;
      await this.client.industrySource.update({
        where: { id: source.id },
        data: { lastAttemptedCheck: new Date(), errorState: err },
      });
      return { sourceId, sourceName: source.name, success: false, newEventsCount: 0, error: err };
    }

    const now = new Date();
    await this.client.industrySource.update({
      where: { id: source.id },
      data: { lastAttemptedCheck: now },
    });

    try {
      const rawItems = await adapter.fetchLatest(source.url, { timeoutMs: 12000, maxItems: 15 });
      let newCount = 0;

      for (const item of rawItems) {
        const contentHash = crypto
          .createHash('sha256')
          .update(`${item.canonicalUrl}::${item.title}::${item.content || item.summary || ''}`)
          .digest('hex');

        // Check deduplication by externalId or canonicalUrl or contentHash
        const existingEvent = await this.client.industryEvent.findFirst({
          where: {
            OR: [
              ...(item.externalId ? [{ sourceId: source.id, externalId: item.externalId }] : []),
              { canonicalUrl: item.canonicalUrl },
              { contentHash },
            ],
          },
        });

        if (!existingEvent) {
          // Identify matching canonical skills
          const matchedSkills = skillCatalogService.matchSkills(
            `${item.title} ${item.summary || ''} ${item.content || ''}`,
            source.technologies
          );

          // Ensure canonical skills exist in db
          await skillCatalogService.seedSkills();

          // Create event and skill joins in a transaction
          await this.client.$transaction(async (tx) => {
            const created = await tx.industryEvent.create({
              data: {
                sourceId: source.id,
                externalId: item.externalId,
                canonicalUrl: item.canonicalUrl,
                title: item.title,
                summary: item.summary,
                content: item.content,
                sourceName: source.name,
                publishedAt: item.publishedAt,
                contentHash,
                analysisStatus: 'PENDING',
              },
            });

            // Map skills
            for (const s of matchedSkills) {
              const dbSkill = await tx.skill.findUnique({ where: { slug: s.slug } });
              if (dbSkill) {
                await tx.industryEventSkill.create({
                  data: {
                    eventId: created.id,
                    skillId: dbSkill.id,
                  },
                });
              }
            }
          });

          newCount++;
        }
      }

      await this.client.industrySource.update({
        where: { id: source.id },
        data: {
          lastSuccessfulCheck: now,
          errorState: null,
        },
      });

      return {
        sourceId: source.id,
        sourceName: source.name,
        success: true,
        newEventsCount: newCount,
      };
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      await this.client.industrySource.update({
        where: { id: source.id },
        data: {
          errorState: errorMessage,
        },
      });

      return {
        sourceId: source.id,
        sourceName: source.name,
        success: false,
        newEventsCount: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * Scans all enabled industry sources boundedly.
   */
  public async scanAllSources(): Promise<ScanResult[]> {
    const sources = await this.getSources();
    const active = sources.filter((s) => s.isActive);
    const results: ScanResult[] = [];

    for (const source of active) {
      const res = await this.scanSource(source.id);
      results.push(res);
    }

    return results;
  }

  /**
   * Retrieves events with optional filtering.
   */
  public async getEvents(options: {
    status?: string;
    skillSlug?: string;
    limit?: number;
  } = {}): Promise<any[]> {
    const limit = options.limit ?? 50;

    const where: any = {};
    if (options.status) {
      where.analysisStatus = options.status;
    }

    const events = await this.client.industryEvent.findMany({
      where,
      include: {
        skills: {
          include: { skill: true },
        },
        source: true,
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });

    if (options.skillSlug) {
      return events.filter((e) =>
        e.skills.some((s: any) => s.skill.slug === options.skillSlug)
      );
    }

    return events;
  }

  /**
   * Retrieves a single event by ID with its skill relationships.
   */
  public async getEventById(id: string): Promise<any> {
    return this.client.industryEvent.findUnique({
      where: { id },
      include: {
        skills: {
          include: { skill: true },
        },
        source: true,
        roadmapUpdates: true,
      },
    });
  }

  /**
   * Returns administrative status and monitoring metrics.
   */
  public async getObservabilityStatus(): Promise<MonitoringStatus> {
    const sources = await this.getSources();
    const events = await this.client.industryEvent.findMany();

    const pendingCount = events.filter((e) => e.analysisStatus === 'PENDING').length;
    const analyzedCount = events.filter((e) => e.analysisStatus === 'ANALYZED').length;

    let latestCheck: Date | null = null;
    for (const s of sources) {
      if (s.lastAttemptedCheck && (!latestCheck || s.lastAttemptedCheck > latestCheck)) {
        latestCheck = s.lastAttemptedCheck;
      }
    }

    return {
      totalSources: sources.length,
      activeSources: sources.filter((s) => s.isActive).length,
      totalEvents: events.length,
      pendingAnalysisCount: pendingCount,
      analyzedEventsCount: analyzedCount,
      lastScanAt: latestCheck,
      sources: sources.map((s) => ({
        id: s.id,
        name: s.name,
        type: s.type,
        isActive: s.isActive,
        lastSuccessfulCheck: s.lastSuccessfulCheck,
        lastAttemptedCheck: s.lastAttemptedCheck,
        errorState: s.errorState,
      })),
    };
  }
}

export const industryMonitorService = new IndustryMonitorService();
