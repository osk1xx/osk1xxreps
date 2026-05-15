ALTER TABLE public.products ADD COLUMN badge text;
ALTER TABLE public.products ADD CONSTRAINT products_badge_check CHECK (badge IS NULL OR badge IN ('best','budget'));