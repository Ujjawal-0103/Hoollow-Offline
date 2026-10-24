import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { setPrismaClient } from '../src/lib/prisma';
import { createMockPrismaClient } from './mock-prisma';

describe('Part 4: Quiz & Assessment System API', () => {
  const mockPrisma = createMockPrismaClient();

  beforeEach(() => {
    mockPrisma.clear();
    setPrismaClient(mockPrisma);
  });

  afterAll(() => {
    setPrismaClient(null);
  });

  // Helper to create learner, roadmap, milestone, and lesson
  async function setupLessonAndLearner() {
    const learnerRes = await request(app).post('/api/learners').send({
      displayName: 'Alex Learner',
      preferredLanguage: 'English',
      currentLevel: 'BEGINNER',
      learningGoal: 'Master TypeScript',
      minutesPerDay: 45,
    });
    const learnerId = learnerRes.body.data.id;

    const roadmapRes = await request(app).post('/api/roadmaps').send({
      learnerId,
      skill: 'Web Development',
    });
    const roadmapId = roadmapRes.body.data.id;

    // Fetch lessons for this roadmap
    const lessonsRes = await request(app).get(`/api/roadmaps/${roadmapId}/lessons`);
    const lesson = lessonsRes.body.data[0];

    return { learnerId, roadmapId, lessonId: lesson.id, lessonTitle: lesson.title };
  }

  // Sample valid question definitions
  const sampleQuestions = [
    {
      question: 'What is TypeScript?',
      options: [
        'A typed superset of JavaScript',
        'A styling framework for CSS',
        'A database engine',
        'An operating system kernel',
      ],
      correctAnswer: 'A typed superset of JavaScript',
      explanation: 'TypeScript adds optional static types to JavaScript.',
      order: 1,
    },
    {
      question: 'Which file extension is standard for TypeScript React files?',
      options: ['.ts', '.tsx', '.jsx', '.json'],
      correctAnswer: '.tsx',
      explanation: '.tsx is used for TypeScript files containing JSX elements.',
      order: 2,
    },
  ];

  describe('1. Quiz Creation (POST /api/quizzes)', () => {
    it('should successfully create a quiz and its questions for an existing lesson', async () => {
      const { lessonId } = await setupLessonAndLearner();

      const res = await request(app)
        .post('/api/quizzes')
        .send({
          lessonId,
          title: 'TypeScript Basics Quiz',
          description: 'Assess foundational TypeScript concepts',
          questions: sampleQuestions,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.lessonId).toBe(lessonId);
      expect(res.body.data.title).toBe('TypeScript Basics Quiz');
      expect(res.body.data.questions).toHaveLength(2);
      expect(res.body.data.questions[0].order).toBe(1);
      expect(res.body.data.questions[0].options).toHaveLength(4);
      expect(res.body.data.questions[0].correctAnswer).toBe('A typed superset of JavaScript');
    });

    it('should return 404 if the target lesson does not exist', async () => {
      const res = await request(app)
        .post('/api/quizzes')
        .send({
          lessonId: 'non-existent-lesson-id',
          title: 'Orphan Quiz',
          questions: sampleQuestions,
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/lesson.*was not found/i);
    });

    it('should reject quiz creation when title or question is empty', async () => {
      const { lessonId } = await setupLessonAndLearner();

      const resEmptyTitle = await request(app)
        .post('/api/quizzes')
        .send({
          lessonId,
          title: '',
          questions: sampleQuestions,
        });
      expect(resEmptyTitle.status).toBe(400);

      const resEmptyQuestion = await request(app)
        .post('/api/quizzes')
        .send({
          lessonId,
          title: 'Valid Title',
          questions: [
            {
              question: '   ',
              options: ['A', 'B', 'C', 'D'],
              correctAnswer: 'A',
              explanation: 'Exp',
              order: 1,
            },
          ],
        });
      expect(resEmptyQuestion.status).toBe(400);
    });

    it('should reject questions without exactly 4 distinct options', async () => {
      const { lessonId } = await setupLessonAndLearner();

      // Only 3 options
      const res3Options = await request(app)
        .post('/api/quizzes')
        .send({
          lessonId,
          title: '3 Options Quiz',
          questions: [
            {
              question: 'Question?',
              options: ['Option 1', 'Option 2', 'Option 3'],
              correctAnswer: 'Option 1',
              explanation: 'Exp',
              order: 1,
            },
          ],
        });
      expect(res3Options.status).toBe(400);

      // 4 options with duplicates
      const resDuplicateOptions = await request(app)
        .post('/api/quizzes')
        .send({
          lessonId,
          title: 'Duplicate Options Quiz',
          questions: [
            {
              question: 'Question?',
              options: ['Option 1', 'Option 1', 'Option 2', 'Option 3'],
              correctAnswer: 'Option 1',
              explanation: 'Exp',
              order: 1,
            },
          ],
        });
      expect(resDuplicateOptions.status).toBe(400);
    });

    it('should reject question when correctAnswer does not match any of the four options', async () => {
      const { lessonId } = await setupLessonAndLearner();

      const res = await request(app)
        .post('/api/quizzes')
        .send({
          lessonId,
          title: 'Mismatched Answer Quiz',
          questions: [
            {
              question: 'Question?',
              options: ['Option A', 'Option B', 'Option C', 'Option D'],
              correctAnswer: 'Option Z', // Not in options
              explanation: 'Exp',
              order: 1,
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Quiz Retrieval & Pre-submission Security', () => {
    it('GET /api/quizzes/:id should NEVER leak correctAnswer or explanation', async () => {
      const { lessonId } = await setupLessonAndLearner();

      const createRes = await request(app).post('/api/quizzes').send({
        lessonId,
        title: 'Security Test Quiz',
        questions: sampleQuestions,
      });
      const quizId = createRes.body.data.id;

      const res = await request(app).get(`/api/quizzes/${quizId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(quizId);
      expect(res.body.data.title).toBe('Security Test Quiz');
      expect(res.body.data.questions).toHaveLength(2);

      // Verify no secret answer fields leak
      res.body.data.questions.forEach((q: any) => {
        expect(q.correctAnswer).toBeUndefined();
        expect(q.explanation).toBeUndefined();
        expect(q.isCorrect).toBeUndefined();
        expect(q.options).toHaveLength(4);
        expect(q.question).toBeDefined();
        expect(q.order).toBeDefined();
      });
    });

    it('GET /api/lessons/:id/quiz should return quizzes for a lesson with sanitized questions', async () => {
      const { lessonId } = await setupLessonAndLearner();

      await request(app).post('/api/quizzes').send({
        lessonId,
        title: 'Lesson Quiz 1',
        questions: sampleQuestions,
      });

      const res = await request(app).get(`/api/lessons/${lessonId}/quiz`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      const quiz = res.body.data[0];
      expect(quiz.title).toBe('Lesson Quiz 1');
      quiz.questions.forEach((q: any) => {
        expect(q.correctAnswer).toBeUndefined();
        expect(q.explanation).toBeUndefined();
      });
    });

    it('GET /api/quizzes/:id should return 404 for non-existent quiz', async () => {
      const res = await request(app).get('/api/quizzes/non-existent-quiz-id');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/lessons/:id/quiz should return 404 if lesson does not exist', async () => {
      const res = await request(app).get('/api/lessons/non-existent-lesson-id/quiz');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('3. Quiz Submission & Server Evaluation (POST /api/quizzes/:id/submit)', () => {
    it('should accurately calculate 100% score for all correct answers and return post-submission review', async () => {
      const { learnerId, lessonId } = await setupLessonAndLearner();

      const createRes = await request(app).post('/api/quizzes').send({
        lessonId,
        title: 'Full Score Test Quiz',
        questions: sampleQuestions,
      });
      const quiz = createRes.body.data;
      const q1 = quiz.questions[0];
      const q2 = quiz.questions[1];

      const res = await request(app)
        .post(`/api/quizzes/${quiz.id}/submit`)
        .send({
          learnerId,
          answers: [
            { questionId: q1.id, selectedAnswer: 'A typed superset of JavaScript' },
            { questionId: q2.id, selectedAnswer: '.tsx' },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.attemptId).toBeDefined();
      expect(res.body.data.totalQuestions).toBe(2);
      expect(res.body.data.correctAnswers).toBe(2);
      expect(res.body.data.percentageScore).toBe(100);

      // Verify review details contain correctness and explanation
      const review = res.body.data.review;
      expect(review).toHaveLength(2);
      expect(review[0].isCorrect).toBe(true);
      expect(review[0].correctAnswer).toBe('A typed superset of JavaScript');
      expect(review[0].explanation).toBe('TypeScript adds optional static types to JavaScript.');
      expect(review[1].isCorrect).toBe(true);
      expect(review[1].correctAnswer).toBe('.tsx');
    });

    it('should accurately calculate 50% score for 1 correct and 1 incorrect answer', async () => {
      const { learnerId, lessonId } = await setupLessonAndLearner();

      const createRes = await request(app).post('/api/quizzes').send({
        lessonId,
        title: 'Partial Score Test Quiz',
        questions: sampleQuestions,
      });
      const quiz = createRes.body.data;
      const q1 = quiz.questions[0];
      const q2 = quiz.questions[1];

      const res = await request(app)
        .post(`/api/quizzes/${quiz.id}/submit`)
        .send({
          learnerId,
          answers: {
            [q1.id]: 'A typed superset of JavaScript', // Correct
            [q2.id]: '.ts', // Incorrect (correct is .tsx)
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalQuestions).toBe(2);
      expect(res.body.data.correctAnswers).toBe(1);
      expect(res.body.data.percentageScore).toBe(50);

      const review = res.body.data.review;
      expect(review[0].isCorrect).toBe(true);
      expect(review[1].isCorrect).toBe(false);
      expect(review[1].selectedAnswer).toBe('.ts');
      expect(review[1].correctAnswer).toBe('.tsx');
    });

    it('should count unanswered questions as incorrect', async () => {
      const { learnerId, lessonId } = await setupLessonAndLearner();

      const createRes = await request(app).post('/api/quizzes').send({
        lessonId,
        title: 'Unanswered Questions Quiz',
        questions: sampleQuestions, // 2 questions total
      });
      const quiz = createRes.body.data;
      const q1 = quiz.questions[0];

      // Submit only question 1
      const res = await request(app)
        .post(`/api/quizzes/${quiz.id}/submit`)
        .send({
          learnerId,
          answers: [{ questionId: q1.id, selectedAnswer: 'A typed superset of JavaScript' }],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.totalQuestions).toBe(2);
      expect(res.body.data.correctAnswers).toBe(1);
      expect(res.body.data.percentageScore).toBe(50);
      expect(res.body.data.review).toHaveLength(2);

      const unansweredReview = res.body.data.review.find((r: any) => r.questionId === quiz.questions[1].id);
      expect(unansweredReview.selectedAnswer).toBeNull();
      expect(unansweredReview.isCorrect).toBe(false);
    });

    it('should reject submission if learner does not exist', async () => {
      const { lessonId } = await setupLessonAndLearner();
      const createRes = await request(app).post('/api/quizzes').send({
        lessonId,
        title: 'Learner Check Quiz',
        questions: sampleQuestions,
      });

      const res = await request(app)
        .post(`/api/quizzes/${createRes.body.data.id}/submit`)
        .send({
          learnerId: 'non-existent-learner-id',
          answers: [{ questionId: createRes.body.data.questions[0].id, selectedAnswer: 'A' }],
        });

      expect(res.status).toBe(404);
      expect(res.body.error.message).toMatch(/learner.*was not found/i);
    });

    it('should reject submission if quiz does not exist', async () => {
      const { learnerId } = await setupLessonAndLearner();

      const res = await request(app)
        .post('/api/quizzes/non-existent-quiz-id/submit')
        .send({
          learnerId,
          answers: [{ questionId: 'q-id', selectedAnswer: 'A' }],
        });

      expect(res.status).toBe(404);
      expect(res.body.error.message).toMatch(/quiz.*was not found/i);
    });

    it('should reject empty or missing answer submission', async () => {
      const { learnerId, lessonId } = await setupLessonAndLearner();
      const createRes = await request(app).post('/api/quizzes').send({
        lessonId,
        title: 'Empty Answer Quiz',
        questions: sampleQuestions,
      });

      const res = await request(app)
        .post(`/api/quizzes/${createRes.body.data.id}/submit`)
        .send({
          learnerId,
          answers: [],
        });

      expect(res.status).toBe(400);
    });

    it('should reject question IDs that do not belong to the quiz', async () => {
      const { learnerId, lessonId } = await setupLessonAndLearner();
      const createRes = await request(app).post('/api/quizzes').send({
        lessonId,
        title: 'Cross Quiz Question Test',
        questions: sampleQuestions,
      });

      const res = await request(app)
        .post(`/api/quizzes/${createRes.body.data.id}/submit`)
        .send({
          learnerId,
          answers: [
            {
              questionId: 'unrelated-foreign-question-id',
              selectedAnswer: 'Some Answer',
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('does not belong to quiz');
    });

    it('should reject invalid selected answers not in question options', async () => {
      const { learnerId, lessonId } = await setupLessonAndLearner();
      const createRes = await request(app).post('/api/quizzes').send({
        lessonId,
        title: 'Invalid Option Test Quiz',
        questions: sampleQuestions,
      });
      const q1 = createRes.body.data.questions[0];

      const res = await request(app)
        .post(`/api/quizzes/${createRes.body.data.id}/submit`)
        .send({
          learnerId,
          answers: [
            {
              questionId: q1.id,
              selectedAnswer: 'Completely Invalid Option',
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('is not a valid option');
    });

    it('should reject duplicate question answers in one submission', async () => {
      const { learnerId, lessonId } = await setupLessonAndLearner();
      const createRes = await request(app).post('/api/quizzes').send({
        lessonId,
        title: 'Duplicate Submission Quiz',
        questions: sampleQuestions,
      });
      const q1 = createRes.body.data.questions[0];

      const res = await request(app)
        .post(`/api/quizzes/${createRes.body.data.id}/submit`)
        .send({
          learnerId,
          answers: [
            { questionId: q1.id, selectedAnswer: q1.options[0] },
            { questionId: q1.id, selectedAnswer: q1.options[1] },
          ],
        });

      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body.error)).toMatch(/duplicate.*answer/i);
    });
  });

  describe('4. Attempt History & Repeated Attempts (GET /api/learners/:id/quiz-attempts)', () => {
    it('should record multiple attempts and return them ordered newest first with lesson context', async () => {
      const { learnerId, lessonId, lessonTitle } = await setupLessonAndLearner();

      const createRes = await request(app).post('/api/quizzes').send({
        lessonId,
        title: 'History Test Quiz',
        questions: sampleQuestions,
      });
      const quiz = createRes.body.data;
      const q1 = quiz.questions[0];
      const q2 = quiz.questions[1];

      // Attempt 1: 50%
      await request(app)
        .post(`/api/quizzes/${quiz.id}/submit`)
        .send({
          learnerId,
          answers: [
            { questionId: q1.id, selectedAnswer: 'A typed superset of JavaScript' },
            { questionId: q2.id, selectedAnswer: '.ts' },
          ],
        });

      // Attempt 2: 100%
      await request(app)
        .post(`/api/quizzes/${quiz.id}/submit`)
        .send({
          learnerId,
          answers: [
            { questionId: q1.id, selectedAnswer: 'A typed superset of JavaScript' },
            { questionId: q2.id, selectedAnswer: '.tsx' },
          ],
        });

      const historyRes = await request(app).get(`/api/learners/${learnerId}/quiz-attempts`);

      expect(historyRes.status).toBe(200);
      expect(historyRes.body.success).toBe(true);
      expect(historyRes.body.data).toHaveLength(2);

      const attempts = historyRes.body.data;
      // Newest first: Attempt 2 (100) then Attempt 1 (50)
      expect(attempts[0].score).toBe(100);
      expect(attempts[1].score).toBe(50);
      expect(attempts[0].quizTitle).toBe('History Test Quiz');
      expect(attempts[0].lessonId).toBe(lessonId);
      expect(attempts[0].lessonTitle).toBe(lessonTitle);
      expect(new Date(attempts[0].submittedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(attempts[1].submittedAt).getTime()
      );
    });

    it('should return empty array for learner with no attempts', async () => {
      const { learnerId } = await setupLessonAndLearner();

      const res = await request(app).get(`/api/learners/${learnerId}/quiz-attempts`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });

    it('should return 404 for non-existent learner', async () => {
      const res = await request(app).get('/api/learners/non-existent-learner/quiz-attempts');
      expect(res.status).toBe(404);
    });
  });

  describe('5. Aggregate Performance (GET /api/learners/:id/quiz-performance)', () => {
    it('should safely handle learner with zero attempts', async () => {
      const { learnerId } = await setupLessonAndLearner();

      const res = await request(app).get(`/api/learners/${learnerId}/quiz-performance`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.learnerId).toBe(learnerId);
      expect(res.body.data.totalAttempts).toBe(0);
      expect(res.body.data.uniqueQuizzesAttempted).toBe(0);
      expect(res.body.data.averagePercentageScore).toBe(0);
      expect(res.body.data.latestAttempt).toBeNull();
      expect(res.body.data.quizScores).toEqual([]);
    });

    it('should calculate correct aggregate statistics across multiple attempts and quizzes', async () => {
      const { learnerId, lessonId } = await setupLessonAndLearner();

      // Quiz 1
      const q1Res = await request(app).post('/api/quizzes').send({
        lessonId,
        title: 'Performance Quiz 1',
        questions: sampleQuestions,
      });
      const quiz1 = q1Res.body.data;

      // Quiz 2
      const q2Res = await request(app).post('/api/quizzes').send({
        lessonId,
        title: 'Performance Quiz 2',
        questions: sampleQuestions,
      });
      const quiz2 = q2Res.body.data;

      // Submit Quiz 1 twice: 50%, then 100%
      await request(app)
        .post(`/api/quizzes/${quiz1.id}/submit`)
        .send({
          learnerId,
          answers: [
            { questionId: quiz1.questions[0].id, selectedAnswer: 'A typed superset of JavaScript' },
            { questionId: quiz1.questions[1].id, selectedAnswer: '.ts' },
          ],
        });

      await request(app)
        .post(`/api/quizzes/${quiz1.id}/submit`)
        .send({
          learnerId,
          answers: [
            { questionId: quiz1.questions[0].id, selectedAnswer: 'A typed superset of JavaScript' },
            { questionId: quiz1.questions[1].id, selectedAnswer: '.tsx' },
          ],
        });

      // Submit Quiz 2 once: 50%
      await request(app)
        .post(`/api/quizzes/${quiz2.id}/submit`)
        .send({
          learnerId,
          answers: [
            { questionId: quiz2.questions[0].id, selectedAnswer: 'A typed superset of JavaScript' },
            { questionId: quiz2.questions[1].id, selectedAnswer: '.ts' },
          ],
        });

      const res = await request(app).get(`/api/learners/${learnerId}/quiz-performance`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalAttempts).toBe(3);
      expect(res.body.data.uniqueQuizzesAttempted).toBe(2);
      // Average score: (50 + 100 + 50) / 3 = 66.666... -> 67%
      expect(res.body.data.averagePercentageScore).toBe(67);
      expect(res.body.data.latestAttempt).toBeDefined();
      expect(res.body.data.latestAttempt.quizTitle).toBe('Performance Quiz 2');

      // Best scores per quiz
      const quiz1Score = res.body.data.quizScores.find((q: any) => q.quizId === quiz1.id);
      expect(quiz1Score).toBeDefined();
      expect(quiz1Score.bestScore).toBe(100);
      expect(quiz1Score.attemptsCount).toBe(2);

      const quiz2Score = res.body.data.quizScores.find((q: any) => q.quizId === quiz2.id);
      expect(quiz2Score).toBeDefined();
      expect(quiz2Score.bestScore).toBe(50);
      expect(quiz2Score.attemptsCount).toBe(1);
    });
  });
});
