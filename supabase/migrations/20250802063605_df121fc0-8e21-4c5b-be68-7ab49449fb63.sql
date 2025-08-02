-- Insert microsite content for all demo microsites
INSERT INTO public.microsite_content (microsite_id, title, header_image_url, theme_config) 
SELECT 
  id,
  CASE 
    WHEN name = 'Mario''s Italian Bistro' THEN 'Mario''s Italian Bistro'
    WHEN name = 'Alex Thompson Design Portfolio' THEN 'Alex Thompson Design'
    WHEN name = 'The Gentlemen''s Barbershop' THEN 'The Gentlemen''s Barbershop'
    WHEN name = 'Ocean Conservation Society' THEN 'Ocean Conservation Society'
    WHEN name = 'TechCon 2024 - AI Summit' THEN 'TechCon 2024 - AI Summit'
    WHEN name = 'EcoBlend Coffee Roasters' THEN 'EcoBlend Coffee Roasters'
    WHEN name = 'Sarah Mitchell - Lifestyle Blog' THEN 'Sarah Mitchell Lifestyle'
    WHEN name = 'Metropolitan Real Estate - Lisa Park' THEN 'Lisa Park Real Estate'
  END as title,
  null as header_image_url,
  CASE 
    WHEN name = 'Mario''s Italian Bistro' THEN '{"text": "#2c1810", "primary": "#d4af37", "background": "#fffef7"}'::jsonb
    WHEN name = 'Alex Thompson Design Portfolio' THEN '{"text": "#1a1a1a", "primary": "#6366f1", "background": "#ffffff"}'::jsonb
    WHEN name = 'The Gentlemen''s Barbershop' THEN '{"text": "#f5f5f5", "primary": "#b8860b", "background": "#1a1a1a"}'::jsonb
    WHEN name = 'Ocean Conservation Society' THEN '{"text": "#0f172a", "primary": "#0ea5e9", "background": "#f0f9ff"}'::jsonb
    WHEN name = 'TechCon 2024 - AI Summit' THEN '{"text": "#ffffff", "primary": "#10b981", "background": "#111827"}'::jsonb
    WHEN name = 'EcoBlend Coffee Roasters' THEN '{"text": "#3c2415", "primary": "#92400e", "background": "#fef3e2"}'::jsonb
    WHEN name = 'Sarah Mitchell - Lifestyle Blog' THEN '{"text": "#7c2d12", "primary": "#ec4899", "background": "#fdf2f8"}'::jsonb
    WHEN name = 'Metropolitan Real Estate - Lisa Park' THEN '{"text": "#1e293b", "primary": "#0f766e", "background": "#f0fdfa"}'::jsonb
  END as theme_config
FROM microsites 
WHERE name IN (
  'Mario''s Italian Bistro', 
  'Alex Thompson Design Portfolio', 
  'The Gentlemen''s Barbershop', 
  'Ocean Conservation Society', 
  'TechCon 2024 - AI Summit', 
  'EcoBlend Coffee Roasters', 
  'Sarah Mitchell - Lifestyle Blog', 
  'Metropolitan Real Estate - Lisa Park'
);