import { headers } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { HeaderClient } from './HeaderClient';

export async function Header() {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';

  // Don't show header on auth page or public microsite pages
  if (pathname === '/auth' || pathname.startsWith('/m/')) {
    return null;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Check if user is admin (you may need to implement this logic based on your user roles)
  const isAdmin = user?.user_metadata?.role === 'admin' || user?.app_metadata?.role === 'admin';

  return <HeaderClient user={user} isAdmin={isAdmin} />;
}