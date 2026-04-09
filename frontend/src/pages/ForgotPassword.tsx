import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from '@/lib/supabase';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        // After clicking the link in the email, Supabase redirects here so the user
        // can set a new password.
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        console.error('❌ [ForgotPassword] Reset error:', resetError);
        setError(resetError.message || 'Failed to send reset email. Please try again.');
      } else {
        setSuccess(
          'Password reset link sent! Please check your email and click the link to set a new password.'
        );
      }
    } catch (err: any) {
      console.error('❌ [ForgotPassword] Unexpected error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="h-full overflow-y-auto flex justify-center py-12 px-4 sm:px-6 lg:px-8"
      style={{ backgroundColor: '#503b5d' }}
    >
      <div className="max-w-md w-full space-y-8">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">Reset your password</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a link to reset your password.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {!success ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-gray-700">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="mt-1"
                    disabled={isLoading}
                    required
                    autoFocus
                  />
                </div>

                {error && (
                  <p className="text-red-600 text-sm">{error}</p>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>

                <p className="text-center text-sm text-gray-600">
                  Remember your password?{' '}
                  <Link to="/signin" className="text-orange-600 hover:text-orange-700 font-medium">
                    Sign in
                  </Link>
                </p>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-green-700 text-sm font-medium">{success}</p>
                <p className="text-gray-500 text-sm">
                  Didn't receive the email? Check your spam folder or{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setSuccess("");
                      setEmail("");
                    }}
                    className="text-orange-600 hover:text-orange-700 font-medium underline"
                  >
                    try again
                  </button>
                  .
                </p>
                <Link
                  to="/signin"
                  className="block text-center text-sm text-orange-600 hover:text-orange-700 font-medium mt-2"
                >
                  Back to sign in
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
