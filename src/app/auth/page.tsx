import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { AuthForm } from './AuthForm';

export default async function Auth({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string; mode?: string }>;
}) {
  // Check if user is already authenticated
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    redirect('/');
  }

  const params = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <AuthForm 
        error={params.error}
        success={params.success}
        initialMode={params.mode}
      />
    </div>
  );
}