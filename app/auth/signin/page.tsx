'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/components/providers/AuthProvider';
import { signIn, resetPassword, setupRecaptcha, sendSMSVerification, verifySMSCode } from '@/lib/firebase';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface SignInForm {
  email: string;
  password: string;
}

interface PhoneSignInForm {
  phoneNumber: string;
  verificationCode: string;
}

export default function SignInPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [phoneStep, setPhoneStep] = useState<'phone' | 'code'>('phone');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  const emailForm = useForm<SignInForm>();
  const phoneForm = useForm<PhoneSignInForm>();

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      if (user.roomId) {
        router.push('/dashboard');
      } else {
        router.push('/rooms');
      }
    }
  }, [user, loading, router]);

  const handleEmailSignIn = async (data: SignInForm) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const result = await signIn(data.email, data.password);
      
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Welcome back!');
        // Redirect will happen via useEffect
      }
    } catch (error: any) {
      toast.error(error.message || 'Sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneSignIn = async (data: PhoneSignInForm) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      if (phoneStep === 'phone') {
        // Send SMS verification
        const recaptchaVerifier = setupRecaptcha('recaptcha-container');
        const result = await sendSMSVerification(data.phoneNumber, recaptchaVerifier);
        
        if (result.error) {
          toast.error(result.error);
        } else {
          setConfirmationResult(result.confirmationResult);
          setPhoneStep('code');
          toast.success('Verification code sent!');
        }
      } else {
        // Verify SMS code
        if (!confirmationResult) {
          toast.error('Please request a new verification code');
          setPhoneStep('phone');
          return;
        }

        const result = await verifySMSCode(confirmationResult, data.verificationCode);
        
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success('Phone verified! Welcome back!');
          // Redirect will happen via useEffect
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Phone authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = emailForm.getValues('email');
    if (!email) {
      toast.error('Please enter your email address first');
      return;
    }

    try {
      const result = await resetPassword(email);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Password reset email sent!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="absolute inset-0 rounded-full border-4 border-primary-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary-600 border-t-transparent animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Loading...</h2>
        </div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
              🏠
            </div>
            <span className="text-2xl font-bold text-gray-900 ml-3">RoomEase</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your account to continue</p>
        </div>

        {/* Auth Method Toggle */}
        <div className="bg-white rounded-xl shadow-card p-6 mb-6">
          <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => setAuthMethod('email')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                authMethod === 'email'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              📧 Email
            </button>
            <button
              type="button"
              onClick={() => setAuthMethod('phone')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                authMethod === 'phone'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              📱 Phone
            </button>
          </div>

          {/* Email Sign In Form */}
          {authMethod === 'email' && (
            <form onSubmit={emailForm.handleSubmit(handleEmailSignIn)} className="space-y-4">
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <input
                  {...emailForm.register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  type="email"
                  className={`input ${emailForm.formState.errors.email ? 'input-error' : ''}`}
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
                {emailForm.formState.errors.email && (
                  <p className="form-error">{emailForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <div className="relative">
                  <input
                    {...emailForm.register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      }
                    })}
                    type={showPassword ? 'text' : 'password'}
                    className={`input pr-10 ${emailForm.formState.errors.password ? 'input-error' : ''}`}
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {emailForm.formState.errors.password && (
                  <p className="form-error">{emailForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-primary-600 hover:text-primary-500"
                  disabled={isLoading}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-3"
              >
                {isLoading ? (
                  <div className="loading-dots">
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          )}

          {/* Phone Sign In Form */}
          {authMethod === 'phone' && (
            <form onSubmit={phoneForm.handleSubmit(handlePhoneSignIn)} className="space-y-4">
              {phoneStep === 'phone' ? (
                <div className="form-group">
                  <label htmlFor="phoneNumber" className="form-label">
                    Phone Number
                  </label>
                  <input
                    {...phoneForm.register('phoneNumber', {
                      required: 'Phone number is required',
                      pattern: {
                        value: /^(\+254|254|0)?[17]\d{8}$/,
                        message: 'Please enter a valid Kenyan phone number'
                      }
                    })}
                    type="tel"
                    className={`input ${phoneForm.formState.errors.phoneNumber ? 'input-error' : ''}`}
                    placeholder="+254712345678 or 0712345678"
                    disabled={isLoading}
                  />
                  {phoneForm.formState.errors.phoneNumber && (
                    <p className="form-error">{phoneForm.formState.errors.phoneNumber.message}</p>
                  )}
                  <p className="form-help">
                    We'll send you a verification code via SMS
                  </p>
                </div>
              ) : (
                <div className="form-group">
                  <label htmlFor="verificationCode" className="form-label">
                    Verification Code
                  </label>
                  <input
                    {...phoneForm.register('verificationCode', {
                      required: 'Verification code is required',
                      pattern: {
                        value: /^\d{6}$/,
                        message: 'Please enter the 6-digit code'
                      }
                    })}
                    type="text"
                    className={`input ${phoneForm.formState.errors.verificationCode ? 'input-error' : ''}`}
                    placeholder="Enter 6-digit code"
                    disabled={isLoading}
                    maxLength={6}
                  />
                  {phoneForm.formState.errors.verificationCode && (
                    <p className="form-error">{phoneForm.formState.errors.verificationCode.message}</p>
                  )}
                  <p className="form-help">
                    Check your SMS messages for the verification code
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-3"
              >
                {isLoading ? (
                  <div className="loading-dots">
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                ) : phoneStep === 'phone' ? (
                  'Send Code'
                ) : (
                  'Verify & Sign In'
                )}
              </button>

              {phoneStep === 'code' && (
                <button
                  type="button"
                  onClick={() => {
                    setPhoneStep('phone');
                    setConfirmationResult(null);
                    phoneForm.reset();
                  }}
                  className="w-full btn-secondary py-2"
                  disabled={isLoading}
                >
                  Use Different Number
                </button>
              )}
            </form>
          )}
        </div>

        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-primary-600 hover:text-primary-500 font-medium">
              Sign up here
            </Link>
          </p>
        </div>

        {/* reCAPTCHA container */}
        <div id="recaptcha-container"></div>
      </motion.div>
    </div>
  );
}