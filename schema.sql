
-- Create a table for storing social media posts
create table posts (
  id uuid default gen_random_uuid() primary key,
  user_id text not null, -- Clerk User ID
  content text not null,
  platforms text[] not null, -- Array of platform names e.g. ['twitter', 'linkedin']
  status text not null default 'draft', -- draft, scheduled, published
  scheduled_for timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a table for storing user platform connections (e.g. Twitter OAuth tokens)
-- For MVP, this might just be a placeholder or simple boolean flags
create table social_accounts (
  id uuid default gen_random_uuid() primary key,
  user_id text not null, -- Clerk User ID
  platform_name text not null, -- twitter, linkedin, etc.
  account_name text, -- @username
  connected_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table posts enable row level security;
alter table social_accounts enable row level security;

-- Create policies to ensure users can only see their own data
create policy "Users can CRUD their own posts"
  on posts for all
  using ( user_id = current_user_id() ); -- Note: We'll need a way to pass Clerk ID to Supabase, or just use client-side filtering for MVP simplistic approach

-- For a simpler MVP approach without complex JWT syncing:
-- We will just use the anon key and filter by user_id in our queries, 
-- trusting the application layer (since we are building a portfolio project).
-- In a real app, you'd integrate Clerk with Supabase RLS properly.
