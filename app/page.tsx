'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/providers/AuthProvider';
import Link from 'next/link';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // Redirect authenticated users to dashboard
      if (user.roomId) {
        router.push('/dashboard');
      } else {
        router.push('/rooms');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="absolute inset-0 rounded-full border-4 border-primary-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary-600 border-t-transparent animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading RoomEase...</h2>
          <p className="text-gray-600">Please wait while we set things up</p>
        </div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.header 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              🏠
            </div>
            <h1 className="text-4xl font-bold text-gray-900 ml-4">RoomEase</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Smart roommate management for students. Handle chores, bills, and responsibilities with trust-based coordination.
          </p>
        </motion.header>

        {/* Hero Section */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Simplify Your Shared Living
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
            <div className="bg-white rounded-xl p-6 shadow-card">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Chore Management</h3>
              <p className="text-gray-600 text-sm">
                Assign, track, and rotate chores with automated reminders and trust-based accountability.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-card">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Bill Splitting Made Easy</h3>
              <p className="text-gray-600 text-sm">
                Split bills fairly, track payments, and integrate with M-Pesa for seamless transactions.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-card">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Trust-Based System</h3>
              <p className="text-gray-600 text-sm">
                Build accountability with our trust scoring system that rewards reliability and cooperation.
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="btn-primary px-8 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Get Started Free
            </Link>
            <Link
              href="/auth/signin"
              className="btn-secondary px-8 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Sign In
            </Link>
          </div>
        </motion.div>

        {/* Features Section */}
        <motion.div 
          className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900">Perfect for Students in Kenya</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">M-Pesa Integration</h4>
                  <p className="text-gray-600 text-sm">Pay and split bills using mobile money - no bank account required.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Offline-First Design</h4>
                  <p className="text-gray-600 text-sm">Works even with poor internet connectivity - sync when you're back online.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Multi-Language Support</h4>
                  <p className="text-gray-600 text-sm">Available in English and Swahili for better accessibility.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900">Key Features</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">🍳</span>
                <div>
                  <h4 className="font-medium text-gray-900">Menu Planning & Recipes</h4>
                  <p className="text-gray-600 text-sm">Plan weekly menus, share recipes, and coordinate cooking responsibilities.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <span className="text-2xl">🛒</span>
                <div>
                  <h4 className="font-medium text-gray-900">Shared Shopping Lists</h4>
                  <p className="text-gray-600 text-sm">Create collaborative shopping lists with receipt tracking and expense splitting.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <span className="text-2xl">📝</span>
                <div>
                  <h4 className="font-medium text-gray-900">Communication Board</h4>
                  <p className="text-gray-600 text-sm">Share notes, announcements, and updates with your roommates.</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.footer 
          className="text-center text-gray-500 border-t pt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <p>&copy; 2024 RoomEase. Made with ❤️ for students in Kenya and beyond.</p>
        </motion.footer>
      </div>
    </div>
  );
}