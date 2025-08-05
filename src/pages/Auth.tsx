import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, Mail } from 'lucide-react';

export const Auth = () => {
  const { user, signInWithEmail, signUpWithEmail, signInAsAdmin } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  // Form state
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');

  // Redirect if already authenticated
  if (user) {
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  const validateForm = () => {
    // Skip validation for admin test bypass
    if (email.toLowerCase() === 'admintest') {
      return true;
    }

    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return false;
    }

    if (!email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return false;
    }

    if (isSignUp) {
      if (!firstName || !lastName) {
        toast({
          title: "Name Required",
          description: "Please enter your first and last name.",
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Admin test bypass
    if (email.toLowerCase() === 'admintest') {
      console.log('🔧 Admin test detected, bypassing normal flow');
      setLoading(true);
      try {
        const result = await signInAsAdmin();
        console.log('🔧 Admin signin result:', result);
        if (result.error) {
          console.error('🔧 Admin signin error:', result.error);
          toast({
            title: "Admin Bypass Error",
            description: result.error.message,
            variant: "destructive",
          });
        } else {
          console.log('🔧 Admin signin successful, redirecting to /microsites');
          toast({
            title: "Admin Bypass Activated!",
            description: "Redirecting to microsites...",
          });
          // Redirect immediately to microsites for admin test
          navigate('/microsites', { replace: true });
        }
      } catch (error) {
        console.error('🔧 Admin bypass exception:', error);
        toast({
          title: "Admin bypass failed",
          description: "Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
      return;
    }
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      let result;
      
      if (isSignUp) {
        result = await signUpWithEmail(email, firstName, lastName, companyName);
      } else {
        result = await signInWithEmail(email);
      }

      if (result.error) {
        toast({
          title: "Authentication Error",
          description: result.error.message,
          variant: "destructive",
        });
      } else {
        setEmailSent(true);
        toast({
          title: "Magic Link Sent!",
          description: "Check your email for the magic link to sign in.",
        });
      }
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Check Your Email</CardTitle>
            <CardDescription>
              We've sent a magic link to <strong>{email.toLowerCase() === 'admintest' ? 'admin@metaneer.com' : email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Click the link in your email to {isSignUp ? 'complete your account setup' : 'sign in'}.
            </p>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => {
                setEmailSent(false);
                setEmail('');
                setFirstName('');
                setLastName('');
                setCompanyName('');
              }}
            >
              Send Another Link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
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
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {isSignUp && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company (Optional)</Label>
                  <Input
                    id="company"
                    type="text"
                    placeholder="Acme Inc."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
              </>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? 'Create Account' : 'Send Magic Link'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button
              variant="link"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setEmail('');
                setFirstName('');
                setLastName('');
                setCompanyName('');
              }}
              className="text-sm"
            >
              {isSignUp 
                ? 'Already have an account? Sign in' 
                : "Don't have an account? Sign up"
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};