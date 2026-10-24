'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, Sparkles, LogOut, Lock, ArrowRight } from 'lucide-react';
import { Sidebar, navItems } from './sidebar';
import { Topbar } from './topbar';
import { MobileNav } from './mobile-nav';
import { AiTutor } from '@/components/ai/ai-tutor';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logout, loginWithDemoAccount } = useAuth();

  const isAuthRoute = pathname === '/login' || pathname === '/register';

  // Standalone layout for authentication screens (no sidebar, no topbar search)
  if (isAuthRoute) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] text-[#242039] flex flex-col justify-center">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#FAF9F5] text-[#242039]">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Drawer Overlay */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 bottom-0 left-0 w-72 bg-white z-50 transform transition-transform duration-200 ease-in-out md:hidden flex flex-col border-r border-[#E6E9E8] shadow-2xl ${
          mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#E6E9E8]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-[#087F8C] flex items-center justify-center text-white font-bold">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-[#242039]">Upwise</span>
          </div>
          <button
            onClick={() => setMobileDrawerOpen(false)}
            className="p-1.5 text-[#667085] hover:text-[#242039] rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1">
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
                onClick={() => setMobileDrawerOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-[12px] text-sm font-medium ${
                  isActive
                    ? 'bg-[#D6F0EF] text-[#087F8C] font-semibold'
                    : 'text-[#667085] hover:text-[#242039] hover:bg-[#FAF9F5]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-[#087F8C] text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {isAuthenticated && user && (
          <div className="p-4 border-t border-[#E6E9E8]">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-[#242039]">{user.name}</span>
              <span className="text-[#087F8C]">{user.xp} XP</span>
            </div>
            <button
              onClick={() => {
                logout();
                setMobileDrawerOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-red-600 bg-red-50 rounded-[10px]"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMobileMenuToggle={() => setMobileDrawerOpen(true)} />

        {/* Protected route unauthenticated banner if signed out */}
        {!isAuthenticated && !isLoading && (
          <div className="bg-[#FAF9F5] border-b border-[#E6E9E8] px-4 md:px-8 py-3">
            <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-[12px] bg-[#D6F0EF]/50 border border-[#BCE4E2]">
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-[#087F8C] shrink-0" />
                <span className="text-xs text-[#242039]">
                  You are currently browsing as a guest. Sign in or load the demo account to save your roadmap progress and quiz scores.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={loginWithDemoAccount}
                >
                  Load Demo Account
                </Button>
                <Link href="/login">
                  <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 md:px-8 py-6 md:py-8 pb-24 md:pb-8">
          {children}
        </main>
      </div>

      {/* Gemini AI Learning Tutor Drawer */}
      <AiTutor />

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
};
