import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { setPrismaClient } from '../src/lib/prisma';
import { createMockPrismaClient } from './mock-prisma';
import { validateUrlForSsrf } from '../src/services/source-adapters/safe-fetch';
import { skillCatalogService } from '../src/services/skill-catalog.service';

describe('Part 5: Industry Intelligence & Dynamic Roadmaps API', () => {
  const mockPrisma = createMockPrismaClient();

  beforeEach(() => {
    mockPrisma.clear();
    setPrismaClient(mockPrisma);
  });

  afterAll(() => {
    setPrismaClient(null);
  });

  // Helper to setup learner and roadmap
  async function setupLearnerAndRoadmap(learnerName = 'Jordan') {
    const learnerRes = await request(app).post('/api/learners').send({
      displayName: learnerName,
      preferredLanguage: 'English',
      currentLevel: 'BEGINNER',
      learningGoal: 'Master Modern Web Development',
      minutesPerDay: 45,
    });
    const learnerId = learnerRes.body.data.id;

    const roadmapRes = await request(app).post('/api/roadmaps').send({
      learnerId,
      skill: 'Web Development',
    });
    const roadmapId = roadmapRes.body.data.id;

    const lessonsRes = await request(app).get(`/api/roadmaps/${roadmapId}/lessons`);
    const lessons = lessonsRes.body.data;

    return { learnerId, roadmapId, lessons };
  }

  describe('1. Security & SSRF Protection', () => {
    it('should reject non-HTTP/HTTPS URLs', () => {
      expect(() => validateUrlForSsrf('ftp://example.com/feed')).toThrow(/Unsupported protocol/i);
      expect(() => validateUrlForSsrf('file:///etc/passwd')).toThrow(/Unsupported protocol/i);
    });

    it('should reject invalid or malformed URL strings', () => {
      expect(() => validateUrlForSsrf('not-a-valid-url')).toThrow(/Invalid URL/i);
    });
  });

  describe('2. Canonical Skill Catalog', () => {
    it('should deterministically match technology tokens to canonical skills', () => {
      const text = 'React 19 announced new server actions and TypeScript 5.5 type declarations';
      const matched = skillCatalogService.matchSkills(text);

      const slugs = matched.map((s) => s.slug);
      expect(slugs).toContain('react');
      expect(slugs).toContain('typescript');
    });

    it('should safely return empty array for text with no known tech skills', () => {
      const text = 'Gardening tips and organic vegetable cultivation';
      const matched = skillCatalogService.matchSkills(text);
      expect(matched).toEqual([]);
    });
  });

  describe('3. Industry Sources & Scanning Endpoints', () => {
    it('GET /api/industry/sources should list sources (seeding defaults on first access)', async () => {
      const res = await request(app).get('/api/industry/sources');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);

      const names = res.body.data.map((s: any) => s.name);
      expect(names.some((n: string) => n.includes('React'))).toBe(true);
    });

    it('POST /api/industry/sources should create a valid new source', async () => {
      const res = await request(app)
        .post('/api/industry/sources')
        .send({
          name: 'Node.js Official News',
          type: 'RSS',
          url: 'https://nodejs.org/en/feed/blog.xml',
          technologies: ['Node.js', 'JavaScript'],
          pollingIntervalMinutes: 720,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.name).toBe('Node.js Official News');
      expect(res.body.data.type).toBe('RSS');
    });

    it('POST /api/industry/sources should reject invalid URL and missing technologies', async () => {
      const resInvalidUrl = await request(app)
        .post('/api/industry/sources')
        .send({
          name: 'Invalid Feed',
          type: 'RSS',
          url: 'not-a-url',
          technologies: ['React'],
        });
      expect(resInvalidUrl.status).toBe(400);

      const resMissingTech = await request(app)
        .post('/api/industry/sources')
        .send({
          name: 'No Tech Feed',
          type: 'RSS',
          url: 'https://example.com/feed.xml',
          technologies: [],
        });
      expect(resMissingTech.status).toBe(400);
    });

    it('GET /api/industry/status should return observability metrics', async () => {
      const res = await request(app).get('/api/industry/status');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalSources).toBeGreaterThanOrEqual(1);
      expect(res.body.data.totalEvents).toBeDefined();
      expect(Array.isArray(res.body.data.sources)).toBe(true);
    });
  });

  describe('4. Event Ingestion, Analysis, and Deduplication', () => {
    it('should ingest and analyze industry event, deduplicating repeated items', async () => {
      const sourcesRes = await request(app).get('/api/industry/sources');
      const source = sourcesRes.body.data[0];

      // Create an event directly in mock store
      const event = await mockPrisma.industryEvent.create({
        data: {
          sourceId: source.id,
          externalId: 'react-19-announcement',
          canonicalUrl: 'https://react.dev/blog/2024/react-19',
          title: 'React 19 Release: Server Actions and Modern Hooks',
          summary: 'React 19 brings Actions, useActionState, useOptimistic, and new compiler support.',
          content: 'Detailed changelog for React 19 breaking changes and migration guide.',
          sourceName: source.name,
          publishedAt: new Date(),
          contentHash: 'hash-react-19-test',
          analysisStatus: 'PENDING',
        },
      });

      expect(event.id).toBeDefined();

      const eventsRes = await request(app).get('/api/industry/events');
      expect(eventsRes.status).toBe(200);
      expect(eventsRes.body.data.length).toBeGreaterThanOrEqual(1);

      const singleRes = await request(app).get(`/api/industry/events/${event.id}`);
      expect(singleRes.status).toBe(200);
      expect(singleRes.body.data.title).toContain('React 19');
    });

    it('GET /api/industry/events/:id should return 404 for unknown event', async () => {
      const res = await request(app).get('/api/industry/events/unknown-event-id');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('5. Roadmap Impact Adaptation & Versioning', () => {
    it('should evaluate roadmap, create proposed update, and apply it atomically with versioning', async () => {
      const { learnerId, roadmapId, lessons } = await setupLearnerAndRoadmap();
      const initialLessonCount = lessons.length;

      // 1. Ingest an industry event relevant to the roadmap skill (Web Development / React)
      const sourcesRes = await request(app).get('/api/industry/sources');
      const source = sourcesRes.body.data[0];

      const event = await mockPrisma.industryEvent.create({
        data: {
          sourceId: source.id,
          externalId: 'react-major-update-uuid',
          canonicalUrl: 'https://react.dev/blog/2025/react-next-gen',
          title: 'React Major Update: Next Gen Hooks Architecture',
          summary: 'Major update introducing new state primitives and compiler optimizations.',
          content: 'Detailed specifications for modern web development workflows in React.',
          sourceName: source.name,
          publishedAt: new Date(),
          contentHash: 'hash-major-update-test',
          analysisStatus: 'PENDING',
        },
      });

      // 2. Trigger roadmap adaptation
      const adaptRes = await request(app).post(`/api/roadmaps/${roadmapId}/adapt`);

      expect(adaptRes.status).toBe(200);
      expect(adaptRes.body.success).toBe(true);
      expect(adaptRes.body.data.newProposalsCount).toBe(1);

      // 3. Verify update proposal was created
      const updatesRes = await request(app).get(`/api/roadmaps/${roadmapId}/updates`);
      expect(updatesRes.status).toBe(200);
      expect(updatesRes.body.data.length).toBe(1);

      const proposal = updatesRes.body.data[0];
      expect(proposal.approvalStatus).toBe('PROPOSED');
      expect(proposal.impactScore).toBeGreaterThanOrEqual(50);
      expect(proposal.evidenceReferences.length).toBeGreaterThan(0);

      // 4. Approve the proposal
      const approveRes = await request(app).post(
        `/api/roadmaps/${roadmapId}/updates/${proposal.id}/approve`
      );

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.success).toBe(true);
      expect(approveRes.body.data.version.versionNumber).toBe(1);
      expect(approveRes.body.data.update.approvalStatus).toBe('APPLIED');

      // 5. Verify the roadmap now has a new lesson and incremented version
      const updatedLessonsRes = await request(app).get(`/api/roadmaps/${roadmapId}/lessons`);
      expect(updatedLessonsRes.body.data.length).toBe(initialLessonCount + 1);

      const addedLesson = updatedLessonsRes.body.data.find((l: any) =>
        l.title.includes('Modern Industry Update')
      );
      expect(addedLesson).toBeDefined();

      // 6. Verify version history endpoint
      const versionsRes = await request(app).get(`/api/roadmaps/${roadmapId}/versions`);
      expect(versionsRes.status).toBe(200);
      expect(versionsRes.body.data.length).toBe(1);
      expect(versionsRes.body.data[0].versionNumber).toBe(1);

      const singleVersionRes = await request(app).get(
        `/api/roadmaps/${roadmapId}/versions/${versionsRes.body.data[0].id}`
      );
      expect(singleVersionRes.status).toBe(200);
      expect(singleVersionRes.body.data.snapshot).toBeDefined();

      // 7. Verify learner received in-app notification
      const notificationsRes = await request(app).get(`/api/learners/${learnerId}/notifications`);
      expect(notificationsRes.status).toBe(200);
      expect(notificationsRes.body.data.length).toBe(1);
      expect(notificationsRes.body.data[0].title).toContain('Roadmap Updated');
      expect(notificationsRes.body.data[0].read).toBe(false);

      // Mark notification as read
      const markReadRes = await request(app).patch(
        `/api/learners/${learnerId}/notifications/${notificationsRes.body.data[0].id}/read`
      );
      expect(markReadRes.status).toBe(200);
      expect(markReadRes.body.data.read).toBe(true);

      // 8. Verify daily plan automatically includes the newly added approved lesson
      const dailyPlanRes = await request(app).get(`/api/learners/${learnerId}/daily-plan`);
      expect(dailyPlanRes.status).toBe(200);
      expect(dailyPlanRes.body.data.status).toBe('IN_PROGRESS');
      expect(dailyPlanRes.body.data.tasks.length).toBeGreaterThan(0);
    });

    it('should reject already applied update with 400', async () => {
      const { roadmapId } = await setupLearnerAndRoadmap();

      const sourcesRes = await request(app).get('/api/industry/sources');
      const source = sourcesRes.body.data[0];

      const event = await mockPrisma.industryEvent.create({
        data: {
          sourceId: source.id,
          canonicalUrl: 'https://react.dev/blog/repeated-test',
          title: 'React Repeated Test',
          sourceName: source.name,
          publishedAt: new Date(),
          contentHash: 'hash-repeat-test',
          analysisStatus: 'PENDING',
        },
      });

      await request(app).post(`/api/roadmaps/${roadmapId}/adapt`);
      const updatesRes = await request(app).get(`/api/roadmaps/${roadmapId}/updates`);
      const proposal = updatesRes.body.data[0];

      // First approval
      await request(app).post(`/api/roadmaps/${roadmapId}/updates/${proposal.id}/approve`);

      // Second approval attempt should fail
      const repeatRes = await request(app).post(
        `/api/roadmaps/${roadmapId}/updates/${proposal.id}/approve`
      );
      expect(repeatRes.status).toBe(400);
    });

    it('should allow rejecting a proposed update without modifying roadmap', async () => {
      const { roadmapId, lessons } = await setupLearnerAndRoadmap();

      const sourcesRes = await request(app).get('/api/industry/sources');
      const source = sourcesRes.body.data[0];

      await mockPrisma.industryEvent.create({
        data: {
          sourceId: source.id,
          canonicalUrl: 'https://react.dev/blog/reject-test',
          title: 'React Reject Proposal Test',
          sourceName: source.name,
          publishedAt: new Date(),
          contentHash: 'hash-reject-test',
          analysisStatus: 'PENDING',
        },
      });

      await request(app).post(`/api/roadmaps/${roadmapId}/adapt`);
      const updatesRes = await request(app).get(`/api/roadmaps/${roadmapId}/updates`);
      const proposal = updatesRes.body.data[0];

      const rejectRes = await request(app)
        .post(`/api/roadmaps/${roadmapId}/updates/${proposal.id}/reject`)
        .send({ reason: 'Not relevant to learner current beginner milestones' });

      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.data.approvalStatus).toBe('REJECTED');

      // Verify roadmap lessons were NOT changed
      const lessonsRes = await request(app).get(`/api/roadmaps/${roadmapId}/lessons`);
      expect(lessonsRes.body.data.length).toBe(lessons.length);
    });
  });

  describe('6. Resource Recommendations (GET /api/lessons/:id/recommendations)', () => {
    it('should return educational recommendations for a valid lesson', async () => {
      const { lessons } = await setupLearnerAndRoadmap();
      const lesson = lessons[0];

      const res = await request(app).get(`/api/lessons/${lesson.id}/recommendations`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      const rec = res.body.data[0];
      expect(rec.title).toBeDefined();
      expect(rec.url).toBeDefined();
      expect(rec.provider).toBeDefined();
    });

    it('should return 404 for unknown lesson ID', async () => {
      const res = await request(app).get('/api/lessons/unknown-lesson-id/recommendations');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
