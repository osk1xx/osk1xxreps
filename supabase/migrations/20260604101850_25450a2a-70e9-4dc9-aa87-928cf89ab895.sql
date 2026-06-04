-- Agent config on settings
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS agent_config jsonb NOT NULL DEFAULT '{
    "base": "https://uidbuy.com/product",
    "ref": "LZU8AH",
    "platforms": { "1688": "1", "taobao": "2", "weidian": "3" }
  }'::jsonb;

-- Tutorials
CREATE TABLE public.tutorials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  language text NOT NULL DEFAULT 'en',
  title text NOT NULL,
  description text,
  published boolean NOT NULL DEFAULT false,
  sort integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.tutorials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tutorials TO authenticated;
GRANT ALL ON public.tutorials TO service_role;

ALTER TABLE public.tutorials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can view published tutorials"
  ON public.tutorials FOR SELECT
  USING (published = true);

CREATE POLICY "admins can view all tutorials"
  ON public.tutorials FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins can insert tutorials"
  ON public.tutorials FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins can update tutorials"
  ON public.tutorials FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins can delete tutorials"
  ON public.tutorials FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Tutorial steps
CREATE TABLE public.tutorial_steps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tutorial_id uuid NOT NULL REFERENCES public.tutorials(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  name text NOT NULL DEFAULT '',
  text text NOT NULL DEFAULT '',
  photos jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.tutorial_steps TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tutorial_steps TO authenticated;
GRANT ALL ON public.tutorial_steps TO service_role;

ALTER TABLE public.tutorial_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can view steps of published tutorials"
  ON public.tutorial_steps FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tutorials t
    WHERE t.id = tutorial_steps.tutorial_id AND t.published = true
  ));

CREATE POLICY "admins can view all steps"
  ON public.tutorial_steps FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins can insert steps"
  ON public.tutorial_steps FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins can update steps"
  ON public.tutorial_steps FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins can delete steps"
  ON public.tutorial_steps FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_tutorials_updated_at
  BEFORE UPDATE ON public.tutorials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tutorial_steps_updated_at
  BEFORE UPDATE ON public.tutorial_steps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();