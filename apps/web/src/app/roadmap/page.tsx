'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Compass,
  ArrowRight,
  Sparkles,
  BookOpen,
  Clock,
  CheckCircle2,
  Plus,
  Loader2,
  AlertCircle,
  X,
  Target,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import { Roadmap, LearnerProgressSummary } from '@/types';

export default function RoadmapPage() {
  const { user } = useAuth();
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [activeRoadmap, setActiveRoadmap] = useState<Roadmap | null>(null);
  const [progressSummary, setProgressSummary] = useState<LearnerProgressSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal for creating / generating roadmap
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [skill, setSkill] = useState('Web Development');
  const [level, setLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('BEGINNER');
  const [goal, setGoal] = useState('Build personal web applications and APIs');
  const [minutesPerDay, setMinutesPerDay] = useState<number>(30);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const loadRoadmaps = useCallback(async () => {
    if (!user) return;
    try {
      const [roadmapsRes, progressRes] = await Promise.all([
        api.getLearnerRoadmaps(user.id),
        api.getLearnerProgress(user.id),
      ]);

      if (roadmapsRes.success && roadmapsRes.data && roadmapsRes.data.length > 0) {
        setRoadmaps(roadmapsRes.data);
        setActiveRoadmap(roadmapsRes.data[0]);
      } else {
        setRoadmaps([]);
        setActiveRoadmap(null);
      }

      if (progressRes.success && progressRes.data) {
        setProgressSummary(progressRes.data);
      }
    } catch {
      setError('Unable to load learning roadmaps. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadRoadmaps();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadRoadmaps]);

  const handleCreateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsCreating(true);
    setCreateError(null);

    try {
      const res = await api.createRoadmap({
        learnerId: user.id,
        skill,
        currentLevel: level,
        goal,
        minutesPerDay,
        preferredLanguage: 'English',
      });

      if (res.success && res.data) {
        setIsModalOpen(false);
        await loadRoadmaps();
      } else {
        setCreateError(res.error?.message || 'Failed to generate roadmap. Please try again.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creating roadmap.';
      setCreateError(msg);
    } finally {
      setIsCreating(false);
    }
  };

  // Calculate lesson stats
  const totalLessons = activeRoadmap?.milestones?.reduce(
    (acc, m) => acc + (m.lessons?.length || 0),
    0
  ) || 0;
  const completedLessons = progressSummary?.completedLessons || 0;
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#242039] tracking-tight">
              {activeRoadmap?.title || user?.currentSkill || 'Learning Roadmap'}
            </h1>
            <Badge variant="teal" size="sm">
              Active Path
            </Badge>
          </div>
          <p className="text-sm text-[#667085] mt-1">
            {activeRoadmap
              ? `${activeRoadmap.milestones?.length || 0} Milestones • ${totalLessons} Lessons • ${progressPercent}% Complete`
              : 'Structured step-by-step curriculum with hands-on practice'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {roadmaps.length > 1 && (
            <select
              value={activeRoadmap?.id || ''}
              onChange={(e) => {
                const found = roadmaps.find((r) => r.id === e.target.value);
                if (found) setActiveRoadmap(found);
              }}
              className="text-xs px-2.5 py-1.5 rounded-[10px] border border-[#E6E9E8] bg-white text-[#242039] focus:outline-none focus:border-[#087F8C]"
            >
              {roadmaps.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.skill}
                </option>
              ))}
            </select>
          )}
          <Button
            variant="secondary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            New Roadmap
          </Button>
          <Link href="/plan">
            <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Today&apos;s Plan
            </Button>
          </Link>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4">
          <Card className="p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-2 bg-gray-200 rounded w-3/4"></div>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-40 bg-gray-200 rounded-[14px] animate-pulse"></div>
            <div className="h-40 bg-gray-200 rounded-[14px] animate-pulse"></div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {!isLoading && error && (
        <Card className="p-4 bg-red-50 border-red-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-red-900">Connection Notice</h4>
            <p className="text-xs text-red-700">{error}</p>
          </div>
        </Card>
      )}

      {/* Empty State: No Roadmaps Found */}
      {!isLoading && !activeRoadmap && (
        <Card className="p-8 text-center space-y-4 bg-white border border-[#E6E9E8]">
          <div className="w-14 h-14 rounded-full bg-[#D6F0EF] text-[#087F8C] flex items-center justify-center mx-auto">
            <Compass className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-[#242039]">Generate Your Learning Roadmap</h3>
            <p className="text-sm text-[#667085]">
              Get a tailored curriculum with structured milestones, rich interactive lessons, code examples, and practice arenas.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            leftIcon={<Sparkles className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            Create Learning Roadmap
          </Button>
        </Card>
      )}

      {/* Active Roadmap View */}
      {!isLoading && activeRoadmap && (
        <div className="space-y-6">
          {/* Progress Overview Card */}
          <Card className="p-6 bg-gradient-to-br from-white to-[#FAF9F5] border-[#E6E9E8]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#087F8C] uppercase tracking-wider">
                    {activeRoadmap.skill}
                  </span>
                  <span className="text-xs text-[#667085]">•</span>
                  <span className="text-xs text-[#667085] font-medium">{activeRoadmap.currentLevel} Level</span>
                </div>
                <h2 className="text-lg font-bold text-[#242039] mt-0.5">{activeRoadmap.goal}</h2>
              </div>
              <div className="text-right sm:shrink-0">
                <span className="text-2xl font-bold text-[#087F8C]">{progressPercent}%</span>
                <span className="text-xs text-[#667085] block">{completedLessons} of {totalLessons} lessons completed</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#E6E9E8] rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-[#087F8C] h-2.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.max(4, progressPercent)}%` }}
              ></div>
            </div>
          </Card>

          {/* Ordered Milestones & Lessons */}
          <div className="space-y-6">
            {activeRoadmap.milestones?.map((milestone, mIdx) => (
              <Card key={milestone.id || mIdx} className="p-6 space-y-4 border-[#E6E9E8]">
                {/* Milestone Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E6E9E8]">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-[#D6F0EF] text-[#087F8C] font-bold text-xs flex items-center justify-center shrink-0">
                      {mIdx + 1}
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-[#242039]">{milestone.title}</h3>
                      <p className="text-xs text-[#667085] mt-0.5">{milestone.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <Badge variant="neutral" size="sm" className="gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{milestone.estimatedDurationMinutes} mins</span>
                    </Badge>
                  </div>
                </div>

                {/* Milestone Lessons List */}
                <div className="grid grid-cols-1 gap-2.5 pt-1">
                  {milestone.lessons?.map((lesson, lIdx) => {
                    const isLessonDone = completedLessons > (mIdx * 3 + lIdx);
                    return (
                      <div
                        key={lesson.id || lIdx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-[12px] border border-[#E6E9E8] bg-white hover:border-[#BCE4E2] hover:bg-[#FAF9F5] transition-all gap-3"
                      >
                        <div className="flex items-start sm:items-center gap-3">
                          <div className="mt-0.5 sm:mt-0">
                            {isLessonDone ? (
                              <CheckCircle2 className="w-4 h-4 text-[#22A06B]" />
                            ) : (
                              <BookOpen className="w-4 h-4 text-[#087F8C]" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold text-[#242039]">{lesson.title}</h4>
                              {isLessonDone && (
                                <Badge variant="success" size="sm">
                                  Completed
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-[#667085] line-clamp-1 mt-0.5">
                              {lesson.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          <span className="text-xs text-[#667085] flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3" />
                            {lesson.durationMinutes}m
                          </span>
                          <Link href={`/learn?id=${lesson.id}`}>
                            <Button
                              variant={isLessonDone ? 'secondary' : 'primary'}
                              size="sm"
                              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                            >
                              {isLessonDone ? 'Review' : 'Start'}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Create / Onboarding Roadmap Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-lg p-6 bg-white space-y-5 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-[#667085] hover:bg-gray-100 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-[#087F8C]" />
                <h3 className="text-xl font-bold text-[#242039]">Create Learning Roadmap</h3>
              </div>
              <p className="text-xs text-[#667085]">
                Configure your target skill and daily commitment to generate a structured curriculum.
              </p>
            </div>

            {createError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateRoadmap} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#242039] mb-1.5">
                  Target Skill
                </label>
                <select
                  value={skill}
                  onChange={(e) => setSkill(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-[10px] border border-[#E6E9E8] bg-white text-[#242039] focus:outline-none focus:border-[#087F8C]"
                >
                  <option value="Web Development">Full-Stack Web Development</option>
                  <option value="Frontend Development">Frontend Development (HTML, CSS, JS, React)</option>
                </select>
                <span className="text-[11px] text-[#667085] mt-1 block">
                  Includes web architecture, modern JavaScript ES6+, styling, and state.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#242039] mb-1.5">
                  Current Experience Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setLevel(lvl)}
                      className={`py-2 px-3 text-xs font-medium rounded-[10px] border transition-all text-center ${
                        level === lvl
                          ? 'border-[#087F8C] bg-[#D6F0EF] text-[#087F8C] font-semibold'
                          : 'border-[#E6E9E8] bg-white text-[#667085] hover:bg-[#FAF9F5]'
                      }`}
                    >
                      {lvl.charAt(0) + lvl.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#242039] mb-1.5">
                  Primary Learning Goal
                </label>
                <Input
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g. Build personal web apps and understand APIs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#242039] mb-1.5">
                  Daily Study Minutes
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setMinutesPerDay(mins)}
                      className={`py-2 text-xs font-medium rounded-[10px] border transition-all text-center ${
                        minutesPerDay === mins
                          ? 'border-[#087F8C] bg-[#D6F0EF] text-[#087F8C] font-semibold'
                          : 'border-[#E6E9E8] bg-white text-[#667085] hover:bg-[#FAF9F5]'
                      }`}
                    >
                      {mins} mins
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E6E9E8]">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isCreating}
                  leftIcon={isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                >
                  {isCreating ? 'Generating Roadmap...' : 'Generate Roadmap'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
