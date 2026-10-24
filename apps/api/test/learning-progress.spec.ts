import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { setPrismaClient } from '../src/lib/prisma';
import { createMockPrismaClient } from './mock-prisma';

describe('Part 3: In-App Learning & Progress Tracking API', () => {
  const mockPrisma = createMockPrismaClient();

  beforeEach(() => {
    mockPrisma.clear();
    setPrismaClient(mockPrisma);
  });

  afterAll(() => {
    setPrismaClient(null);
  });

  // Helper to quickly create a test learner and roadmap
  async function setupLearnerAndRoadmap(learnerName = 'Jordan') {
    const learnerRes = await request(app).post('/api/learners').send({
      displayName: learnerName,
      preferredLanguage: 'English',
      currentLevel: 'BEGINNER',
      learningGoal: 'Master Web Development',
      minutesPerDay: 30,
    });
    const learnerId = learnerRes.body.data.id;

    const roadmapRes = await request(app).post('/api/roadmaps').send({
      learnerId,
      skill: 'Web Development',
    });
    const roadmapId = roadmapRes.body.data.id;

    return { learnerId, roadmapId, roadmap: roadmapRes.body.data };
  }

  describe('1. Lesson Listing & Retrieval Endpoints', () => {
    it('GET /api/roadmaps/:id/lessons should return ordered lessons with milestone details', async () => {
      const { roadmapId } = await setupLearnerAndRoadmap();

      const res = await request(app).get(`/api/roadmaps/${roadmapId}/lessons`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(9); // 3 milestones * 3 lessons

      // Verify ordering
      const lessons = res.body.data;
      expect(lessons[0].milestoneOrder).toBe(1);
      expect(lessons[0].order).toBe(1);
      expect(lessons[0].milestoneTitle).toContain('HTML5');
      expect(lessons[0].roadmapId).toBe(roadmapId);

      // Verify sequential ordering throughout the list
      for (let i = 0; i < lessons.length - 1; i++) {
        const curr = lessons[i];
        const next = lessons[i + 1];
        if (curr.milestoneOrder === next.milestoneOrder) {
          expect(next.order).toBeGreaterThan(curr.order);
        } else {
          expect(next.milestoneOrder).toBeGreaterThan(curr.milestoneOrder);
        }
      }
    });

    it('GET /api/roadmaps/:id/lessons should include completion status when learnerId is provided', async () => {
      const { learnerId, roadmapId } = await setupLearnerAndRoadmap();

      // List before any completion
      const resBefore = await request(app).get(`/api/roadmaps/${roadmapId}/lessons?learnerId=${learnerId}`);
      expect(resBefore.status).toBe(200);
      expect(resBefore.body.data[0].completed).toBe(false);

      // Complete lesson 1
      const firstLessonId = resBefore.body.data[0].id;
      await request(app).post(`/api/lessons/${firstLessonId}/complete`).send({ learnerId });

      // List after completion
      const resAfter = await request(app).get(`/api/roadmaps/${roadmapId}/lessons?learnerId=${learnerId}`);
      expect(resAfter.status).toBe(200);
      expect(resAfter.body.data[0].completed).toBe(true);
      expect(resAfter.body.data[0].completedAt).toBeDefined();
      expect(resAfter.body.data[1].completed).toBe(false);
    });

    it('GET /api/roadmaps/:id/lessons should return 404 for nonexistent roadmap', async () => {
      const res = await request(app).get('/api/roadmaps/unknown-roadmap-uuid/lessons');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.statusCode).toBe(404);
    });

    it('GET /api/lessons/:id should return 200 with full lesson content, milestone, and roadmap info', async () => {
      const { roadmapId } = await setupLearnerAndRoadmap();

      const lessonsRes = await request(app).get(`/api/roadmaps/${roadmapId}/lessons`);
      const targetLessonId = lessonsRes.body.data[0].id;

      const res = await request(app).get(`/api/lessons/${targetLessonId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(targetLessonId);
      expect(res.body.data.title).toBeDefined();
      expect(res.body.data.durationMinutes).toBe(30);
      expect(res.body.data.content).toBeDefined();
      expect(Array.isArray(res.body.data.learningObjectives)).toBe(true);
      expect(Array.isArray(res.body.data.examples)).toBe(true);
      expect(Array.isArray(res.body.data.keyTakeaways)).toBe(true);
      expect(res.body.data.milestone).toBeDefined();
      expect(res.body.data.milestone.title).toContain('HTML5');
      expect(res.body.data.roadmap).toBeDefined();
      expect(res.body.data.roadmap.id).toBe(roadmapId);
    });

    it('GET /api/lessons/:id should return 404 for nonexistent lesson', async () => {
      const res = await request(app).get('/api/lessons/unknown-lesson-uuid');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.statusCode).toBe(404);
    });
  });

  describe('2. Lesson Completion Endpoint', () => {
    it('POST /api/lessons/:id/complete should mark lesson as completed with timestamp', async () => {
      const { learnerId, roadmapId } = await setupLearnerAndRoadmap();

      const lessonsRes = await request(app).get(`/api/roadmaps/${roadmapId}/lessons`);
      const lessonId = lessonsRes.body.data[0].id;

      const res = await request(app).post(`/api/lessons/${lessonId}/complete`).send({
        learnerId,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.learnerId).toBe(learnerId);
      expect(res.body.data.lessonId).toBe(lessonId);
      expect(res.body.data.completed).toBe(true);
      expect(res.body.data.completedAt).toBeDefined();
    });

    it('POST /api/lessons/:id/complete should be idempotent on repeated requests', async () => {
      const { learnerId, roadmapId } = await setupLearnerAndRoadmap();

      const lessonsRes = await request(app).get(`/api/roadmaps/${roadmapId}/lessons`);
      const lessonId = lessonsRes.body.data[0].id;

      // First call
      const res1 = await request(app).post(`/api/lessons/${lessonId}/complete`).send({ learnerId });
      expect(res1.status).toBe(200);
      const progressId = res1.body.data.id;
      const completedAt = res1.body.data.completedAt;

      // Second identical call
      const res2 = await request(app).post(`/api/lessons/${lessonId}/complete`).send({ learnerId });
      expect(res2.status).toBe(200);
      expect(res2.body.data.id).toBe(progressId);
      expect(res2.body.data.completed).toBe(true);
      expect(res2.body.data.completedAt).toBe(completedAt);
    });

    it('POST /api/lessons/:id/complete should ensure isolation between different learners', async () => {
      const userA = await setupLearnerAndRoadmap('Learner A');
      const userB = await setupLearnerAndRoadmap('Learner B');

      const lessonsRes = await request(app).get(`/api/roadmaps/${userA.roadmapId}/lessons`);
      const lessonId = lessonsRes.body.data[0].id;

      // Complete for Learner A
      await request(app).post(`/api/lessons/${lessonId}/complete`).send({ learnerId: userA.learnerId });

      // Verify Learner A shows completed
      const checkA = await request(app).get(`/api/roadmaps/${userA.roadmapId}/lessons?learnerId=${userA.learnerId}`);
      expect(checkA.body.data[0].completed).toBe(true);

      // Verify Learner B still shows incomplete
      const checkB = await request(app).get(`/api/roadmaps/${userA.roadmapId}/lessons?learnerId=${userB.learnerId}`);
      expect(checkB.body.data[0].completed).toBe(false);
    });

    it('POST /api/lessons/:id/complete should return 404 for unknown learner', async () => {
      const { roadmapId } = await setupLearnerAndRoadmap();
      const lessonsRes = await request(app).get(`/api/roadmaps/${roadmapId}/lessons`);
      const lessonId = lessonsRes.body.data[0].id;

      const res = await request(app).post(`/api/lessons/${lessonId}/complete`).send({
        learnerId: 'nonexistent-learner-uuid',
      });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('not found');
    });

    it('POST /api/lessons/:id/complete should return 404 for unknown lesson', async () => {
      const { learnerId } = await setupLearnerAndRoadmap();

      const res = await request(app).post('/api/lessons/nonexistent-lesson-uuid/complete').send({
        learnerId,
      });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('not found');
    });

    it('POST /api/lessons/:id/complete should return 400 for empty or missing learnerId', async () => {
      const { roadmapId } = await setupLearnerAndRoadmap();
      const lessonsRes = await request(app).get(`/api/roadmaps/${roadmapId}/lessons`);
      const lessonId = lessonsRes.body.data[0].id;

      const res = await request(app).post(`/api/lessons/${lessonId}/complete`).send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('3. Learning Progress Summary Endpoint', () => {
    it('GET /api/learners/:id/progress should calculate correct progress metrics and rounding', async () => {
      const { learnerId, roadmapId } = await setupLearnerAndRoadmap();

      const lessonsRes = await request(app).get(`/api/roadmaps/${roadmapId}/lessons`);
      const lessons = lessonsRes.body.data;
      expect(lessons.length).toBe(9);

      // Initially 0%
      const resInitial = await request(app).get(`/api/learners/${learnerId}/progress`);
      expect(resInitial.status).toBe(200);
      expect(resInitial.body.data.totalRoadmaps).toBe(1);
      expect(resInitial.body.data.totalLessons).toBe(9);
      expect(resInitial.body.data.completedLessons).toBe(0);
      expect(resInitial.body.data.remainingLessons).toBe(9);
      expect(resInitial.body.data.progressPercent).toBe(0);

      // Complete 3 out of 9 lessons (3 / 9 = 33.333% -> rounds to 33%)
      await request(app).post(`/api/lessons/${lessons[0].id}/complete`).send({ learnerId });
      await request(app).post(`/api/lessons/${lessons[1].id}/complete`).send({ learnerId });
      await request(app).post(`/api/lessons/${lessons[2].id}/complete`).send({ learnerId });

      const res3 = await request(app).get(`/api/learners/${learnerId}/progress`);
      expect(res3.status).toBe(200);
      expect(res3.body.data.totalLessons).toBe(9);
      expect(res3.body.data.completedLessons).toBe(3);
      expect(res3.body.data.remainingLessons).toBe(6);
      expect(res3.body.data.progressPercent).toBe(33);
      expect(res3.body.data.roadmaps[0].progressPercent).toBe(33);

      // Complete 3 more (6 / 9 = 66.666% -> rounds to 67%)
      await request(app).post(`/api/lessons/${lessons[3].id}/complete`).send({ learnerId });
      await request(app).post(`/api/lessons/${lessons[4].id}/complete`).send({ learnerId });
      await request(app).post(`/api/lessons/${lessons[5].id}/complete`).send({ learnerId });

      const res6 = await request(app).get(`/api/learners/${learnerId}/progress`);
      expect(res6.status).toBe(200);
      expect(res6.body.data.completedLessons).toBe(6);
      expect(res6.body.data.remainingLessons).toBe(3);
      expect(res6.body.data.progressPercent).toBe(67);
    });

    it('GET /api/learners/:id/progress should return 0% for learner with no roadmaps', async () => {
      const learnerRes = await request(app).post('/api/learners').send({
        displayName: 'New Learner',
        currentLevel: 'BEGINNER',
        learningGoal: 'Getting started',
      });
      const learnerId = learnerRes.body.data.id;

      const res = await request(app).get(`/api/learners/${learnerId}/progress`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalRoadmaps).toBe(0);
      expect(res.body.data.totalLessons).toBe(0);
      expect(res.body.data.completedLessons).toBe(0);
      expect(res.body.data.remainingLessons).toBe(0);
      expect(res.body.data.progressPercent).toBe(0);
      expect(res.body.data.roadmaps).toEqual([]);
    });

    it('GET /api/learners/:id/progress should return 404 for unknown learner', async () => {
      const res = await request(app).get('/api/learners/unknown-learner-uuid/progress');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('4. Daily Learning Plan Endpoint & Next Lesson Recommendation', () => {
    it('GET /api/learners/:id/daily-plan should recommend next sequential incomplete lessons within daily time budget', async () => {
      const { learnerId, roadmapId } = await setupLearnerAndRoadmap();

      const lessonsRes = await request(app).get(`/api/roadmaps/${roadmapId}/lessons`);
      const lessons = lessonsRes.body.data;

      // Available time is 30 mins, each lesson is 30 mins -> should contain 1 task
      const plan1 = await request(app).get(`/api/learners/${learnerId}/daily-plan`);
      expect(plan1.status).toBe(200);
      expect(plan1.body.success).toBe(true);
      expect(plan1.body.data.learnerId).toBe(learnerId);
      expect(plan1.body.data.availableMinutes).toBe(30);
      expect(plan1.body.data.plannedMinutes).toBe(30);
      expect(plan1.body.data.tasks.length).toBe(1);
      expect(plan1.body.data.tasks[0].lessonId).toBe(lessons[0].id);
      expect(plan1.body.data.nextLessonId).toBe(lessons[0].id);
      expect(plan1.body.data.status).toBe('IN_PROGRESS');

      // Complete lesson 1
      await request(app).post(`/api/lessons/${lessons[0].id}/complete`).send({ learnerId });

      // Daily plan should now recommend lesson 2
      const plan2 = await request(app).get(`/api/learners/${learnerId}/daily-plan`);
      expect(plan2.status).toBe(200);
      expect(plan2.body.data.tasks[0].lessonId).toBe(lessons[1].id);
      expect(plan2.body.data.nextLessonId).toBe(lessons[1].id);
    });

    it('GET /api/learners/:id/daily-plan should pack multiple lessons if learner has higher daily study time', async () => {
      // Create learner with 60 minutes per day
      const learnerRes = await request(app).post('/api/learners').send({
        displayName: 'Intensive Learner',
        currentLevel: 'BEGINNER',
        learningGoal: 'Speedrun Web Dev',
        minutesPerDay: 60,
      });
      const learnerId = learnerRes.body.data.id;

      await request(app).post('/api/roadmaps').send({
        learnerId,
        skill: 'Web Development',
      });

      // 60 minutes available -> should fit 2 lessons of 30 mins each
      const res = await request(app).get(`/api/learners/${learnerId}/daily-plan`);

      expect(res.status).toBe(200);
      expect(res.body.data.availableMinutes).toBe(60);
      expect(res.body.data.plannedMinutes).toBe(60);
      expect(res.body.data.tasks.length).toBe(2);
      expect(res.body.data.tasks[0].order).toBe(1);
      expect(res.body.data.tasks[1].order).toBe(2);
    });

    it('GET /api/learners/:id/daily-plan should still recommend first lesson if lesson duration exceeds available time', async () => {
      // Create learner with only 15 minutes per day (lesson is 30 mins)
      const learnerRes = await request(app).post('/api/learners').send({
        displayName: 'Busy Learner',
        currentLevel: 'BEGINNER',
        learningGoal: 'Bite-sized learning',
        minutesPerDay: 15,
      });
      const learnerId = learnerRes.body.data.id;

      await request(app).post('/api/roadmaps').send({
        learnerId,
        skill: 'Web Development',
      });

      // First incomplete lesson should still be recommended rather than returning an empty plan
      const res = await request(app).get(`/api/learners/${learnerId}/daily-plan`);

      expect(res.status).toBe(200);
      expect(res.body.data.availableMinutes).toBe(15);
      expect(res.body.data.plannedMinutes).toBe(30);
      expect(res.body.data.tasks.length).toBe(1);
      expect(res.body.data.nextLessonId).toBeDefined();
    });

    it('GET /api/learners/:id/daily-plan should return COMPLETED status when all lessons are finished', async () => {
      const { learnerId, roadmapId } = await setupLearnerAndRoadmap();

      const lessonsRes = await request(app).get(`/api/roadmaps/${roadmapId}/lessons`);
      const lessons = lessonsRes.body.data;

      // Complete all 9 lessons
      for (const lesson of lessons) {
        await request(app).post(`/api/lessons/${lesson.id}/complete`).send({ learnerId });
      }

      const res = await request(app).get(`/api/learners/${learnerId}/daily-plan`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('COMPLETED');
      expect(res.body.data.tasks).toEqual([]);
      expect(res.body.data.nextLessonId).toBeNull();
    });

    it('GET /api/learners/:id/daily-plan should return NO_ROADMAPS when learner has no roadmaps', async () => {
      const learnerRes = await request(app).post('/api/learners').send({
        displayName: 'Learner Without Roadmap',
        currentLevel: 'BEGINNER',
        learningGoal: 'Plan pending',
      });
      const learnerId = learnerRes.body.data.id;

      const res = await request(app).get(`/api/learners/${learnerId}/daily-plan`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('NO_ROADMAPS');
      expect(res.body.data.tasks).toEqual([]);
      expect(res.body.data.nextLessonId).toBeNull();
    });

    it('GET /api/learners/:id/daily-plan should return 404 for unknown learner', async () => {
      const res = await request(app).get('/api/learners/unknown-learner-uuid/daily-plan');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
