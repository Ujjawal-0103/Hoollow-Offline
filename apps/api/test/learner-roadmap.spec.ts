import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { setPrismaClient } from '../src/lib/prisma';
import { createMockPrismaClient } from './mock-prisma';
import { roadmapGeneratorService, UnsupportedSkillError } from '../src/services/roadmap-generator.service';

describe('Part 2: Learner Profiles & Roadmaps API', () => {
  const mockPrisma = createMockPrismaClient();

  beforeEach(() => {
    mockPrisma.clear();
    setPrismaClient(mockPrisma);
  });

  afterAll(() => {
    setPrismaClient(null);
  });

  describe('1. Learner Profile APIs', () => {
    it('POST /api/learners should create a learner profile with HTTP 201', async () => {
      const payload = {
        displayName: 'Alex Rivera',
        preferredLanguage: 'English',
        currentLevel: 'BEGINNER',
        learningGoal: 'Build a personal portfolio website',
        minutesPerDay: 30,
      };

      const res = await request(app).post('/api/learners').send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.displayName).toBe('Alex Rivera');
      expect(res.body.data.currentLevel).toBe('BEGINNER');
      expect(res.body.data.learningGoal).toBe('Build a personal portfolio website');
      expect(res.body.data.minutesPerDay).toBe(30);
      expect(res.body.data.preferredLanguage).toBe('English');
    });

    it('POST /api/learners should reject invalid input with HTTP 400', async () => {
      // Missing learningGoal and invalid level
      const invalidPayload = {
        currentLevel: 'SUPER_HERO', // invalid enum
        minutesPerDay: -10, // negative integer
      };

      const res = await request(app).post('/api/learners').send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.statusCode).toBe(400);
    });

    it('GET /api/learners/:id should return 200 with learner profile', async () => {
      // First create a learner
      const createRes = await request(app).post('/api/learners').send({
        displayName: 'Sam',
        currentLevel: 'INTERMEDIATE',
        learningGoal: 'Learn full-stack development',
        minutesPerDay: 45,
      });

      const learnerId = createRes.body.data.id;

      const res = await request(app).get(`/api/learners/${learnerId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(learnerId);
      expect(res.body.data.displayName).toBe('Sam');
      expect(res.body.data.currentLevel).toBe('INTERMEDIATE');
    });

    it('GET /api/learners/:id should return 404 for nonexistent learner', async () => {
      const res = await request(app).get('/api/learners/nonexistent-uuid-1234');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.statusCode).toBe(404);
    });

    it('PATCH /api/learners/:id/preferences should update learner preferences', async () => {
      const createRes = await request(app).post('/api/learners').send({
        displayName: 'Alex',
        currentLevel: 'BEGINNER',
        learningGoal: 'Learn Web Dev',
        minutesPerDay: 30,
      });

      const learnerId = createRes.body.data.id;

      const patchRes = await request(app)
        .patch(`/api/learners/${learnerId}/preferences`)
        .send({
          minutesPerDay: 60,
          currentLevel: 'ADVANCED',
          displayName: 'Alex Senior',
        });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.success).toBe(true);
      expect(patchRes.body.data.minutesPerDay).toBe(60);
      expect(patchRes.body.data.currentLevel).toBe('ADVANCED');
      expect(patchRes.body.data.displayName).toBe('Alex Senior');
    });

    it('PATCH /api/learners/:id/preferences should reject empty updates with HTTP 400', async () => {
      const createRes = await request(app).post('/api/learners').send({
        displayName: 'Alex',
        currentLevel: 'BEGINNER',
        learningGoal: 'Learn Web Dev',
      });

      const learnerId = createRes.body.data.id;

      const patchRes = await request(app)
        .patch(`/api/learners/${learnerId}/preferences`)
        .send({});

      expect(patchRes.status).toBe(400);
      expect(patchRes.body.success).toBe(false);
      expect(patchRes.body.error.statusCode).toBe(400);
    });

    it('PATCH /api/learners/:id/preferences should return 404 for nonexistent learner', async () => {
      const patchRes = await request(app)
        .patch('/api/learners/missing-id-9999/preferences')
        .send({
          minutesPerDay: 45,
        });

      expect(patchRes.status).toBe(404);
      expect(patchRes.body.success).toBe(false);
    });
  });

  describe('2. Roadmap Generation & Retrieval APIs', () => {
    it('POST /api/roadmaps should create a structured roadmap for a learner with HTTP 201', async () => {
      // Setup learner first
      const learnerRes = await request(app).post('/api/learners').send({
        displayName: 'Morgan',
        currentLevel: 'BEGINNER',
        learningGoal: 'Build a personal portfolio website',
        minutesPerDay: 30,
      });

      const learnerId = learnerRes.body.data.id;

      const roadmapPayload = {
        learnerId,
        skill: 'Web Development',
        currentLevel: 'BEGINNER',
        goal: 'Build a personal website',
        minutesPerDay: 30,
        preferredLanguage: 'English',
      };

      const res = await request(app).post('/api/roadmaps').send(roadmapPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.learnerId).toBe(learnerId);
      expect(res.body.data.skill).toBe('Web Development');
      expect(res.body.data.estimatedDurationMinutes).toBeGreaterThan(0);

      // Verify Milestones and nested lessons exist
      const { milestones } = res.body.data;
      expect(Array.isArray(milestones)).toBe(true);
      expect(milestones.length).toBe(3);

      // Verify Milestone 1 ordering and lessons
      expect(milestones[0].order).toBe(1);
      expect(milestones[0].title).toContain('HTML');
      expect(Array.isArray(milestones[0].lessons)).toBe(true);
      expect(milestones[0].lessons.length).toBe(3);

      // Verify Lesson 1 within Milestone 1
      const lesson1 = milestones[0].lessons[0];
      expect(lesson1.order).toBe(1);
      expect(lesson1.title).toBeDefined();
      expect(lesson1.durationMinutes).toBe(30);
      expect(Array.isArray(lesson1.learningObjectives)).toBe(true);
      expect(lesson1.learningObjectives.length).toBeGreaterThan(0);
      expect(typeof lesson1.content).toBe('string');
      expect(Array.isArray(lesson1.examples)).toBe(true);
      expect(Array.isArray(lesson1.keyTakeaways)).toBe(true);
    });

    it('POST /api/roadmaps should return 404 if learner does not exist', async () => {
      const res = await request(app).post('/api/roadmaps').send({
        learnerId: 'nonexistent-learner-id',
        skill: 'Web Development',
      });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('not found');
    });

    it('POST /api/roadmaps should return 400 for unsupported skills', async () => {
      const learnerRes = await request(app).post('/api/learners').send({
        currentLevel: 'BEGINNER',
        learningGoal: 'Astrophysics research',
      });

      const res = await request(app).post('/api/roadmaps').send({
        learnerId: learnerRes.body.data.id,
        skill: 'Quantum Computing Rocket Science',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Unsupported skill');
      expect(res.body.error.message).toContain('Web Development');
    });

    it('POST /api/roadmaps should reject invalid input with HTTP 400', async () => {
      const res = await request(app).post('/api/roadmaps').send({
        learnerId: '', // empty learnerId
        skill: '',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/roadmaps/:id should retrieve roadmap with correctly ordered milestones and lessons', async () => {
      // Create learner & roadmap
      const learnerRes = await request(app).post('/api/learners').send({
        currentLevel: 'BEGINNER',
        learningGoal: 'Portfolio',
      });

      const roadmapRes = await request(app).post('/api/roadmaps').send({
        learnerId: learnerRes.body.data.id,
        skill: 'Web Development',
      });

      const roadmapId = roadmapRes.body.data.id;

      const res = await request(app).get(`/api/roadmaps/${roadmapId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(roadmapId);

      const { milestones } = res.body.data;
      // Verify milestones are strictly sorted by order ascending: 1, 2, 3
      for (let i = 0; i < milestones.length; i++) {
        expect(milestones[i].order).toBe(i + 1);
        // Verify lessons within milestone are strictly sorted by order ascending: 1, 2, 3
        for (let j = 0; j < milestones[i].lessons.length; j++) {
          expect(milestones[i].lessons[j].order).toBe(j + 1);
        }
      }
    });

    it('GET /api/roadmaps/:id should return 404 for nonexistent roadmap', async () => {
      const res = await request(app).get('/api/roadmaps/random-missing-uuid');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.statusCode).toBe(404);
    });

    it('GET /api/learners/:id/roadmaps should list all roadmaps belonging to a learner', async () => {
      const learnerRes = await request(app).post('/api/learners').send({
        displayName: 'Taylor',
        currentLevel: 'BEGINNER',
        learningGoal: 'Web projects',
      });

      const learnerId = learnerRes.body.data.id;

      // Create 2 roadmaps for Taylor
      await request(app).post('/api/roadmaps').send({
        learnerId,
        skill: 'Web Development',
        goal: 'Website 1',
      });

      await request(app).post('/api/roadmaps').send({
        learnerId,
        skill: 'Frontend Development',
        goal: 'Website 2',
      });

      const res = await request(app).get(`/api/learners/${learnerId}/roadmaps`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0].learnerId).toBe(learnerId);
      expect(res.body.data[1].learnerId).toBe(learnerId);
    });

    it('GET /api/learners/:id/roadmaps should return empty array if learner has no roadmaps', async () => {
      const learnerRes = await request(app).post('/api/learners').send({
        displayName: 'Jordan',
        currentLevel: 'BEGINNER',
        learningGoal: 'Brand new learner',
      });

      const res = await request(app).get(`/api/learners/${learnerRes.body.data.id}/roadmaps`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(0);
    });

    it('GET /api/learners/:id/roadmaps should return 404 if learner does not exist', async () => {
      const res = await request(app).get('/api/learners/nonexistent-learner-id/roadmaps');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('not found');
    });
  });

  describe('3. Roadmap Generator Service Unit Tests', () => {
    it('should generate valid roadmap structure for Web Development', () => {
      const generated = roadmapGeneratorService.generate(
        'Web Development',
        'BEGINNER',
        'Build my personal portfolio',
        30
      );

      expect(generated.title).toContain('Web Development');
      expect(generated.skill).toBe('Web Development');
      expect(generated.currentLevel).toBe('BEGINNER');
      expect(generated.estimatedDurationMinutes).toBe(270);
      expect(generated.milestones.length).toBe(3);

      // Verify each milestone has lessons
      generated.milestones.forEach((milestone, idx) => {
        expect(milestone.order).toBe(idx + 1);
        expect(milestone.lessons.length).toBe(3);
        milestone.lessons.forEach((lesson, lIdx) => {
          expect(lesson.order).toBe(lIdx + 1);
          expect(lesson.durationMinutes).toBe(30);
          expect(lesson.learningObjectives.length).toBeGreaterThan(0);
          expect(lesson.content.length).toBeGreaterThan(50);
          expect(lesson.keyTakeaways.length).toBeGreaterThan(0);
        });
      });
    });

    it('should throw UnsupportedSkillError for unsupported skills', () => {
      expect(() => {
        roadmapGeneratorService.generate('Underwater Basket Weaving');
      }).toThrowError(UnsupportedSkillError);
    });
  });
});
