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
} from 'lucide-react';

const mobileNavItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Roadmap', href: '/roadmap', icon: Compass },
  { name: 'Plan', href: '/plan', icon: CalendarCheck },
  { name: 'Learn', href: '/learn', icon: BookOpen },
  { name: 'Practice', href: '/practice', icon: Award },
];

export const MobileNav: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-[#E6E9E8] z-30 px-3 flex items-center justify-around">
      {mobileNavItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-[10px] transition-colors ${
              isActive
                ? 'text-[#087F8C] font-semibold'
                : 'text-[#667085] hover:text-[#242039]'
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-none">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
};
