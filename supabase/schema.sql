-- MarketMojo.ai Database Schema

-- Organizations (for white-label)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#0d9488',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Users / Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  organization_id UUID REFERENCES organizations(id),
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Businesses
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  facebook TEXT,
  social_url TEXT,
  has_website BOOLEAN DEFAULT false,
  web_presence TEXT DEFAULT 'none' CHECK (web_presence IN ('website', 'facebook-only', 'social-only', 'none')),
  rating NUMERIC(2,1),
  review_count INTEGER DEFAULT 0,
  category TEXT,
  google_maps_uri TEXT,
  source TEXT DEFAULT 'google',
  search_query TEXT,
  -- Status
  status TEXT DEFAULT 'neutral' CHECK (status IN ('neutral', 'prospect', 'priority', 'dismissed')),
  pipeline_stage TEXT DEFAULT 'none' CHECK (pipeline_stage IN ('none', 'contacted', 'meeting', 'proposal', 'won', 'lost')),
  -- Tags
  service_tags TEXT[] DEFAULT '{}',
  needs_seo BOOLEAN DEFAULT false,
  -- Contact
  emails TEXT[] DEFAULT '{}',
  notes TEXT,
  -- Analysis data (stored as JSONB)
  analysis JSONB,
  duelly_scan JSONB,
  gbp_audit JSONB,
  rankings JSONB DEFAULT '[]',
  -- Timestamps
  saved_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Audits (search snapshots)
CREATE TABLE IF NOT EXISTS audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  query TEXT NOT NULL,
  location TEXT NOT NULL,
  category TEXT,
  results JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Search Reports
CREATE TABLE IF NOT EXISTS search_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  location TEXT NOT NULL,
  category TEXT,
  search_query TEXT NOT NULL,
  business_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_businesses_project ON businesses(project_id);
CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses(project_id, status);
CREATE INDEX IF NOT EXISTS idx_businesses_web_presence ON businesses(project_id, web_presence);
CREATE INDEX IF NOT EXISTS idx_businesses_name ON businesses(project_id, name);
CREATE INDEX IF NOT EXISTS idx_audits_project ON audits(project_id);
CREATE INDEX IF NOT EXISTS idx_search_reports_project ON search_reports(project_id);

-- Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: users can read/update their own
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Organizations: members can view their org
CREATE POLICY "Org members can view org" ON organizations
  FOR SELECT USING (
    id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

-- Projects: users can CRUD their own projects
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create projects" ON projects
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (user_id = auth.uid());

-- Businesses: users can CRUD businesses in their projects
CREATE POLICY "Users can view businesses in own projects" ON businesses
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can create businesses in own projects" ON businesses
  FOR INSERT WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can update businesses in own projects" ON businesses
  FOR UPDATE USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can delete businesses in own projects" ON businesses
  FOR DELETE USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- Audits: same pattern
CREATE POLICY "Users can view audits in own projects" ON audits
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can create audits in own projects" ON audits
  FOR INSERT WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can delete audits in own projects" ON audits
  FOR DELETE USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- Search reports: same pattern
CREATE POLICY "Users can view reports in own projects" ON search_reports
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can create reports in own projects" ON search_reports
  FOR INSERT WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
