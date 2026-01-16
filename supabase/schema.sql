-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  phone text,
  avatar_url text,
  status text default 'active' check (status in ('active', 'suspended', 'banned')),
  referral_code_used text,
  failed_login_attempts int default 0,
  last_failed_attempt timestamptz,
  locked_until timestamptz,
  last_login_ip text,
  last_login timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Admin Users table
create table if not exists public.admin_users (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade unique,
  email text unique not null,
  role text default 'moderator' check (role in ('super_admin', 'admin', 'moderator')),
  permissions jsonb default '{}'::jsonb,
  is_active boolean default true,
  two_factor_enabled boolean default false,
  two_factor_method text default 'authenticator' check (two_factor_method in ('authenticator', 'email')),
  two_factor_secret text,
  backup_codes text[],
  last_login_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Admin Login Attempts
create table if not exists public.admin_login_attempts (
  id uuid default uuid_generate_v4() primary key,
  email text,
  ip_address text,
  success boolean,
  user_agent text,
  timestamp timestamptz default now(),
  created_at timestamptz default now()
);

-- Admin Sessions
create table if not exists public.admin_sessions (
  id uuid default uuid_generate_v4() primary key,
  admin_id uuid references public.admin_users(id) on delete cascade,
  session_token text unique not null,
  ip_address text,
  user_agent text,
  expires_at timestamptz not null,
  is_revoked boolean default false,
  two_factor_verified boolean default false,
  used_backup_code boolean default false,
  last_activity timestamptz default now(),
  created_at timestamptz default now()
);

-- Audit Log
create table if not exists public.audit_log (
  id uuid default uuid_generate_v4() primary key,
  admin_id text, -- Can be null or text if not linked to admin_users yet
  admin_email text,
  action_type text not null,
  resource_type text,
  resource_id text,
  details jsonb,
  ip_address text,
  user_agent text,
  severity text default 'low' check (severity in ('low', 'medium', 'high', 'critical')),
  timestamp timestamptz default now(),
  created_at timestamptz default now()
);

-- Security Alerts
create table if not exists public.security_alerts (
  id uuid default uuid_generate_v4() primary key,
  alert_type text not null,
  severity text check (severity in ('low', 'medium', 'high', 'critical')),
  message text,
  metadata jsonb,
  is_resolved boolean default false,
  resolved_by uuid references public.admin_users(id),
  resolved_at timestamptz,
  created_at timestamptz default now()
);

-- Security Audits
create table if not exists public.security_audits (
  id uuid default uuid_generate_v4() primary key,
  audit_type text not null,
  status text check (status in ('pending', 'in_progress', 'completed', 'failed')),
  findings jsonb,
  score int,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- Referral Codes (referenced in code)
create table if not exists public.referral_codes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  code text unique not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Admin Audit Log (referenced in SignIn.tsx, seemingly different from audit_log, enforcing consistency)
-- It seems the code uses 'admin_audit_log' and 'audit_log' interchangeably or specifically. 
-- Let's create 'admin_audit_log' as per SignIn.tsx usage if it differs, or alias it.
-- Based on code, SignIn.tsx uses `admin_audit_log` with columns: action, resource_type, resource_id, details.
create table if not exists public.admin_audit_log (
  id uuid default uuid_generate_v4() primary key,
  action text not null,
  resource_type text,
  resource_id text,
  details jsonb,
  created_at timestamptz default now()
);


-- Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.admin_users enable row level security;
alter table public.admin_login_attempts enable row level security;
alter table public.admin_sessions enable row level security;
alter table public.audit_log enable row level security;
alter table public.security_alerts enable row level security;
alter table public.security_audits enable row level security;
alter table public.referral_codes enable row level security;
alter table public.admin_audit_log enable row level security;

-- Policies (Basic examples, refine as needed)

-- Profiles: Users can read/update their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Admin Tables: Only admins can access (simplified for bootstrap)
-- WARNING: You need at least one admin to bootstrap.
-- Ideally, create a function `is_admin()` checking existing admin_users table.

-- For now, allow insert for auth-related logs to ensure login doesn't fail
create policy "Enable insert for authenticated users" on public.admin_audit_log for insert with check (auth.role() = 'authenticated');
create policy "Enable insert for authenticated users" on public.audit_log for insert with check (auth.role() = 'authenticated');

