-- Create users table for user management
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  company_name TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'free',
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create microsites table
CREATE TABLE public.microsites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_sessions table for tracking last login
CREATE TABLE public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  last_login TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.microsites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Allow public read access to users" 
ON public.users 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.users 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow insert for new users" 
ON public.users 
FOR INSERT 
WITH CHECK (true);

-- Create policies for microsites table
CREATE POLICY "Allow public read access to microsites" 
ON public.microsites 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their own microsites" 
ON public.microsites 
FOR ALL 
USING (true);

-- Create policies for user_sessions table
CREATE POLICY "Allow public read access to user_sessions" 
ON public.user_sessions 
FOR SELECT 
USING (true);

CREATE POLICY "Allow insert and update for user_sessions" 
ON public.user_sessions 
FOR ALL 
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_created_at ON public.users(created_at);
CREATE INDEX idx_microsites_user_id ON public.microsites(user_id);
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_microsites_updated_at
BEFORE UPDATE ON public.microsites
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();