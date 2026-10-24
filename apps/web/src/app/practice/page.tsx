'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Award,
  Sparkles,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import { SafeQuiz, QuizSubmissionResult, QuestionReviewResult } from '@/types';

// Built-in interactive questions for instant practice / offline fallback
const FALLBACK_QUIZ: {
  id: string;
  title: string;
  passingScore: number;
  questions: Array<{
    id: string;
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }>;
} = {
  id: 'quiz-web-async',
  title: 'JavaScript Async, Promises & Event Loop',
  passingScore: 70,
  questions: [
    {
      id: 'q1',
      question: 'What does an async function in JavaScript always return?',
      options: [
        'A synchronous callback function',
        'A Promise object',
        'undefined unless explicitly returned',
        'A JSON string',
      ],
      correctAnswer: 'A Promise object',
      explanation:
        'Functions declared with the async keyword implicitly wrap their return value in a resolved Promise.',
    },
    {
      id: 'q2',
      question: 'What is the primary purpose of the await keyword?',
      options: [
        'To pause the entire browser rendering engine',
        'To wait for a Promise to settle and return its resolved value',
        'To convert synchronous functions into worker threads',
        'To cancel rejected HTTP requests',
      ],
      correctAnswer: 'To wait for a Promise to settle and return its resolved value',
      explanation:
        'await pauses the execution of the surrounding async function until the Promise settles without blocking the main browser thread.',
    },
    {
      id: 'q3',
      question: 'How should network errors in an async/await block be captured?',
      options: [
        'Using a try...catch block',
        'Using an if/else conditional on the window object',
        'By returning null from the catch handler',
        'JavaScript automatically suppresses network errors',
      ],
      correctAnswer: 'Using a try...catch block',
      explanation:
        'Wrapping awaited promises in a standard try...catch block guarantees that any rejected promise or network throw is handled cleanly.',
    },
  ],
};

function PracticeArena() {
  const { user, updateUserStats } = useAuth();
  const searchParams = useSearchParams();
  const lessonId = searchParams.get('lessonId');

  const [activeQuiz, setActiveQuiz] = useState<SafeQuiz | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<QuizSubmissionResult | null>(null);
  const [localReview, setLocalReview] = useState<QuestionReviewResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadQuiz() {
      setIsLoading(true);
      try {
        if (lessonId) {
          const quizzesRes = await api.getLessonQuizzes(lessonId);
          if (quizzesRes.success && quizzesRes.data && quizzesRes.data.length > 0) {
            if (isMounted) {
              setActiveQuiz(quizzesRes.data[0]);
            }
            return;
          }
        }
      } catch {
        // Fallback
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadQuiz();

    return () => {
      isMounted = false;
    };
  }, [lessonId]);

  const questions = activeQuiz
    ? activeQuiz.questions
    : FALLBACK_QUIZ.questions.map((q) => ({
        id: q.id,
        quizId: FALLBACK_QUIZ.id,
        question: q.question,
        options: q.options,
        order: 1,
      }));

  const handleSelectOption = (questionId: string, option: string) => {
    if (submissionResult || localReview) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);

    const responses = Object.entries(selectedAnswers).map(([questionId, selectedAnswer]) => ({
      questionId,
      selectedAnswer,
    }));

    try {
      if (activeQuiz) {
        const res = await api.submitQuiz(activeQuiz.id, {
          learnerId: user.id,
          responses,
        });

        if (res.success && res.data) {
          setSubmissionResult(res.data);
          updateUserStats(30);
          return;
        }
      }

      // Local fallback scoring
      let correctCount = 0;
      const review: QuestionReviewResult[] = FALLBACK_QUIZ.questions.map((q) => {
        const selected = selectedAnswers[q.id] || null;
        const isCorrect = selected === q.correctAnswer;
        if (isCorrect) correctCount++;
        return {
          questionId: q.id,
          question: q.question,
          options: q.options,
          selectedAnswer: selected,
          correctAnswer: q.correctAnswer,
          isCorrect,
          explanation: q.explanation,
        };
      });

      const scorePercent = Math.round((correctCount / FALLBACK_QUIZ.questions.length) * 100);
      setLocalReview(review);
      setSubmissionResult({
        attemptId: `attempt-${Date.now()}`,
        quizId: FALLBACK_QUIZ.id,
        learnerId: user.id,
        score: scorePercent,
        percentageScore: scorePercent,
        totalQuestions: FALLBACK_QUIZ.questions.length,
        correctAnswers: correctCount,
        submittedAt: new Date().toISOString(),
        results: review,
        review,
      });

      updateUserStats(30);
    } catch {
      setNotice('Could not connect to submission endpoint. Evaluated locally.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setSubmissionResult(null);
    setLocalReview(null);
  };

  const allAnswered = questions.length > 0 && questions.every((q) => selectedAnswers[q.id]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-12 text-center text-sm text-[#667085]">
        Loading practice questions...
      </div>
    );
  }

  const reviewItems = submissionResult?.review || submissionResult?.results || localReview;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          href={lessonId ? `/learn?id=${lessonId}` : '/'}
          className="text-xs font-semibold text-[#087F8C] flex items-center gap-1.5 hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit Arena</span>
        </Link>
        <Badge variant="teal" size="sm">
          {submissionResult ? 'Results Summary' : `${questions.length} Questions`}
        </Badge>
      </div>

      <div className="space-y-1">
        <span className="text-xs font-bold text-[#087F8C] uppercase tracking-wider">
          Practice Arena • Concept Mastery
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-[#242039]">
          {activeQuiz?.title || FALLBACK_QUIZ.title}
        </h1>
      </div>

      {notice && (
        <div className="p-3 rounded-lg bg-[#FAF9F5] border border-[#E6E9E8] text-xs text-[#667085] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#087F8C] shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Results View */}
      {submissionResult && reviewItems && (
        <Card className="p-6 space-y-6 bg-white border-[#E6E9E8]">
          <div className="flex items-center justify-between p-4 rounded-[14px] bg-[#D6F0EF]/40 border border-[#BCE4E2]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#087F8C] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                {submissionResult.percentageScore}%
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#242039]">
                  {submissionResult.percentageScore >= 70 ? 'Quiz Passed! Excellent Work' : 'Good Effort! Keep Reviewing'}
                </h3>
                <p className="text-xs text-[#667085] mt-0.5">
                  {submissionResult.correctAnswers} of {submissionResult.totalQuestions} questions correct • +30 XP awarded
                </p>
              </div>
            </div>
            <Award className="w-7 h-7 text-[#087F8C]" />
          </div>

          {/* Question by Question Review */}
          <div className="space-y-5 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#667085]">
              Question Review &amp; Explanations
            </h4>
            {reviewItems.map((item, idx) => (
              <div
                key={item.questionId || idx}
                className={`p-4 rounded-[12px] border space-y-3 ${
                  item.isCorrect
                    ? 'border-[#22A06B]/30 bg-[#E5F7EE]/20'
                    : 'border-red-200 bg-red-50/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#667085]">{idx + 1}.</span>
                    <h5 className="text-sm font-semibold text-[#242039]">{item.question}</h5>
                  </div>
                  {item.isCorrect ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-[#22A06B] shrink-0">
                      <CheckCircle2 className="w-4 h-4" /> Correct
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-semibold text-red-600 shrink-0">
                      <XCircle className="w-4 h-4" /> Missed
                    </span>
                  )}
                </div>

                <div className="text-xs space-y-1">
                  <p className="text-[#667085]">
                    Your Answer:{' '}
                    <span className={item.isCorrect ? 'text-[#22A06B] font-medium' : 'text-red-700 font-medium'}>
                      {item.selectedAnswer || 'Not answered'}
                    </span>
                  </p>
                  {!item.isCorrect && (
                    <p className="text-[#22A06B] font-medium">
                      Correct Answer: {item.correctAnswer}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-[#E6E9E8]/60 text-xs text-[#242039]/80 leading-relaxed bg-white/60 p-2.5 rounded-[8px]">
                  <strong>Explanation:</strong> {item.explanation}
                </div>
              </div>
            ))}
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-[#E6E9E8] flex flex-wrap items-center justify-between gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleReset}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Retake Quiz
            </Button>
            <div className="flex items-center gap-2">
              <Link href="/progress">
                <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  View Progress
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Taking Quiz View */}
      {!submissionResult && (
        <div className="space-y-6">
          {questions.map((q, qIdx) => (
            <Card key={q.id} className="p-6 space-y-4 bg-white border-[#E6E9E8]">
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold text-[#087F8C] mt-0.5">Q{qIdx + 1}.</span>
                <h3 className="text-sm sm:text-base font-semibold text-[#242039] leading-snug">
                  {q.question}
                </h3>
              </div>

              <div className="space-y-2.5 pt-1">
                {q.options.map((opt) => {
                  const isSelected = selectedAnswers[q.id] === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleSelectOption(q.id, opt)}
                      className={`w-full text-left p-3.5 rounded-[12px] border text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'border-[#087F8C] bg-[#D6F0EF] text-[#087F8C] font-medium'
                          : 'border-[#E6E9E8] bg-white text-[#242039] hover:bg-[#FAF9F5] hover:border-[#c2eae8]'
                      }`}
                    >
                      <span>{opt}</span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'border-[#087F8C] bg-[#087F8C]'
                            : 'border-[#E6E9E8] bg-white'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          ))}

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-[#667085]">
              {Object.keys(selectedAnswers).length} of {questions.length} answered
            </span>
            <Button
              variant="primary"
              size="md"
              disabled={!allAnswered || isSubmitting}
              onClick={handleSubmit}
              leftIcon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            >
              {isSubmitting ? 'Evaluating...' : 'Submit Answers'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto p-12 text-center text-sm text-[#667085]">
          Loading practice arena...
        </div>
      }
    >
      <PracticeArena />
    </Suspense>
  );
}
