-- POZO Database Schema
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/zyswesimxgtdotowuvsv/sql/new)

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  wallet_address TEXT NOT NULL UNIQUE,
  cábala TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Pools (JSONB for participants & events — simpler for hackathon, still queryable)
CREATE TABLE IF NOT EXISTS pools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  match_name TEXT NOT NULL,
  stake_amount NUMERIC(20,2) NOT NULL DEFAULT 5,
  total_pool NUMERIC(20,2) NOT NULL DEFAULT 0,
  capacity INT NOT NULL DEFAULT 6,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','locked','active','settled')),
  host_id TEXT NOT NULL,
  participants JSONB NOT NULL DEFAULT '[]'::jsonb,
  events JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_at TIMESTAMPTZ,
  settled_at TIMESTAMPTZ,
  tx_hashes TEXT[] DEFAULT '{}'::text[]   -- on-chain settlement transaction hashes (WDK)
);

-- 3. Asado bills (JSONB for expenses, TEXT[] for participants)
CREATE TABLE IF NOT EXISTS asado_bills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  participants TEXT[] NOT NULL DEFAULT '{}',
  expenses JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes (IF NOT EXISTS guards for re-runs)
CREATE INDEX IF NOT EXISTS pools_status_idx ON pools(status);
CREATE INDEX IF NOT EXISTS pools_created_at_idx ON pools(created_at DESC);
CREATE INDEX IF NOT EXISTS users_wallet_address_idx ON users(wallet_address);
CREATE INDEX IF NOT EXISTS asado_bills_created_at_idx ON asado_bills(created_at DESC);

-- Migration: add tx_hashes to existing pools table (safe to run multiple times)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pools' AND column_name = 'tx_hashes'
  ) THEN
    ALTER TABLE pools ADD COLUMN tx_hashes TEXT[] DEFAULT '{}'::text[];
  END IF;
END $$;

-- RLS: Enable row-level security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE asado_bills ENABLE ROW LEVEL SECURITY;

-- RLS Policies — permissive for hackathon (IF NOT EXISTS guards)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='users' AND policyname='Users are public-readable') THEN
    CREATE POLICY "Users are public-readable" ON users FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='users' AND policyname='Users can insert their own profile') THEN
    CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pools' AND policyname='Pools are public-readable') THEN
    CREATE POLICY "Pools are public-readable" ON pools FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pools' AND policyname='Anyone can create a pool') THEN
    CREATE POLICY "Anyone can create a pool" ON pools FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pools' AND policyname='Anyone can update a pool') THEN
    CREATE POLICY "Anyone can update a pool" ON pools FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='asado_bills' AND policyname='Asado bills are public-readable') THEN
    CREATE POLICY "Asado bills are public-readable" ON asado_bills FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='asado_bills' AND policyname='Anyone can create an asado bill') THEN
    CREATE POLICY "Anyone can create an asado bill" ON asado_bills FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='asado_bills' AND policyname='Anyone can update an asado bill') THEN
    CREATE POLICY "Anyone can update an asado bill" ON asado_bills FOR UPDATE USING (true);
  END IF;
END $$;

-- Seed data for demo (INSERT only if not already present)
INSERT INTO users (username, wallet_address, cábala) VALUES
  ('Cebolla', '0x742d35Cc6634C0532925a3b8D9C5c8b7b6e5f6e5', 'Misma remera'),
  ('DibuFan', '0x8ba1f109551bD432803012645Ac136ddd64DBA72', 'No como hasta el descanso'),
  ('Messi10', '0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec', 'De Paul come caramelos')
ON CONFLICT DO NOTHING;
