'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export async function signInWithEmail(formData: FormData) {
  const email = formData.get('email') as string;
  
  if (!email) {
    return { error: 'Email is required' };
  }

  if (!email.includes('@')) {
    return { error: 'Please enter a valid email address' };
  }

  const supabase = await createClient();
  
  // Admin test bypass
  if (email.toLowerCase() === 'admintest') {
    const { error } = await supabase.auth.signInWithPassword({
      email: 'admin@metaneer.com',
      password: 'admin123', // This should be handled more securely
    });
    
    if (error) {
      return { error: error.message };
    }
    
    return { success: true, message: 'Admin bypass activated! Check your email for the magic link (admin@metaneer.com).' };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true, message: 'Magic link sent! Check your email for the magic link to sign in.' };
}

export async function signUpWithEmail(formData: FormData) {
  const email = formData.get('email') as string;
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const companyName = formData.get('companyName') as string;

  if (!email) {
    return { error: 'Email is required' };
  }

  if (!email.includes('@')) {
    return { error: 'Please enter a valid email address' };
  }

  if (!firstName || !lastName) {
    return { error: 'Please enter your first and last name' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password: Math.random().toString(36),
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      data: {
        first_name: firstName,
        last_name: lastName,
        company_name: companyName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true, message: 'Magic link sent! Check your email for the magic link to complete your account setup.' };
}

export async function exchangeCodeForSession(code: string) {
  const supabase = await createClient();
  
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  
  if (error) {
    return { error: error.message };
  }
  
  return { success: true };
}

export async function checkAuthAndRedirect() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    redirect('/');
  }
}
