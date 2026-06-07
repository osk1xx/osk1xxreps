ALTER TABLE public.tutorial_steps
  ADD COLUMN IF NOT EXISTS link_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS link_label text NOT NULL DEFAULT '';