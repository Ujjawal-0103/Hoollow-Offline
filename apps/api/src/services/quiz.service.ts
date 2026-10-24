import { PrismaClient, Quiz, QuizAttempt, QuizQuestion } from '@prisma/client';
import { getPrismaClient } from '../lib/prisma';
import { CreateQuizInput, SubmittedAnswerItem } from '../validators/quiz.schema';
import { LessonNotFoundError } from './lesson.service';
import { LearnerNotFoundError } from './learner.service';

export class QuizNotFoundError extends Error {
  public statusCode = 404;
  constructor(id: string) {
    super(`Quiz with ID "${id}" was not found.`);
    this.name = 'QuizNotFoundError';
  }
}

export class InvalidQuizSubmissionError extends Error {
  public statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'InvalidQuizSubmissionError';
  }
}

// Sanitized question for pre-submission (security requirement: no answers or explanations)
export type SafeQuizQuestion = Omit<QuizQuestion, 'correctAnswer' | 'explanation'>;

export interface SafeQuiz extends Omit<Quiz, 'questions'> {
  questions: SafeQuizQuestion[];
}

export interface QuestionReviewResult {
  questionId: string;
  question: string;
  options: string[];
  selectedAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
}

export interface QuizSubmissionResult {
  attemptId: string;
  quizId: string;
  learnerId: string;
  score: number; // percentage (0 to 100)
  percentageScore: number;
  totalQuestions: number;
  correctAnswers: number;
  submittedAt: Date;
  results: QuestionReviewResult[];
  review: QuestionReviewResult[];
}

export interface LearnerAttemptItem {
  id: string;
  quizId: string;
  quizTitle: string;
  lessonId: string;
  lessonTitle: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  submittedAt: Date;
}

export interface QuizBestScore {
  quizId: string;
  quizTitle: string;
  bestScore: number;
  latestScore: number;
  attemptsCount: number;
}

export interface LearnerQuizPerformance {
  learnerId: string;
  totalAttempts: number;
  uniqueQuizzesAttempted: number;
  averageScore: number;
  averagePercentageScore: number;
  latestAttempt: LearnerAttemptItem | null;
  quizScores: QuizBestScore[];
}

export class QuizService {
  constructor(private readonly prismaClient?: PrismaClient) {}

  private get client(): PrismaClient {
    return this.prismaClient ?? getPrismaClient();
  }

  /**
   * Creates a quiz and its questions for an existing lesson.
   */
  public async createQuiz(input: CreateQuizInput): Promise<Quiz & { questions: QuizQuestion[] }> {
    // 1. Verify lesson exists
    const lesson = await this.client.lesson.findUnique({
      where: { id: input.lessonId },
    });

    if (!lesson) {
      throw new LessonNotFoundError(input.lessonId);
    }

    // 2. Atomically create quiz and nested questions
    const createdQuiz = await this.client.$transaction(async (tx) => {
      const quiz = await tx.quiz.create({
        data: {
          lessonId: input.lessonId,
          title: input.title,
          description: input.description,
          questions: {
            create: input.questions.map((q) => ({
              question: q.question,
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
              order: q.order,
            })),
          },
        },
        include: {
          questions: {
            orderBy: { order: 'asc' },
          },
        },
      });

      return quiz;
    });

    return createdQuiz;
  }

  /**
   * Retrieves all quizzes associated with a lesson (sanitizes questions for client safety).
   */
  public async getQuizzesByLessonId(lessonId: string): Promise<SafeQuiz[]> {
    const lesson = await this.client.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new LessonNotFoundError(lessonId);
    }

    const quizzes = await this.client.quiz.findMany({
      where: { lessonId },
      orderBy: { createdAt: 'asc' },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return quizzes.map((quiz) => ({
      ...quiz,
      questions: quiz.questions.map((q) => ({
        id: q.id,
        quizId: q.quizId,
        question: q.question,
        options: q.options,
        order: q.order,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
      })),
    }));
  }

  /**
   * Retrieves a single quiz by ID.
   * SECURITY: Strips correctAnswer and explanation from questions before submission.
   */
  public async getQuizById(quizId: string): Promise<SafeQuiz> {
    const quiz = await this.client.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!quiz) {
      throw new QuizNotFoundError(quizId);
    }

    return {
      ...quiz,
      questions: quiz.questions.map((q) => ({
        id: q.id,
        quizId: q.quizId,
        question: q.question,
        options: q.options,
        order: q.order,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
      })),
    };
  }

  /**
   * Submits a quiz attempt, calculates score on server, persists atomically, and returns review feedback.
   */
  public async submitQuiz(
    quizId: string,
    learnerId: string,
    answers: SubmittedAnswerItem[]
  ): Promise<QuizSubmissionResult> {
    // 1. Confirm learner exists
    const learner = await this.client.learner.findUnique({
      where: { id: learnerId },
    });

    if (!learner) {
      throw new LearnerNotFoundError(learnerId);
    }

    // 2. Confirm quiz exists with all questions (including secret answers)
    const quiz = await this.client.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!quiz) {
      throw new QuizNotFoundError(quizId);
    }

    // 3. Build question lookup map and validate submitted answers
    const questionMap = new Map<string, QuizQuestion>();
    for (const q of quiz.questions) {
      questionMap.set(q.id, q);
    }

    const answerMap = new Map<string, string>();
    for (const item of answers) {
      const question = questionMap.get(item.questionId);
      if (!question) {
        throw new InvalidQuizSubmissionError(
          `Submitted question ID "${item.questionId}" does not belong to quiz "${quizId}".`
        );
      }
      if (!question.options.includes(item.selectedAnswer)) {
        throw new InvalidQuizSubmissionError(
          `Selected answer "${item.selectedAnswer}" is not a valid option for question "${item.questionId}".`
        );
      }
      answerMap.set(item.questionId, item.selectedAnswer);
    }

    // 4. Calculate correctness across all quiz questions (unanswered count as incorrect)
    const totalQuestions = quiz.questions.length;
    let correctCount = 0;
    const reviewResults: QuestionReviewResult[] = [];
    const responseDataToPersist: Array<{
      questionId: string;
      selectedAnswer: string;
      isCorrect: boolean;
    }> = [];

    for (const q of quiz.questions) {
      const selected = answerMap.get(q.id);
      const isCorrect = selected !== undefined && selected === q.correctAnswer;
      if (isCorrect) {
        correctCount++;
      }

      reviewResults.push({
        questionId: q.id,
        question: q.question,
        options: q.options,
        selectedAnswer: selected || null,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation,
      });

      if (selected !== undefined) {
        responseDataToPersist.push({
          questionId: q.id,
          selectedAnswer: selected,
          isCorrect,
        });
      }
    }

    const percentageScore = totalQuestions === 0
      ? 0
      : Math.round((correctCount / totalQuestions) * 100);

    // 5. Persist attempt and individual responses atomically via transaction
    const attempt = await this.client.$transaction(async (tx) => {
      const created = await tx.quizAttempt.create({
        data: {
          learnerId,
          quizId,
          score: percentageScore,
          totalQuestions,
          correctAnswers: correctCount,
          responses: {
            create: responseDataToPersist.map((r) => ({
              questionId: r.questionId,
              selectedAnswer: r.selectedAnswer,
              isCorrect: r.isCorrect,
            })),
          },
        },
      });

      return created;
    });

    return {
      attemptId: attempt.id,
      quizId,
      learnerId,
      score: percentageScore,
      percentageScore,
      totalQuestions,
      correctAnswers: correctCount,
      submittedAt: attempt.submittedAt,
      results: reviewResults,
      review: reviewResults,
    };
  }

  /**
   * Retrieves a learner's quiz attempt history ordered newest first.
   */
  public async getLearnerAttempts(learnerId: string): Promise<LearnerAttemptItem[]> {
    const learner = await this.client.learner.findUnique({
      where: { id: learnerId },
    });

    if (!learner) {
      throw new LearnerNotFoundError(learnerId);
    }

    const attempts = await this.client.quizAttempt.findMany({
      where: { learnerId },
      orderBy: { submittedAt: 'desc' },
      include: {
        quiz: {
          include: {
            lesson: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    return attempts.map((a) => ({
      id: a.id,
      quizId: a.quizId,
      quizTitle: a.quiz.title,
      lessonId: a.quiz.lesson.id,
      lessonTitle: a.quiz.lesson.title,
      score: a.score,
      totalQuestions: a.totalQuestions,
      correctAnswers: a.correctAnswers,
      submittedAt: a.submittedAt,
    }));
  }

  /**
   * Aggregates quiz performance metrics for a learner.
   */
  public async getLearnerPerformance(learnerId: string): Promise<LearnerQuizPerformance> {
    const learner = await this.client.learner.findUnique({
      where: { id: learnerId },
    });

    if (!learner) {
      throw new LearnerNotFoundError(learnerId);
    }

    const attempts = await this.getLearnerAttempts(learnerId);

    if (attempts.length === 0) {
      return {
        learnerId,
        totalAttempts: 0,
        uniqueQuizzesAttempted: 0,
        averageScore: 0,
        averagePercentageScore: 0,
        latestAttempt: null,
        quizScores: [],
      };
    }

    const totalAttempts = attempts.length;
    const totalScore = attempts.reduce((acc, curr) => acc + curr.score, 0);
    const averageScore = Math.round(totalScore / totalAttempts);
    const latestAttempt = attempts[0]; // ordered newest first

    // Aggregate by quizId for best scores
    const quizMap = new Map<string, {
      quizId: string;
      quizTitle: string;
      scores: number[];
      latestScore: number;
    }>();

    for (const a of attempts) {
      const existing = quizMap.get(a.quizId);
      if (!existing) {
        quizMap.set(a.quizId, {
          quizId: a.quizId,
          quizTitle: a.quizTitle,
          scores: [a.score],
          latestScore: a.score, // first encountered is newest
        });
      } else {
        existing.scores.push(a.score);
      }
    }

    const quizScores: QuizBestScore[] = Array.from(quizMap.values()).map((q) => ({
      quizId: q.quizId,
      quizTitle: q.quizTitle,
      bestScore: Math.max(...q.scores),
      latestScore: q.latestScore,
      attemptsCount: q.scores.length,
    }));

    return {
      learnerId,
      totalAttempts,
      uniqueQuizzesAttempted: quizMap.size,
      averageScore,
      averagePercentageScore: averageScore,
      latestAttempt,
      quizScores,
    };
  }
}

export const quizService = new QuizService();
