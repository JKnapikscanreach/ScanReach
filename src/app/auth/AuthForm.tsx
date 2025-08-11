'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail } from 'lucide-react';
import { signInWithEmail, signUpWithEmail, exchangeCodeForSession } from './actions';

interface AuthFormProps {
  error?: string;
  success?: string;
  initialMode?: string;
}

export function AuthForm({ error, success, initialMode }: AuthFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [emailSent, setEmailSent] = useState(false);
  const [lastEmail, setLastEmail] = useState('');
  const [isProcessingCode, setIsProcessingCode] = useState(false);

  // Handle OAuth callback code
  useEffect(() => {
    const code = searchParams.get('code');
    if (code && !isProcessingCode) {
      setIsProcessingCode(true);
      startTransition(async () => {
        const result = await exchangeCodeForSession(code);
        
        if (result?.error) {
          toast({
            title: "Authentication Error",
            description: result.error,
            variant: "destructive",
          });
          // Clear the code from URL
          router.replace('/auth');
        } else {
          toast({
            title: "Success!",
            description: "You have been successfully signed in.",
          });
          // Redirect to home page
          router.push('/');
        }
        setIsProcessingCode(false);
      });
    }
  }, [searchParams, router, toast, isProcessingCode, startTransition]);

  // Show success/error messages from URL params
  useEffect(() => {
    if (error) {
      toast({
        title: "Authentication Error",
        description: error,
        variant: "destructive",
      });
    }
    if (success) {
      toast({
        title: "Success",
        description: success,
      });
    }
  }, [error, success, toast]);

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const email = formData.get('email') as string;
      setLastEmail(email);

      let result;
      if (isSignUp) {
        result = await signUpWithEmail(formData);
      } else {
        result = await signInWithEmail(formData);
      }

      if (result?.error) {
        toast({
          title: "Authentication Error",
          description: result.error,
          variant: "destructive",
        });
      } else if (result?.success) {
        setEmailSent(true);
        toast({
          title: "Magic Link Sent!",
          description: result.message,
        });
      }
    });
  };

  const resetForm = () => {
    setEmailSent(false);
    setLastEmail('');
  };

  if (emailSent) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Check Your Email</CardTitle>
          <CardDescription>
            We've sent a magic link to <strong>{lastEmail}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Click the link in your email to {isSignUp ? 'complete your account setup' : 'sign in'}.
          </p>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={resetForm}
          >
            Send Another Link
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{isSignUp ? 'Create Account' : 'Welcome Back'}</CardTitle>
        <CardDescription>
          {isSignUp 
            ? 'Enter your details to create your account' 
            : 'Enter your email to receive a magic link'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              disabled={isPending}
            />
          </div>

          {isSignUp && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="John"
                    required
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Doe"
                    required
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName">Company (Optional)</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  type="text"
                  placeholder="Acme Inc."
                  disabled={isPending}
                />
              </div>
            </>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSignUp ? 'Create Account' : 'Send Magic Link'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Button
            variant="link"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm"
            disabled={isPending}
          >
            {isSignUp 
              ? 'Already have an account? Sign in' 
              : "Don't have an account? Sign up"
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
