
-- 1. PROFILES TABLE (Stores user balance & stats)
create table if not exists public.profiles (
  id uuid not null references auth.users on delete cascade,
  username text unique,
  balance numeric default 20,
  mobile text default 'Verified',
  referrals int default 0,
  wins int default 0,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

-- Enable RLS on Profiles
alter table public.profiles enable row level security;

-- Policies for Profiles
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

create policy "Users can insert their own profile"
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update their own profile"
  on profiles for update
  using ( auth.uid() = id );

-- TRIGGER to automatically create profile on signup
-- This ensures username and mobile from metadata are saved to the profile table
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_referrer_username text;
  v_referrer_id uuid;
begin
  -- 1. Create Profile with 20 ETB starting balance
  insert into public.profiles (id, username, mobile, balance, wins, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'username',
    coalesce(new.raw_user_meta_data ->> 'mobile', 'Unverified'),
    20, 
    0,
    new.raw_user_meta_data ->> 'avatar_url'
  );

  -- 2. Handle Referral (Add 2 ETB to referrer)
  v_referrer_username := new.raw_user_meta_data ->> 'referrer';
  if v_referrer_username is not null and v_referrer_username != '' then
    select id into v_referrer_id from profiles where username = v_referrer_username;
    
    if v_referrer_id is not null then
      update profiles 
      set balance = balance + 2, 
          referrals = referrals + 1 
      where id = v_referrer_id;
    end if;
  end if;

  return new;
end;
$$;

-- Drop trigger if exists to avoid conflicts during updates
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. TRANSACTIONS TABLE (Stores financial history)
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  type text not null check (type in ('deposit', 'withdraw', 'transfer')),
  amount numeric not null,
  fee numeric default 0,
  status text default 'pending' check (status in ('pending', 'completed', 'failed')),
  recipient_username text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.transactions enable row level security;

create policy "Users can view their own transactions" 
  on transactions for select 
  using (auth.uid() = user_id);

create policy "Users can only insert via RPC" 
  on transactions for insert 
  with check (false); 

create policy "Admin full access" 
  on transactions for all 
  to service_role
  using (true) 
  with check (true);

-- 3. GAME HISTORY TABLE (Stores match results)
create table if not exists public.game_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  game_mode text not null,
  card_ids jsonb not null,
  stake numeric not null,
  payout numeric default 0,
  status text not null check (status in ('won', 'lost', 'draw', 'abandoned')),
  called_numbers jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.game_history enable row level security;

create policy "Users can view their own game history"
  on game_history for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own game history"
  on game_history for insert
  with check ( auth.uid() = user_id );


-- 4. SECURE TRANSACTION RPC (User Initiated)
create or replace function process_transaction(
  p_type text, 
  p_amount numeric, 
  p_recipient_username text default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer -- Runs with admin privileges
as $$
declare
  v_user_id uuid;
  v_current_balance numeric;
  v_wins int;
  v_recipient_id uuid;
  v_fee numeric := 0;
  v_total_deduction numeric;
begin
  v_user_id := auth.uid();
  
  -- Get current balance and wins
  select balance, coalesce(wins, 0) into v_current_balance, v_wins from profiles where id = v_user_id;
  
  if v_current_balance is null then
    raise exception 'User profile not found';
  end if;
  
  -- === DEPOSIT LOGIC ===
  if p_type = 'deposit' then
    if p_amount < 30 then
      raise exception 'Minimum deposit is 30 ETB';
    end if;
    
    -- Insert pending deposit (Admin must confirm this manually or via webhook)
    insert into transactions (user_id, type, amount, status, metadata)
    values (v_user_id, 'deposit', p_amount, 'pending', p_metadata);
    
    return jsonb_build_object('status', 'success', 'message', 'Deposit pending verification');
  end if;

  -- === WITHDRAWAL LOGIC ===
  if p_type = 'withdraw' then
    if v_wins < 3 then
      raise exception 'You must win at least 3 games to withdraw.';
    end if;

    if p_amount < 100 then
      raise exception 'Minimum withdrawal is 100 ETB';
    end if;
    
    if v_current_balance < p_amount then
      raise exception 'Insufficient balance';
    end if;

    -- Deduct immediately (Escrow style)
    update profiles set balance = balance - p_amount where id = v_user_id;
    
    insert into transactions (user_id, type, amount, status, metadata)
    values (v_user_id, 'withdraw', p_amount, 'pending', p_metadata);
    
    return jsonb_build_object('status', 'success', 'message', 'Withdrawal request submitted');
  end if;

  -- === TRANSFER LOGIC ===
  if p_type = 'transfer' then
    if p_amount < 100 then
       raise exception 'Minimum transfer is 100 ETB';
    end if;

    v_fee := p_amount * 0.05; -- 5% Fee
    v_total_deduction := p_amount + v_fee;

    if v_current_balance < v_total_deduction then
       raise exception 'Insufficient balance (Amount + 5% Fee required)';
    end if;

    -- Find recipient
    select id into v_recipient_id from profiles where username = p_recipient_username;
    
    if v_recipient_id is null then
       raise exception 'Recipient username not found';
    end if;
    
    if v_recipient_id = v_user_id then
       raise exception 'Cannot transfer to yourself';
    end if;

    -- Atomic Transfer
    update profiles set balance = balance - v_total_deduction where id = v_user_id;
    update profiles set balance = balance + p_amount where id = v_recipient_id;

    insert into transactions (user_id, type, amount, fee, status, recipient_username)
    values (v_user_id, 'transfer', p_amount, v_fee, 'completed', p_recipient_username);
    
    return jsonb_build_object('status', 'success', 'message', 'Transfer successful');
  end if;

  raise exception 'Invalid transaction type';
end;
$$;

-- 5. ADMIN APPROVAL RPC (Admin Initiated)
create or replace function approve_transaction(
  p_transaction_id uuid,
  p_action text -- 'approve' or 'reject'
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_trans record;
begin
  -- Fetch the transaction details
  select * into v_trans from transactions where id = p_transaction_id;
  
  if v_trans.id is null then
    raise exception 'Transaction not found';
  end if;

  if v_trans.status != 'pending' then
    raise exception 'Transaction is already processed';
  end if;

  if p_action = 'approve' then
    if v_trans.type = 'deposit' then
      -- Add money to profile on approval
      update profiles set balance = balance + v_trans.amount where id = v_trans.user_id;
    end if;
    -- For withdrawals, money was already deducted (escrow), so we just mark completed
    update transactions set status = 'completed' where id = p_transaction_id;
    
  elsif p_action = 'reject' then
    if v_trans.type = 'withdraw' then
      -- Refund the money since the withdrawal failed
      update profiles set balance = balance + v_trans.amount where id = v_trans.user_id;
    end if;
    update transactions set status = 'failed' where id = p_transaction_id;
  end if;

  return jsonb_build_object('status', 'success', 'new_status', p_action);
end;
$$;
