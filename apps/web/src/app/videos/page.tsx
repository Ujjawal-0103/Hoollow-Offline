'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ExternalLink,
  Play,
  Clock,
  Globe,
  Filter,
  Search,
  BookOpen,
  RotateCcw,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface VideoItem {
  id: string;
  title: string;
  channel: string;
  durationMinutes: number;
  durationLabel: string;
  language: 'English' | 'Hindi' | 'Spanish';
  topic: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  reason: string;
  url: string;
  thumbnailGradient: string;
}

const CURATED_VIDEOS: VideoItem[] = [
  {
    id: 'v1',
    title: 'JavaScript Async Await Explained in 10 Minutes',
    channel: 'Fireship',
    durationMinutes: 10,
    durationLabel: '10 mins',
    language: 'English',
    topic: 'Modern JavaScript ES6+',
    level: 'Beginner',
    reason: 'Ultra fast, visual architectural explanation of the event loop and Promise resolution.',
    url: 'https://www.youtube.com/watch?v=vn3tm0quoqE',
    thumbnailGradient: 'from-amber-500/20 to-orange-500/30',
  },
  {
    id: 'v2',
    title: 'JavaScript Promises in 100 Seconds',
    channel: 'Fireship',
    durationMinutes: 2,
    durationLabel: '2 mins',
    language: 'English',
    topic: 'Modern JavaScript ES6+',
    level: 'Beginner',
    reason: 'High-density micro-primer explaining then/catch vs modern async/await patterns.',
    url: 'https://www.youtube.com/watch?v=DHvZLI7Db8E',
    thumbnailGradient: 'from-yellow-400/20 to-amber-600/30',
  },
  {
    id: 'v3',
    title: 'HTML & CSS Full Course - Beginner to Pro',
    channel: 'SuperSimpleDev',
    durationMinutes: 45,
    durationLabel: '45 mins (Selected Chapter)',
    language: 'English',
    topic: 'HTML5 & Semantics',
    level: 'Beginner',
    reason: 'Comprehensive real-world walkthrough of modern HTML semantics and responsive page flow.',
    url: 'https://www.youtube.com/watch?v=G3e-cpL7ofc',
    thumbnailGradient: 'from-teal-500/20 to-cyan-600/30',
  },
  {
    id: 'v4',
    title: 'Complete JavaScript ES6+ Tutorial (in Hindi)',
    channel: 'Chai aur Code',
    durationMinutes: 28,
    durationLabel: '28 mins',
    language: 'Hindi',
    topic: 'Modern JavaScript ES6+',
    level: 'Beginner',
    reason: 'In-depth conceptual breakdown of JavaScript promises, fetch API, and call stack in Hindi.',
    url: 'https://www.youtube.com/watch?v=7W5P_dO2XkU',
    thumbnailGradient: 'from-emerald-500/20 to-teal-700/30',
  },
  {
    id: 'v5',
    title: 'How the Web Works: HTTP, DNS, Browsers',
    channel: 'Traversy Media',
    durationMinutes: 18,
    durationLabel: '18 mins',
    language: 'English',
    topic: 'Web Architecture',
    level: 'Beginner',
    reason: 'Clear client-server mental model explaining request headers, DNS lookups, and DOM rendering.',
    url: 'https://www.youtube.com/watch?v=e4S8NzJ3_h4',
    thumbnailGradient: 'from-indigo-500/20 to-blue-600/30',
  },
  {
    id: 'v6',
    title: 'Curso Moderno de JavaScript y Promesas (Español)',
    channel: 'midudev',
    durationMinutes: 22,
    durationLabel: '22 mins',
    language: 'Spanish',
    topic: 'Modern JavaScript ES6+',
    level: 'Beginner',
    reason: 'Hands-on Spanish language guide to modern asynchronous patterns, fetch, and error handling.',
    url: 'https://www.youtube.com/watch?v=17XmGkX4mHQ',
    thumbnailGradient: 'from-rose-500/20 to-red-600/30',
  },
];

export default function VideosPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<'ALL' | 'SHORT' | 'MEDIUM' | 'LONG'>('ALL');
  const [selectedLanguage, setSelectedLanguage] = useState<'ALL' | 'English' | 'Hindi' | 'Spanish'>('ALL');
  const [selectedTopic, setSelectedTopic] = useState<string>('ALL');

  const filteredVideos = useMemo(() => {
    return CURATED_VIDEOS.filter((video) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = video.title.toLowerCase().includes(q);
        const matchesChannel = video.channel.toLowerCase().includes(q);
        const matchesTopic = video.topic.toLowerCase().includes(q);
        if (!matchesTitle && !matchesChannel && !matchesTopic) return false;
      }

      // Duration filter
      if (selectedDuration === 'SHORT' && video.durationMinutes >= 15) return false;
      if (selectedDuration === 'MEDIUM' && (video.durationMinutes < 15 || video.durationMinutes > 30)) return false;
      if (selectedDuration === 'LONG' && video.durationMinutes <= 30) return false;

      // Language filter
      if (selectedLanguage !== 'ALL' && video.language !== selectedLanguage) return false;

      // Topic filter
      if (selectedTopic !== 'ALL' && video.topic !== selectedTopic) return false;

      return true;
    });
  }, [searchQuery, selectedDuration, selectedLanguage, selectedTopic]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDuration('ALL');
    setSelectedLanguage('ALL');
    setSelectedTopic('ALL');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#242039] tracking-tight">
            Curated Learning Videos
          </h1>
          <p className="text-sm text-[#667085] mt-1">
            High-yield educational video tutorials filtered by topic, duration, and preferred language
          </p>
        </div>
        <Badge variant="teal" size="md">
          {filteredVideos.length} Videos Available
        </Badge>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-5 space-y-4 bg-white border-[#E6E9E8]">
        {/* Search Input */}
        <div className="relative">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tutorials by title, channel, or keyword..."
            leftIcon={<Search className="w-4 h-4 text-[#667085]" />}
          />
        </div>

        {/* Filter Chips */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Duration Filter */}
          <div>
            <label className="block text-xs font-semibold text-[#242039] mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#087F8C]" />
              <span>Duration</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'ALL', label: 'Any' },
                { id: 'SHORT', label: '< 15m' },
                { id: 'MEDIUM', label: '15-30m' },
                { id: 'LONG', label: '> 30m' },
              ].map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDuration(d.id as 'ALL' | 'SHORT' | 'MEDIUM' | 'LONG')}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                    selectedDuration === d.id
                      ? 'border-[#087F8C] bg-[#D6F0EF] text-[#087F8C] font-semibold'
                      : 'border-[#E6E9E8] bg-white text-[#667085] hover:bg-[#FAF9F5]'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Language Filter */}
          <div>
            <label className="block text-xs font-semibold text-[#242039] mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#087F8C]" />
              <span>Language</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(['ALL', 'English', 'Hindi', 'Spanish'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                    selectedLanguage === lang
                      ? 'border-[#087F8C] bg-[#D6F0EF] text-[#087F8C] font-semibold'
                      : 'border-[#E6E9E8] bg-white text-[#667085] hover:bg-[#FAF9F5]'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Topic Filter */}
          <div>
            <label className="block text-xs font-semibold text-[#242039] mb-1.5 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#087F8C]" />
              <span>Topic</span>
            </label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full px-2.5 py-1 text-xs rounded-[8px] border border-[#E6E9E8] bg-white text-[#242039] focus:outline-none focus:border-[#087F8C]"
            >
              <option value="ALL">All Core Topics</option>
              <option value="Modern JavaScript ES6+">Modern JavaScript ES6+</option>
              <option value="HTML5 & Semantics">HTML5 & Semantics</option>
              <option value="Web Architecture">Web Architecture</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Videos Grid */}
      {filteredVideos.length === 0 ? (
        <Card className="p-8 text-center space-y-3 bg-white border-[#E6E9E8]">
          <h3 className="text-base font-bold text-[#242039]">No matching tutorials found</h3>
          <p className="text-xs text-[#667085]">
            Try relaxing your duration or language filters to see more recommendations.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleResetFilters}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset Filters
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredVideos.map((video) => (
            <Card
              key={video.id}
              className="p-5 flex flex-col justify-between space-y-4 hover:border-[#BCE4E2] transition-all bg-white border-[#E6E9E8]"
            >
              <div className="space-y-3">
                {/* Visual Thumbnail Frame */}
                <div
                  className={`aspect-video w-full rounded-[12px] bg-gradient-to-br ${video.thumbnailGradient} border border-[#E6E9E8] flex items-center justify-center relative overflow-hidden group`}
                >
                  <div className="w-12 h-12 rounded-full bg-[#087F8C] text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 ml-0.5 fill-white" />
                  </div>
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/75 text-white text-[11px] font-mono">
                    {video.durationLabel}
                  </div>
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-white/90 text-[#242039] text-[10px] font-bold uppercase tracking-wider">
                    {video.language}
                  </div>
                </div>

                {/* Details */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="neutral" size="sm">
                      {video.channel}
                    </Badge>
                    <span className="text-xs text-[#667085]">•</span>
                    <span className="text-xs text-[#087F8C] font-semibold">{video.topic}</span>
                  </div>
                  <h3 className="text-base font-bold text-[#242039] leading-snug">
                    {video.title}
                  </h3>
                  <p className="text-xs text-[#667085] mt-1.5 leading-relaxed">
                    <strong>Why matched:</strong> {video.reason}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#E6E9E8]">
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                  >
                    Watch on YouTube
                  </Button>
                </a>
                <Link href="/learn">
                  <Button variant="secondary" size="sm" title="Related Lesson">
                    <BookOpen className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
