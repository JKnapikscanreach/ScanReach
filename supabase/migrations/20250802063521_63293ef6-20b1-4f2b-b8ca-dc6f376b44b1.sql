-- Insert demo microsites with proper UUIDs
WITH demo_user AS (SELECT id FROM users LIMIT 1),
demo_microsites AS (
  INSERT INTO public.microsites (id, name, url, status, scan_count, user_id, created_at, updated_at) VALUES
    (gen_random_uuid(), 'Mario''s Italian Bistro', 'marios-italian-bistro', 'published', 127, (SELECT id FROM demo_user), '2024-01-15 10:30:00', '2024-01-15 10:30:00'),
    (gen_random_uuid(), 'Alex Thompson Design Portfolio', 'alex-thompson-design', 'published', 89, (SELECT id FROM demo_user), '2024-01-18 14:20:00', '2024-01-18 14:20:00'),
    (gen_random_uuid(), 'The Gentlemen''s Barbershop', 'gentlemens-barbershop', 'published', 203, (SELECT id FROM demo_user), '2024-01-22 09:15:00', '2024-01-22 09:15:00'),
    (gen_random_uuid(), 'Ocean Conservation Society', 'ocean-conservation', 'published', 156, (SELECT id FROM demo_user), '2024-01-25 16:45:00', '2024-01-25 16:45:00'),
    (gen_random_uuid(), 'TechCon 2024 - AI Summit', 'techcon-2024-ai-summit', 'published', 342, (SELECT id FROM demo_user), '2024-01-28 11:00:00', '2024-01-28 11:00:00'),
    (gen_random_uuid(), 'EcoBlend Coffee Roasters', 'ecoblend-coffee', 'draft', 45, (SELECT id FROM demo_user), '2024-02-01 13:30:00', '2024-02-01 13:30:00'),
    (gen_random_uuid(), 'Sarah Mitchell - Lifestyle Blog', 'sarah-mitchell-lifestyle', 'published', 78, (SELECT id FROM demo_user), '2024-02-03 08:20:00', '2024-02-03 08:20:00'),
    (gen_random_uuid(), 'Metropolitan Real Estate - Lisa Park', 'lisa-park-realestate', 'draft', 23, (SELECT id FROM demo_user), '2024-02-05 15:10:00', '2024-02-05 15:10:00')
  RETURNING id, name, url
)
SELECT * FROM demo_microsites;