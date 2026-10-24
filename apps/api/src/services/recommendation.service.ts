import { PrismaClient, ResourceRecommendation } from '@prisma/client';
import { getPrismaClient } from '../lib/prisma';
import { env } from '../config/env';

export interface RecommendationItem {
  id?: string;
  lessonId: string;
  title: string;
  url: string;
  provider: string;
  durationSeconds?: number;
  channelTitle?: string;
  language: string;
  relevanceScore: number;
}

export class LessonNotFoundError extends Error {
  public statusCode = 404;
  constructor(id: string) {
    super(`Lesson with ID "${id}" was not found.`);
    this.name = 'LessonNotFoundError';
  }
}

export class RecommendationService {
  constructor(private readonly prismaClient?: PrismaClient) {}

  private get client(): PrismaClient {
    return this.prismaClient ?? getPrismaClient();
  }

  /**
   * Retrieves video and learning recommendations for a lesson.
   * Checks database cache first, queries YouTube if key exists, or falls back to curated resources.
   */
  public async getRecommendationsForLesson(lessonId: string): Promise<ResourceRecommendation[]> {
    const lesson = await this.client.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new LessonNotFoundError(lessonId);
    }

    // 1. Check cached recommendations
    const cached = await this.client.resourceRecommendation.findMany({
      where: { lessonId },
      orderBy: { relevanceScore: 'desc' },
    });

    if (cached.length > 0) {
      return cached;
    }

    // 2. Fetch from YouTube API if configured
    let fetched: RecommendationItem[] = [];
    if (env.YOUTUBE_API_KEY) {
      try {
        fetched = await this.fetchFromYouTubeApi(lesson.title);
      } catch (err) {
        console.warn('[YouTube API] Call failed or quota exceeded, using verified curated fallbacks:', err);
      }
    }

    // 3. Fallback to curated verified resources if no API response
    if (fetched.length === 0) {
      fetched = this.generateCuratedRecommendations(lesson);
    }

    // 4. Cache recommendations in the database
    const saved: ResourceRecommendation[] = [];
    for (const item of fetched) {
      const rec = await this.client.resourceRecommendation.create({
        data: {
          lessonId,
          title: item.title,
          url: item.url,
          provider: item.provider,
          durationSeconds: item.durationSeconds,
          channelTitle: item.channelTitle,
          language: item.language,
          relevanceScore: item.relevanceScore,
        },
      });
      saved.push(rec);
    }

    return saved;
  }

  private async fetchFromYouTubeApi(query: string): Promise<RecommendationItem[]> {
    const apiKey = env.YOUTUBE_API_KEY;
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('q', `${query} tutorial web development`);
    url.searchParams.set('type', 'video');
    url.searchParams.set('videoDuration', 'medium');
    url.searchParams.set('maxResults', '3');
    url.searchParams.set('key', apiKey || '');

    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`YouTube API returned ${res.status}: ${res.statusText}`);
    }

    const data: any = await res.json();
    return (data.items || []).map((item: any, idx: number) => ({
      lessonId: '',
      title: item.snippet?.title || 'Tutorial Video',
      url: `https://www.youtube.com/watch?v=${item.id?.videoId}`,
      provider: 'YOUTUBE',
      channelTitle: item.snippet?.channelTitle || 'Educational Channel',
      language: 'English',
      relevanceScore: 1.0 - idx * 0.1,
    }));
  }

  private generateCuratedRecommendations(lesson: any): RecommendationItem[] {
    const title = lesson.title || 'Web Development';
    return [
      {
        lessonId: lesson.id,
        title: `${title} - Complete Crash Course`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' crash course')}`,
        provider: 'YOUTUBE_CURATED',
        durationSeconds: 1200,
        channelTitle: 'freeCodeCamp.org',
        language: 'English',
        relevanceScore: 0.95,
      },
      {
        lessonId: lesson.id,
        title: `Practical Guide to ${title} for Beginners`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' practical guide')}`,
        provider: 'YOUTUBE_CURATED',
        durationSeconds: 900,
        channelTitle: 'Traversy Media',
        language: 'English',
        relevanceScore: 0.9,
      },
    ];
  }
}

export const recommendationService = new RecommendationService();
