-- Create a table to store user push subscriptions
create table if not exists public.push_subscriptions (
    id uuid not null default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    endpoint text not null,
    p256dh text not null,
    auth text not null,
    created_at timestamptz default now(),
    primary key (id),
    unique(user_id, endpoint)
);

-- RLS Policies
alter table public.push_subscriptions enable row level security;

create policy "Users can insert their own subscriptions"
    on public.push_subscriptions for insert
    with check (auth.uid() = user_id);

create policy "Users can delete their own subscriptions"
    on public.push_subscriptions for delete
    using (auth.uid() = user_id);

-- Optional: Allow service role to read/delete (for sending notifications logic if done via Supabase Edge Functions, 
-- but here our Node backend uses Service Role Key so it bypasses RLS anyway).
