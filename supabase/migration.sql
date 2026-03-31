-- ================================================
-- MI INFORME - Database Schema
-- ================================================

-- PROFILES TABLE
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  goal_type TEXT NOT NULL DEFAULT 'publicador'
    CHECK (goal_type IN ('publicador', 'precursor_auxiliar', 'precursor_regular', 'custom')),
  custom_goal_hours NUMERIC(6,1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CATEGORIES TABLE (only for configurable "Otros" sub-categories)
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default categories for new users
CREATE OR REPLACE FUNCTION public.seed_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.categories (user_id, name, sort_order) VALUES
    (NEW.id, 'Betel', 0),
    (NEW.id, 'CEH', 1),
    (NEW.id, 'AR', 2),
    (NEW.id, 'AC', 3),
    (NEW.id, 'Otros', 4);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.seed_default_categories();

-- ACTIVITY ENTRIES TABLE (multiple entries per day allowed)
CREATE TABLE public.activity_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  predicacion_hours NUMERIC(5,2) NOT NULL DEFAULT 0,
  cursos_biblicos INTEGER NOT NULL DEFAULT 0,
  otros_hours JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast monthly/annual queries
CREATE INDEX idx_activity_entries_user_date
  ON public.activity_entries(user_id, entry_date);

-- ================================================
-- ROW LEVEL SECURITY
-- ================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_entries ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Categories
CREATE POLICY "Users can view own categories"
  ON public.categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categories"
  ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories"
  ON public.categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories"
  ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- Activity entries
CREATE POLICY "Users can view own entries"
  ON public.activity_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own entries"
  ON public.activity_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own entries"
  ON public.activity_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own entries"
  ON public.activity_entries FOR DELETE USING (auth.uid() = user_id);
