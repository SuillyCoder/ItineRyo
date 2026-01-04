'use client';

import { createClient } from '@/lib/supabase';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<'google' | 'email'>('email');
  const supabase = createClient();

  // ✅ KEPT: Your original Google Sign-In logic
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('Error signing in:', error);
        alert('Failed to sign in with Google. Please try again.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  // ✅ NEW: Email/Password Sign-In
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      alert('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Error signing in:', error);
        alert('Failed to sign in. Please check your credentials.');
        setLoading(false);
      }
      // If successful, user will be redirected via AuthProvider
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden" style={{ backgroundColor: '#D6D0C0' }}>
      {/* Left Side - Decorative (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
        {/* Background with Great Wave Pattern */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Decorative wave pattern - you can replace with actual image */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `url('/assets/Kanagawa.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }} />
          <div className="absolute inset-0 bg-linear-to-br from-[#D6D0C0]/70 to-[#C8B8A5]/50" />
        </div>
        
        {/* Logo and Branding */}
        <div className="relative z-10 text-center max-w-md">
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center relative" style={{ backgroundColor: '#BF2809' }}>
              <div className="absolute inset-3 rounded-full border-2 border-[#D6D0C0] opacity-50" />
              <span className="text-5xl" style={{ color: '#D6D0C0' }}>旅</span>
            </div>
          </div>
          <h1 className="text-4xl mb-4" style={{ 
            fontFamily: "'Noto Serif JP', serif",
            color: '#2c2416',
            letterSpacing: '0.05em'
          }}>
            Itine-Ryo
          </h1>
          <p className="text-lg opacity-80" style={{ 
            fontFamily: "'Noto Sans JP', sans-serif",
            color: '#2c2416'
          }}>
            Your Japan Travel Planner
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative">
        {/* Decorative Corner Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10 pointer-events-none">
          <div className="absolute top-8 right-8 w-48 h-48 rounded-full border-[3px]" style={{ borderColor: '#BF2809' }} />
          <div className="absolute top-16 right-16 w-32 h-32 rounded-full border-2px" style={{ borderColor: '#D64820' }} />
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Mobile Logo (Visible only on mobile) */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center relative" style={{ backgroundColor: '#BF2809' }}>
              <div className="absolute inset-2 rounded-full border-2 border-[#D6D0C0] opacity-50" />
              <span className="text-4xl" style={{ color: '#D6D0C0' }}>旅</span>
            </div>
            <h1 className="text-3xl mb-2" style={{ 
              fontFamily: "'Noto Serif JP', serif",
              color: '#2c2416',
              letterSpacing: '0.05em'
            }}>
              Itine-Ryo
            </h1>
            <p style={{ 
              fontFamily: "'Noto Sans JP', sans-serif",
              color: '#7D7463'
            }}>
              Your Japan Travel Planner
            </p>
          </div>

          {/* Login Card */}
          <div className="rounded-2xl p-6 sm:p-8 shadow-xl" style={{ 
            backgroundColor: '#C8B8A5',
            border: '1px solid rgba(125, 116, 99, 0.2)'
          }}>
            {/* Welcome Text */}
            <div className="mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl mb-2" style={{ 
                fontFamily: "'Noto Serif JP', serif",
                color: '#2c2416',
                letterSpacing: '0.02em'
              }}>
                Welcome
              </h2>
              <p className="text-sm sm:text-base" style={{ 
                fontFamily: "'Noto Sans JP', sans-serif",
                color: '#7D7463'
              }}>
                Sign in to start planning your perfect Japan itinerary
              </p>
            </div>

            {/* Decorative Line */}
            <div className="mb-6 sm:mb-8 flex items-center gap-4">
              <div className="h-0.5 flex-1" style={{ backgroundColor: '#D64820' }} />
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#BF2809' }} />
              <div className="h-0.5 flex-1" style={{ backgroundColor: '#D64820' }} />
            </div>

            {/* Email/Password Login Form */}
            <form onSubmit={handleEmailSignIn} className="space-y-4 sm:space-y-6">
              {/* Email Input */}
              <div>
                <label 
                  htmlFor="email" 
                  className="block mb-2 text-sm sm:text-base"
                  style={{ 
                    fontFamily: "'Noto Sans JP', sans-serif",
                    color: '#2c2416'
                  }}
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Mail size={20} style={{ color: '#D64820' }} />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    disabled={loading}
                    className="w-full pl-12 pr-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[#BF2809] disabled:opacity-50"
                    style={{ 
                      backgroundColor: '#D6D0C0',
                      borderColor: 'rgba(125, 116, 99, 0.3)',
                      color: '#2c2416',
                      fontFamily: "'Noto Sans JP', sans-serif"
                    }}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label 
                  htmlFor="password" 
                  className="block mb-2 text-sm sm:text-base"
                  style={{ 
                    fontFamily: "'Noto Sans JP', sans-serif",
                    color: '#2c2416'
                  }}
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Lock size={20} style={{ color: '#D64820' }} />
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={loading}
                    className="w-full pl-12 pr-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[#BF2809] disabled:opacity-50"
                    style={{ 
                      backgroundColor: '#D6D0C0',
                      borderColor: 'rgba(125, 116, 99, 0.3)',
                      color: '#2c2416',
                      fontFamily: "'Noto Sans JP', sans-serif"
                    }}
                  />
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#BF2809]"
                  />
                  <span style={{ 
                    fontFamily: "'Noto Sans JP', sans-serif",
                    color: '#2c2416',
                    fontSize: '0.9rem'
                  }}>
                    Remember me
                  </span>
                </label>
                <button 
                  type="button" 
                  className="transition-colors duration-200 hover:opacity-80"
                  style={{ 
                    fontFamily: "'Noto Sans JP', sans-serif",
                    color: '#D64820',
                    fontSize: '0.9rem'
                  }}
                >
                  Forgot password?
                </button>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                style={{ 
                  backgroundColor: '#BF2809',
                  color: '#D6D0C0',
                  fontFamily: "'Noto Sans JP', sans-serif"
                }}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-[#D6D0C0] border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative my-6 sm:my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full h-px" style={{ backgroundColor: '#7D7463', opacity: 0.3 }} />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 text-sm" style={{ 
                    backgroundColor: '#C8B8A5',
                    fontFamily: "'Noto Sans JP', sans-serif",
                    color: '#7D7463'
                  }}>
                    or continue with
                  </span>
                </div>
              </div>

              {/* Google Sign In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3 rounded-lg flex items-center justify-center gap-3 transition-all duration-200 hover:shadow-md border-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: '#D6D0C0',
                  borderColor: 'rgba(125, 116, 99, 0.3)',
                  color: '#2c2416',
                  fontFamily: "'Noto Sans JP', sans-serif"
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-6 sm:mt-8 text-center text-sm">
              <span style={{ 
                fontFamily: "'Noto Sans JP', sans-serif",
                color: '#7D7463'
              }}>
                Don't have an account?{' '}
              </span>
              <button 
                type="button"
                className="transition-colors duration-200 hover:opacity-80"
                style={{ 
                  fontFamily: "'Noto Sans JP', sans-serif",
                  color: '#BF2809'
                }}
              >
                Sign up
              </button>
            </div>
          </div>

          {/* Bottom Decorative Text */}
          <div className="mt-6 sm:mt-8 text-center">
            <p style={{ 
              fontFamily: "'Noto Serif JP', serif",
              color: '#7D7463',
              fontSize: '0.9rem',
              letterSpacing: '0.1em',
              opacity: 0.7
            }}>
              行きましょう
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}