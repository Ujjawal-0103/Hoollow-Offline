'use client';

import React from 'react';
import Link from 'next/link';
import {
  Search,
  Bell,
  Wifi,
  WifiOff,
  Flame,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Badge } from '@/components/ui/badge';

interface TopbarProps {
  onMobileMenuToggle?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMobileMenuToggle }) => {
  const { user, isAuthenticated, isOnline, loginWithDemoAccount } = useAuth();

  return (
    <header className="h-16 px-4 md:px-8 bg-white/80 backdrop-blur-md border-b border-[#E6E9E8] sticky top-0 z-20 flex items-center justify-between gap-4">
      {/* Left: Mobile hamburger & Search bar */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        {onMobileMenuToggle && (
          <button
            onClick={onMobileMenuToggle}
            className="md:hidden p-2 text-[#667085] hover:text-[#242039] rounded-lg hover:bg-[#FAF9F5]"
            aria-label="Open navigation menu"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        )}

        <div className="relative w-full">
          <Search className="w-4 h-4 text-[#667085] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search lessons, concepts, roadmap topics..."
            className="w-full pl-9 pr-4 py-1.5 text-xs md:text-sm bg-[#FAF9F5] rounded-[10px] border border-[#E6E9E8] focus:border-[#087F8C] focus:bg-white focus:ring-2 focus:ring-[#D6F0EF] transition-all outline-none text-[#242039] placeholder-[#667085]/70"
          />
        </div>
      </div>

      {/* Right Controls: Connectivity, Streak, Notifications, Profile */}
      <div className="flex items-center gap-2.5 md:gap-4 shrink-0">
        {/* Backend Connectivity Status Pill */}
        <div
          title={
            isOnline
              ? 'Backend API Connected (port 3001)'
              : 'Offline / Mock Adapter Mode active'
          }
          className="hidden sm:flex items-center"
        >
          {isOnline ? (
            <Badge variant="success" size="sm" className="gap-1">
              <Wifi className="w-3 h-3 text-[#22A06B]" />
              <span>API Live</span>
            </Badge>
          ) : (
            <Badge variant="neutral" size="sm" className="gap-1 bg-[#FAF9F5] border border-[#E6E9E8]">
              <WifiOff className="w-3 h-3 text-[#667085]" />
              <span>Mock Mode</span>
            </Badge>
          )}
        </div>

        {/* Streak Indicator */}
        {user && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FEF3E6] border border-[#FDE68A]/60 text-xs font-bold text-[#D97706]">
            <Flame className="w-3.5 h-3.5 fill-[#F4A340] text-[#D97706]" />
            <span>{user.streak}d Streak</span>
          </div>
        )}

        {/* Notification Bell */}
        <button
          className="p-2 text-[#667085] hover:text-[#242039] rounded-full hover:bg-[#FAF9F5] transition-colors relative"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-[#087F8C] absolute top-1.5 right-1.5 ring-2 ring-white"></span>
        </button>

        {/* User Pill / Login Button */}
        {isAuthenticated && user ? (
          <Link
            href="/progress"
            className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full hover:bg-[#FAF9F5] border border-transparent hover:border-[#E6E9E8] transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-[#087F8C] text-white flex items-center justify-center font-bold text-xs">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-semibold text-[#242039] leading-tight">
                {user.name}
              </span>
              <span className="text-[10px] text-[#087F8C] font-medium leading-tight">
                {user.xp} XP
              </span>
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={loginWithDemoAccount}
              className="text-xs font-semibold text-[#087F8C] hover:underline px-2 py-1 cursor-pointer"
            >
              Quick Demo
            </button>
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-[10px] bg-[#087F8C] text-white text-xs font-semibold hover:bg-[#066772] transition-colors"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
