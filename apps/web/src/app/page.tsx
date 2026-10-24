'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Compass,
  ArrowRight,
  Flame,
  Award,
  Clock,
  Sparkles,
  ChevronRight,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import { DailyPlanResponse, LearnerProgressSummary, Roadmap } from '@/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [dailyPlan, setDailyPlan] = useState<DailyPlanResponse | null>(null);
  const [progressSummary, setProgressSummary] = useState<LearnerProgressSummary | null>(null);
  const [activeRoadmap, setActiveRoadmap] = useState<Roadmap | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      if (!user) return;

      try {
        const [planRes, progRes, roadmapsRes] = await Promise.all([
          api.getDailyPlan(user.id),
          api.getLearnerProgress(user.id),
          api.getLearnerRoadmaps(user.id),
        ]);

        if (isMounted) {
          if (planRes.success && planRes.data) {
            setDailyPlan(planRes.data);
          }
          if (progRes.success && progRes.data) {
            setProgressSummary(progRes.data);
          }
          if (roadmapsRes.success && roadmapsRes.data && roadmapsRes.data.length > 0) {
            setActiveRoadmap(roadmapsRes.data[0]);
          }
        }
      } catch {
        // Graceful offline fallback
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Derived metrics
  const totalLessons = progressSummary?.totalLessons || (activeRoadmap ? activeRoadmap.milestones.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) : 12);
  const completedLessons = progressSummary?.completedLessons || 5;
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 42;

  const currentXp = user?.xp || 450;
  const currentLevelNumber = Math.max(1, Math.floor(currentXp / 150) + 1);

  // Active mission task
  const primaryTask = dailyPlan?.tasks?.[0] || {
    lessonId: 'lesson-1',
    title: 'Modern JavaScript ES6+: Async & Promises',
    durationMinutes: 25,
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Greeting & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#242039] tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'Learner'} 👋
          </h1>
          <p className="text-sm text-[#667085] mt-0.5">
            You&apos;re making consistent progress on{' '}
            <span className="font-semibold text-[#087F8C]">
              {activeRoadmap?.skill || user?.currentSkill || 'Full-Stack Web Development'}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="teal" size="md" className="gap-1.5 py-1 px-3">
            <Sparkles className="w-3.5 h-3.5 text-[#087F8C]" />
            <span>Level {currentLevelNumber} Learner</span>
          </Badge>
        </div>
      </div>

      {/* 2. Today's Mission Banner */}
      <div className="relative overflow-hidden rounded-[18px] bg-[#D6F0EF] border border-[#BCE4E2] p-6 sm:p-8">
        <div className="relative z-10 max-w-xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 text-xs font-semibold text-[#087F8C]">
            <Clock className="w-3.5 h-3.5" />
            <span>Today&apos;s Focus • {primaryTask.durationMinutes} mins estimated</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#242039] tracking-tight">
            {primaryTask.title}
          </h2>
          <p className="text-sm text-[#242039]/80 leading-relaxed">
            Master the core concepts with guided theory, interactive code walkthroughs, and a quick 3-question practice arena check.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link href={`/learn?id=${primaryTask.lessonId}`}>
              <Button
                variant="primary"
                size="md"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Continue Lesson
              </Button>
            </Link>
            <Link href="/roadmap">
              <Button variant="secondary" size="md">
                View Learning Roadmap
              </Button>
            </Link>
          </div>
        </div>

        {/* Flat decorative element */}
        <div className="absolute right-4 bottom-2 sm:bottom-4 opacity-25 sm:opacity-90 pointer-events-none">
          <svg
            className="w-40 h-40 sm:w-56 sm:h-56 text-[#087F8C]"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="4" strokeDasharray="6 6" />
            <path
              d="M70 140V90C70 73.4315 83.4315 60 100 60C116.569 60 130 73.4315 130 90V140"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <circle cx="100" cy="100" r="14" fill="#087F8C" />
            <path d="M60 150H140" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* 3. Three Compact Statistic Cards in one row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Learning Streak"
          value={`${user?.streak || 3} Days`}
          subtitle="Streak protection active"
          trend="+1 day"
          icon={<Flame className="w-4 h-4 text-[#F4A340]" />}
        />
        <StatCard
          label="Earned XP"
          value={`${currentXp} XP`}
          subtitle={`Level ${currentLevelNumber} • ${150 - (currentXp % 150)} XP to next level`}
          trend="+50 today"
          icon={<Award className="w-4 h-4 text-[#087F8C]" />}
        />
        <StatCard
          label="Roadmap Progress"
          value={`${progressPercent}%`}
          subtitle={`${completedLessons} of ${totalLessons} lessons completed`}
          trend="On track"
          icon={<Compass className="w-4 h-4 text-[#22A06B]" />}
        />
      </div>

      {/* 4. Active Milestone Sequence */}
      <Card className="p-6 bg-white border-[#E6E9E8]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#667085]">
            Curriculum Sequence
          </h3>
          <Link
            href="/roadmap"
            className="text-xs font-semibold text-[#087F8C] flex items-center gap-1 hover:underline"
          >
            <span>Full Roadmap</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {(activeRoadmap?.milestones || [
            { id: '1', title: 'Web Architecture', order: 1, estimatedDurationMinutes: 90 },
            { id: '2', title: 'JavaScript & ES6', order: 2, estimatedDurationMinutes: 120 },
            { id: '3', title: 'Frontend Components', order: 3, estimatedDurationMinutes: 150 },
            { id: '4', title: 'APIs & Backend DB', order: 4, estimatedDurationMinutes: 180 },
          ]).map((m, idx) => {
            const isCompleted = completedLessons >= (idx + 1) * 3;
            const isInProgress = !isCompleted && (idx === 0 || completedLessons >= idx * 3);
            const statusLabel = isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Upcoming';

            return (
              <div
                key={m.id || idx}
                className={`p-4 rounded-[14px] border transition-all ${
                  isInProgress
                    ? 'border-[#087F8C] bg-[#D6F0EF]/30'
                    : isCompleted
                    ? 'border-[#22A06B]/30 bg-[#E5F7EE]/30'
                    : 'border-[#E6E9E8] bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#087F8C]">0{idx + 1}</span>
                  <Badge
                    variant={isCompleted ? 'success' : isInProgress ? 'teal' : 'neutral'}
                    size="sm"
                  >
                    {statusLabel}
                  </Badge>
                </div>
                <h4 className="text-sm font-semibold text-[#242039] line-clamp-1">{m.title}</h4>
                <span className="text-xs text-[#667085] mt-1 block">
                  {m.estimatedDurationMinutes} mins
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 5. Industry-Adaptive Learning Radar */}
      <Card className="p-5 bg-gradient-to-br from-[#FAF9F5] via-white to-[#D6F0EF]/30 border-[#E6E9E8]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#087F8C] animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#087F8C]">
                Industry Adaptive Radar
              </span>
              <Badge variant="teal" size="sm">
                Live Monitoring
              </Badge>
            </div>
            <h3 className="text-base font-bold text-[#242039]">
              Real-Time Industry Technology Tracking
            </h3>
            <p className="text-xs text-[#667085] max-w-xl">
              Upwise autonomously monitors official language and framework releases to detect deprecated APIs and suggest relevant roadmap adaptations.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/roadmap">
              <Button variant="secondary" size="sm" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                Check Adaptations
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
