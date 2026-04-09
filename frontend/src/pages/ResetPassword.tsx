import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from '@/lib/supabase';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sessionReady, setSessionReady] = useState(false);

  // Supabase redirects here with a recovery token in the URL hash.
  // We listen for the PASSWORD_RECOVERY event which fires once Supabase
  // has exchanged the token for a session. Only then can updateUser() work.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔵 [ResetPassword] Auth event:', event, !!session);
      if (event === 'PASSWORD_RECOVERY') {
        console.log('✅ [ResetPassword] Recovery session active');
        setSessionReady(true);
      }
    });

    // Also check if there's already a session (e.g. page refresh after recovery link clicked)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        console.log('✅ [ResetPassword] Existing session found');
        setSessionReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Please enter a new password");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        console.error('❌ [ResetPassword] Update error:', updateError);
        setError(updateError.message || 'Failed to update password. Please try again.');
      } else {
        setSuccess('Password updated successfully! Redirecting to sign in...');
        // Sign out so the user logs in fresh with their new password
        await supabase.auth.signOut();
        setTimeout(() => navigate('/signin', { replace: true }), 2000);
      }
    } catch (err: any) {
      console.error('❌ [ResetPassword] Unexpected error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // If the recovery token hasn't been detected yet, show a loading state
  // (this is brief — the PASSWORD_RECOVERY event fires within ~1 second)
  if (!sessionReady) {
    return (
      <div
        className="h-full overflow-y-auto flex justify-center py-12 px-4 sm:px-6 lg:px-8"
        style={{ backgroundColor: '#503b5d' }}
      >
        <div className="max-w-md w-full space-y-8">
          <Card className="shadow-xl border-0">
            <CardContent className="pt-10 pb-10 text-center">
              <p className="text-gray-600">Verifying your reset link...</p>
              <p className="text-gray-400 text-sm mt-2">
                If nothing happens,{' '}
                <Link to="/forgot-password" className="text-orange-600 hover:text-orange-700 font-medium">
                  request a new link
                </Link>
                .
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-full overflow-y-auto flex justify-center py-12 px-4 sm:px-6 lg:px-8"
      style={{ backgroundColor: '#503b5d' }}
    >
      <div className="max-w-md w-full space-y-8">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">Set new password</CardTitle>
            <CardDescription>
              Choose a strong password for your account.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {success ? (
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-green-700 text-sm font-medium">{success}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="new-password" className="text-gray-700">
                    New password
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="mt-1"
                    disabled={isLoading}
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <Label htmlFor="confirm-password" className="text-gray-700">
                    Confirm new password
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your new password"
                    className="mt-1"
                    disabled={isLoading}
                    required
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
                  {isLoading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
