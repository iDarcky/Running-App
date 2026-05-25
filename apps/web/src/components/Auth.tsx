import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Button, Input, Card } from './UIComponents';
import { LogIn, UserPlus, Mail } from 'lucide-react';
import { RedLineLogo as Logo } from './Logo';

interface AuthProps {
  onSuccess: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: email.split('@')[0],
            }
          }
        });
        if (error) throw error;
        alert('Check your email for the login link or you are logged in automatically!');
        if ((await supabase.auth.getSession()).data.session) {
           onSuccess();
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'github' | 'google') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || `An error occurred with ${provider} login`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="mb-8 flex flex-col items-center">
        <Logo className="w-16 h-16 text-[#EE0000] mb-4" />
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">RedLine</h1>
        <p className="text-gray-500 mt-2">Track all your activities in one place</p>
      </div>

      <Card className="w-full max-w-md p-6 bg-white shadow-lg rounded-xl">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isSignUp ? 'Create an Account' : 'Welcome Back'}
        </h2>

        {error && (
          <div className="bg-red-50 text-[#EE0000] p-3 rounded-md mb-4 text-sm border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full py-2 flex justify-center items-center"
            disabled={loading}
          >
            {loading ? 'Processing...' : (isSignUp ? <><UserPlus className="w-4 h-4 mr-2" /> Sign Up</> : <><LogIn className="w-4 h-4 mr-2" /> Sign In</>)}
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleOAuthLogin('google')}
                className="w-full flex justify-center items-center py-2 text-sm"
              >
                 <Mail className="w-4 h-4 mr-2" /> Continue with Google
              </Button>
          </div>
        </div>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-600">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          </span>
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="ml-1 text-[#EE0000] font-medium hover:underline"
            type="button"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </Card>
    </div>
  );
};
