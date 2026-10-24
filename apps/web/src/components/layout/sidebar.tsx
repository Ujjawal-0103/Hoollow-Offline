'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Compass,
  CalendarCheck,
  BookOpen,
  Award,
  BarChart3,
  RotateCcw,
  Video,
  Flame,
  LogOut,
  LogIn,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';

export const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'My Roadmap', href: '/roadmap', icon: Compass },
  { name: "Today's Plan", href: '/plan', icon: CalendarCheck, badge: 'Daily' },
  { name: 'In-App Learning', href: '/learn', icon: BookOpen },
  { name: 'Practice Arena', href: '/practice', icon: Award },
  { name: 'Progress', href: '/progress', icon: BarChart3 },
  { name: 'Smart Revision', href: '/revision', icon: RotateCcw },
  { name: 'Recommended Videos', href: '/videos', icon: Video },
  { name: 'Rewards & Streaks', href: '/rewards', icon: Flame },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-[240px] shrink-0 border-r border-[#E6E9E8] bg-white h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-[#E6E9E8]">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-[10px] bg-[#087F8C] flex items-center justify-center text-white font-bold shadow-sm group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-[#242039] tracking-tight leading-tight">
              Upwise
            </span>
            <span className="text-[10px] font-medium text-[#087F8C] tracking-wide">
              AI Learning
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider uppercase text-[#667085]">
          Learning Journey
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-[12px] text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-[#D6F0EF] text-[#087F8C] font-semibold'
                  : 'text-[#667085] hover:text-[#242039] hover:bg-[#FAF9F5]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-[#087F8C]' : 'text-[#667085]'
                  }`}
                />
                <span className="truncate">{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive
                      ? 'bg-[#087F8C] text-white'
                      : 'bg-[#FAF9F5] text-[#087F8C] border border-[#D6F0EF]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer / User Profile & Status */}
      <div className="p-3 border-t border-[#E6E9E8] bg-white">
        {isAuthenticated && user ? (
          <div className="bg-[#FAF9F5] border border-[#E6E9E8] rounded-[14px] p-3 flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#087F8C] text-white flex items-center justify-center font-bold text-sm shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-semibold text-[#242039] truncate">
                  {user.name}
                </span>
                <span className="text-[11px] text-[#667085] truncate">
                  {user.level} • {user.xp} XP
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-[#E6E9E8]/60 text-xs">
              <div className="flex items-center gap-1 text-[#F4A340] font-semibold text-[11px]">
                <Flame className="w-3.5 h-3.5 fill-[#F4A340]" />
                <span>{user.streak}d streak</span>
              </div>
              <button
                onClick={logout}
                title="Log out"
                className="text-[#667085] hover:text-red-600 transition-colors flex items-center gap-1 text-[11px] p-1 rounded hover:bg-white"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-[10px] bg-[#087F8C] text-white text-xs font-semibold hover:bg-[#066772] transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In / Demo</span>
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
};
