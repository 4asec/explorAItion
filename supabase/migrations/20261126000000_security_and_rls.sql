-- =============================================================================
-- Migration: 20261126000000_security_and_rls.sql
-- Description: Rebuild Security Foundation, RLS Policies, Profile Triggers,
--              and Opportunities Status Synchronization for Angkasa Platform.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. PROFILES TABLE & ROLE CONSTRAINT
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT 'Peserta Angkasa',
  email TEXT NOT NULL,
  username TEXT,
  institution TEXT DEFAULT 'Perguruan Tinggi',
  birth_date TEXT DEFAULT '2004-01-01',
  education_level TEXT DEFAULT 'Mahasiswa',
  province TEXT DEFAULT 'Indonesia',
  city TEXT DEFAULT 'Indonesia',
  profiling TEXT[] DEFAULT '{}'::TEXT[],
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'curator', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure role column and check constraint exist if profiles table was created earlier
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'user';
  END IF;

  -- Add check constraint if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_schema = 'public' AND table_name = 'profiles' AND constraint_name = 'profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'curator', 'admin'));
  END IF;
END $$;

-- Trigger otomatis on_auth_user_created agar setiap user baru langsung memiliki baris profil valid
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    username,
    institution,
    education_level,
    role,
    profiling,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'Peserta Angkasa'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'institution', 'Perguruan Tinggi'),
    COALESCE(NEW.raw_user_meta_data->>'education_level', 'Mahasiswa'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    '{}'::TEXT[],
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 2. OPPORTUNITIES TABLE & STATUS COLUMNS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.opportunities (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Lomba', 'Beasiswa', 'Seminar')),
  organizer TEXT NOT NULL,
  caption TEXT,
  deadline TIMESTAMPTZ,
  description TEXT,
  description_roadmap TEXT,
  requirements TEXT[] DEFAULT '{}'::TEXT[],
  required_skills TEXT[] DEFAULT '{}'::TEXT[],
  registration_url TEXT NOT NULL DEFAULT 'https://angkasa.id',
  image_url TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure status, deadline, and created_by exist on existing installations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.opportunities ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
    ALTER TABLE public.opportunities ADD CONSTRAINT opportunities_status_check CHECK (status IN ('pending', 'verified', 'rejected'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'deadline'
  ) THEN
    ALTER TABLE public.opportunities ADD COLUMN deadline TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.opportunities ADD COLUMN created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Sinkronisasi otomatis dua arah antara kolom status dan is_verified
CREATE OR REPLACE FUNCTION public.sync_opportunity_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'verified' THEN
    NEW.is_verified := TRUE;
  ELSIF NEW.status IN ('pending', 'rejected') THEN
    NEW.is_verified := FALSE;
  ELSIF NEW.is_verified = TRUE THEN
    NEW.status := 'verified';
  ELSE
    NEW.status := 'pending';
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_opportunity_status ON public.opportunities;
CREATE TRIGGER trg_sync_opportunity_status
  BEFORE INSERT OR UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.sync_opportunity_status();

-- -----------------------------------------------------------------------------
-- 3. TEAM REQUESTS & INVITES TABLES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.team_requests (
  id TEXT PRIMARY KEY,
  opportunity_id TEXT NOT NULL,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  creator_name TEXT NOT NULL,
  team_name TEXT NOT NULL,
  role_needed TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.team_invites (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  team_request_id TEXT NOT NULL REFERENCES public.team_requests(id) ON DELETE CASCADE,
  opportunity_id TEXT,
  opportunity_title TEXT,
  team_name TEXT,
  applicant_id TEXT,
  applicant_name TEXT,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  role_applied TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 4. HELPER FUNCTION: CHECK ADMIN OR CURATOR ROLE
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin_or_curator()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'curator')
  );
$$;

-- -----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------

-- A. Table: PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin_or_curator());

-- B. Table: OPPORTUNITIES
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public and users can view verified opportunities" ON public.opportunities;
CREATE POLICY "Public and users can view verified opportunities"
  ON public.opportunities FOR SELECT
  USING (
    status = 'verified'
    OR is_verified = TRUE
    OR public.is_admin_or_curator()
  );

DROP POLICY IF EXISTS "Admins and curators can insert opportunities" ON public.opportunities;
CREATE POLICY "Admins and curators can insert opportunities"
  ON public.opportunities FOR INSERT
  WITH CHECK (public.is_admin_or_curator());

DROP POLICY IF EXISTS "Admins and curators can update opportunities" ON public.opportunities;
CREATE POLICY "Admins and curators can update opportunities"
  ON public.opportunities FOR UPDATE
  USING (public.is_admin_or_curator());

DROP POLICY IF EXISTS "Admins and curators can delete opportunities" ON public.opportunities;
CREATE POLICY "Admins and curators can delete opportunities"
  ON public.opportunities FOR DELETE
  USING (public.is_admin_or_curator());

-- C. Table: TEAM_REQUESTS
ALTER TABLE public.team_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view open team requests" ON public.team_requests;
CREATE POLICY "Anyone can view open team requests"
  ON public.team_requests FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Authenticated users can create team requests" ON public.team_requests;
CREATE POLICY "Authenticated users can create team requests"
  ON public.team_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Team creators can update their teams" ON public.team_requests;
CREATE POLICY "Team creators can update their teams"
  ON public.team_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Team creators can delete their teams" ON public.team_requests;
CREATE POLICY "Team creators can delete their teams"
  ON public.team_requests FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_id);

-- D. Table: TEAM_INVITES
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view team invites" ON public.team_invites;
CREATE POLICY "Users can view team invites"
  ON public.team_invites FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Authenticated users can submit collaboration invites" ON public.team_invites;
CREATE POLICY "Authenticated users can submit collaboration invites"
  ON public.team_invites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Team creators can review invites" ON public.team_invites;
CREATE POLICY "Team creators can review invites"
  ON public.team_invites FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_requests tr
      WHERE tr.id = team_invites.team_request_id
        AND tr.creator_id = auth.uid()
    )
    OR auth.uid() = sender_id -- allow sender to update status to cancelled
  );

DROP POLICY IF EXISTS "Senders can cancel and creators can delete invites" ON public.team_invites;
CREATE POLICY "Senders can cancel and creators can delete invites"
  ON public.team_invites FOR DELETE
  TO authenticated
  USING (
    auth.uid() = sender_id
    OR EXISTS (
      SELECT 1 FROM public.team_requests tr
      WHERE tr.id = team_invites.team_request_id
        AND tr.creator_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- 6. ENABLE REALTIME PUBLICATION FOR OPPORTUNITIES
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'opportunities'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.opportunities;
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    -- In case supabase_realtime publication is not created in local setup
    CREATE PUBLICATION supabase_realtime FOR TABLE public.opportunities;
END $$;
