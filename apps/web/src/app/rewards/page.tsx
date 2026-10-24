'use client';

import React, { useState, useEffect } from 'react';
import {
  Award,
  Flame,
  Star,
  Sparkles,
  Trophy,
  Target,
  Lock,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import { LearnerProgressSummary } from '@/types';

export default function RewardsPage() {
  const { user } = useAuth();
  const [progressSummary, setProgressSummary] = useState<LearnerProgressSummary | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (user) {
      api.getLearnerProgress(user.id).then((res) => {
        if (isMounted && res.success && res.data) {
          setProgressSummary(res.data);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [user]);

  const currentXp = user?.xp || 450;
  const currentStreak = user?.streak || 3;
  const completedLessons = progressSummary?.completedLessons || 5;

  const currentLevelNumber = Math.max(1, Math.floor(currentXp / 150) + 1);
  const xpIntoCurrentLevel = currentXp % 150;
  const xpForNextLevel = 150;
  const levelProgressPercent = Math.round((xpIntoCurrentLevel / xpForNextLevel) * 100);

  const badges = [
    {
      id: 'b1',
      title: 'First Step',
      desc: 'Complete your first lesson on Upwise',
      unlocked: completedLessons >= 1,
      icon: <Sparkles className="w-5 h-5 text-[#087F8C]" />,
      criteria: '1 lesson completed',
    },
    {
      id: 'b2',
      title: '3-Day Streak',
      desc: 'Maintain active learning for 3 consecutive days',
      unlocked: currentStreak >= 3,
      icon: <Flame className="w-5 h-5 text-[#F4A340]" />,
      criteria: '3-day learning streak',
    },
    {
      id: 'b3',
      title: 'Practice Champion',
      desc: 'Score passing marks on a practice arena quiz',
      unlocked: completedLessons >= 2 || currentXp >= 300,
      icon: <Award className="w-5 h-5 text-[#22A06B]" />,
      criteria: 'Pass a practice quiz',
    },
    {
      id: 'b4',
      title: 'Milestone Master',
      desc: 'Complete all lessons in your first curriculum milestone',
      unlocked: completedLessons >= 3,
      icon: <Trophy className="w-5 h-5 text-[#087F8C]" />,
      criteria: 'Complete 3 lessons',
    },
    {
      id: 'b5',
      title: 'XP Centurion',
      desc: 'Accumulate 500 or more total experience points',
      unlocked: currentXp >= 500,
      icon: <Star className="w-5 h-5 text-[#D97706]" />,
      criteria: 'Reach 500 XP',
    },
    {
      id: 'b6',
      title: 'Consistent Learner',
      desc: 'Build a solid 5-day continuous learning habit',
      unlocked: currentStreak >= 5,
      icon: <Target className="w-5 h-5 text-[#667085]" />,
      criteria: '5-day learning streak',
    },
  ];

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#242039] tracking-tight">
            Rewards &amp; Gamification
          </h1>
          <p className="text-sm text-[#667085] mt-1">
            Build consistent learning habits, earn achievements, and advance through mastery tiers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="warm" size="md" className="gap-1.5 py-1 px-3">
            <Flame className="w-3.5 h-3.5 text-[#F4A340]" />
            <span>{currentStreak} Day Streak 🔥</span>
          </Badge>
          <Badge variant="teal" size="md">
            {unlockedCount} of {badges.length} Badges Unlocked
          </Badge>
        </div>
      </div>

      {/* Level Progression Banner */}
      <Card className="p-6 bg-gradient-to-br from-[#D6F0EF]/40 via-white to-[#FAF9F5] border-[#BCE4E2] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#087F8C] uppercase tracking-wider">
                Current Standing
              </span>
              <span className="text-xs text-[#667085]">•</span>
              <span className="text-xs text-[#667085]">Level {currentLevelNumber} Learner</span>
            </div>
            <h2 className="text-xl font-bold text-[#242039]">
              {xpForNextLevel - xpIntoCurrentLevel} XP to Level {currentLevelNumber + 1}
            </h2>
            <p className="text-xs text-[#667085]">
              Earn +50 XP per completed lesson and +30 XP per cleared practice arena quiz.
            </p>
          </div>
          <div className="text-right sm:shrink-0">
            <span className="text-2xl font-bold text-[#087F8C]">{currentXp}</span>
            <span className="text-xs text-[#667085] block font-mono">Total XP Earned</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-[#667085]">
            <span>Level {currentLevelNumber}</span>
            <span>{levelProgressPercent}%</span>
            <span>Level {currentLevelNumber + 1}</span>
          </div>
          <div className="w-full bg-[#E6E9E8] rounded-full h-3 overflow-hidden">
            <div
              className="bg-[#087F8C] h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.max(6, levelProgressPercent)}%` }}
            ></div>
          </div>
        </div>
      </Card>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Learner Rank"
          value={`Level ${currentLevelNumber}`}
          subtitle={`${currentXp} total XP recorded`}
          icon={<Star className="w-4 h-4 text-[#F4A340]" />}
        />
        <StatCard
          label="Daily Streak"
          value={`${currentStreak} Days`}
          subtitle="Protected with daily practice"
          icon={<Flame className="w-4 h-4 text-[#F4A340]" />}
        />
        <StatCard
          label="Achievement Score"
          value={`${unlockedCount} / ${badges.length}`}
          subtitle={`${Math.round((unlockedCount / badges.length) * 100)}% achievements completed`}
          icon={<Trophy className="w-4 h-4 text-[#22A06B]" />}
        />
      </div>

      {/* Badge Collection Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#242039]">
            Achievement Showcase
          </h3>
          <span className="text-xs text-[#667085]">
            Badges unlock automatically when milestones are achieved
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map((b) => (
            <Card
              key={b.id}
              className={`p-5 flex flex-col justify-between space-y-4 transition-all ${
                b.unlocked
                  ? 'bg-white border-[#E6E9E8] shadow-xs'
                  : 'bg-[#FAF9F5]/70 border-dashed border-[#E6E9E8] opacity-75'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 ${
                    b.unlocked ? 'bg-[#D6F0EF]' : 'bg-[#E6E9E8]'
                  }`}
                >
                  {b.unlocked ? b.icon : <Lock className="w-5 h-5 text-[#667085]" />}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-[#242039]">{b.title}</h4>
                  </div>
                  <p className="text-xs text-[#667085] leading-relaxed">{b.desc}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E6E9E8] flex items-center justify-between">
                <span className="text-[11px] text-[#667085]">{b.criteria}</span>
                <Badge variant={b.unlocked ? 'teal' : 'neutral'} size="sm">
                  {b.unlocked ? 'Unlocked' : 'Locked'}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
