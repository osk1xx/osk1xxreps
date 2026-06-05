CREATE TABLE public.agents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  logo_url text,
  register_url text NOT NULL DEFAULT '',
  recommended boolean NOT NULL DEFAULT false,
  base text NOT NULL DEFAULT 'https://uidbuy.com/product',
  ref text NOT NULL DEFAULT '',
  platform_1688 text NOT NULL DEFAULT '1',
  platform_taobao text NOT NULL DEFAULT '2',
  platform_weidian text NOT NULL DEFAULT '3',
  promo_title_en text NOT NULL DEFAULT '',
  promo_body_en text NOT NULL DEFAULT '',
  promo_title_pl text NOT NULL DEFAULT '',
  promo_body_pl text NOT NULL DEFAULT '',
  promo_image_url text,
  sort integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.agents TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agents TO authenticated;
GRANT ALL ON public.agents TO service_role;

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can view active agents"
  ON public.agents FOR SELECT
  USING (active = true);

CREATE POLICY "admins can view all agents"
  ON public.agents FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins can insert agents"
  ON public.agents FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins can update agents"
  ON public.agents FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins can delete agents"
  ON public.agents FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.agents (name, register_url, recommended, base, ref, promo_title_en, promo_body_en, promo_title_pl, promo_body_pl, sort)
VALUES (
  'UIDBuy',
  'https://uidbuy.com/register?ref=LZU8AH',
  true,
  'https://uidbuy.com/product',
  'LZU8AH',
  '35% OFF shipping for 6 months + unlimited 25% coupons',
  'UIDBUY is the new cheapest and fastest Chinese shipping agent. Lower fees, faster QC, faster shipping. New users get 35% off shipping valid for 6 months — plus an unlimited 25% off coupon you can collect every day.',
  '35% RABATU na wysyłkę przez 6 miesięcy + nielimitowane kupony 25%',
  'UIDBUY to nowy, najtańszy i najszybszy chiński agent wysyłkowy. Niższe opłaty, szybsze QC, szybsza wysyłka. Nowi użytkownicy dostają 35% rabatu na wysyłkę ważne przez 6 miesięcy — plus nielimitowany kupon 25% do odbioru codziennie.',
  0
);