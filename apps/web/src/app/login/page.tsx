'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Mail, Lock, ArrowRight, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithDemoAccount } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      router.push('/');
    } else {
      setError(result.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleDemoLogin = () => {
    loginWithDemoAccount();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col justify-between p-4 sm:p-6">
      {/* Standalone Brand Navigation Header */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between py-2">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[10px] bg-[#087F8C] flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-[#242039] tracking-tight">
            Upwise
          </span>
        </Link>
        <Link
          href="/"
          className="text-xs font-semibold text-[#087F8C] hover:text-[#066772] flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to App</span>
        </Link>
      </div>

      {/* Centered Login Card */}
      <div className="w-full max-w-[440px] mx-auto my-auto py-8">
        <div className="text-center space-y-2 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#242039] tracking-tight">
            Welcome back to Upwise
          </h1>
          <p className="text-sm text-[#667085]">
            Sign in to continue your personalized learning roadmap
          </p>
        </div>

        <Card className="border border-[#E6E9E8] shadow-md p-6 sm:p-8 bg-white">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-[10px] bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="alex@upwise.learn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <div className="space-y-1">
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />
              <div className="flex justify-end">
                <span className="text-[11px] text-[#087F8C] hover:underline cursor-pointer">
                  Forgot password?
                </span>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E6E9E8]"></div>
            </div>
            <span className="relative px-3 bg-white text-xs text-[#667085] uppercase tracking-wider">
              Quick Testing
            </span>
          </div>

          {/* 1-Click Demo Button */}
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="w-full bg-[#FAF9F5] border-[#D6F0EF] hover:bg-[#D6F0EF]/30 text-[#087F8C]"
            onClick={handleDemoLogin}
            leftIcon={<CheckCircle2 className="w-4 h-4 text-[#087F8C]" />}
          >
            Sign in as Demo Learner (Alex)
          </Button>

          {/* Footer link */}
          <div className="mt-6 text-center text-xs text-[#667085]">
            Don&apos;t have an account yet?{' '}
            <Link
              href="/register"
              className="font-semibold text-[#087F8C] hover:underline"
            >
              Create account
            </Link>
          </div>
        </Card>
      </div>

      {/* Subtle Footer */}
      <div className="text-center text-xs text-[#667085] py-2">
        Upwise • AI-Powered Calm Learning Platform
      </div>
    </div>
  );
}
