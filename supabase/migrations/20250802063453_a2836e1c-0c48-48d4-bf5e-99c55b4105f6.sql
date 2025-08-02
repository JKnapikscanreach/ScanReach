-- Insert demo microsites (we'll use a placeholder user_id - you'll need to replace with actual user IDs)
INSERT INTO public.microsites (id, name, url, status, scan_count, user_id, created_at, updated_at) VALUES
  ('demo-001', 'Mario''s Italian Bistro', 'marios-italian-bistro', 'published', 127, (SELECT id FROM users LIMIT 1), '2024-01-15 10:30:00', '2024-01-15 10:30:00'),
  ('demo-002', 'Alex Thompson Design Portfolio', 'alex-thompson-design', 'published', 89, (SELECT id FROM users LIMIT 1), '2024-01-18 14:20:00', '2024-01-18 14:20:00'),
  ('demo-003', 'The Gentlemen''s Barbershop', 'gentlemens-barbershop', 'published', 203, (SELECT id FROM users LIMIT 1), '2024-01-22 09:15:00', '2024-01-22 09:15:00'),
  ('demo-004', 'Ocean Conservation Society', 'ocean-conservation', 'published', 156, (SELECT id FROM users LIMIT 1), '2024-01-25 16:45:00', '2024-01-25 16:45:00'),
  ('demo-005', 'TechCon 2024 - AI Summit', 'techcon-2024-ai-summit', 'published', 342, (SELECT id FROM users LIMIT 1), '2024-01-28 11:00:00', '2024-01-28 11:00:00'),
  ('demo-006', 'EcoBlend Coffee Roasters', 'ecoblend-coffee', 'draft', 45, (SELECT id FROM users LIMIT 1), '2024-02-01 13:30:00', '2024-02-01 13:30:00'),
  ('demo-007', 'Sarah Mitchell - Lifestyle Blog', 'sarah-mitchell-lifestyle', 'published', 78, (SELECT id FROM users LIMIT 1), '2024-02-03 08:20:00', '2024-02-03 08:20:00'),
  ('demo-008', 'Metropolitan Real Estate - Lisa Park', 'lisa-park-realestate', 'draft', 23, (SELECT id FROM users LIMIT 1), '2024-02-05 15:10:00', '2024-02-05 15:10:00');

-- Insert microsite content
INSERT INTO public.microsite_content (microsite_id, title, header_image_url, theme_config) VALUES
  ('demo-001', 'Mario''s Italian Bistro', null, '{"text": "#2c1810", "primary": "#d4af37", "background": "#fffef7"}'),
  ('demo-002', 'Alex Thompson Design', null, '{"text": "#1a1a1a", "primary": "#6366f1", "background": "#ffffff"}'),
  ('demo-003', 'The Gentlemen''s Barbershop', null, '{"text": "#f5f5f5", "primary": "#b8860b", "background": "#1a1a1a"}'),
  ('demo-004', 'Ocean Conservation Society', null, '{"text": "#0f172a", "primary": "#0ea5e9", "background": "#f0f9ff"}'),
  ('demo-005', 'TechCon 2024 - AI Summit', null, '{"text": "#ffffff", "primary": "#10b981", "background": "#111827"}'),
  ('demo-006', 'EcoBlend Coffee Roasters', null, '{"text": "#3c2415", "primary": "#92400e", "background": "#fef3e2"}'),
  ('demo-007', 'Sarah Mitchell Lifestyle', null, '{"text": "#7c2d12", "primary": "#ec4899", "background": "#fdf2f8"}'),
  ('demo-008', 'Lisa Park Real Estate', null, '{"text": "#1e293b", "primary": "#0f766e", "background": "#f0fdfa"}');

-- Insert microsite cards for Mario's Italian Bistro
INSERT INTO public.microsite_cards (id, microsite_id, title, content, sort_order) VALUES
  ('card-001-01', 'demo-001', 'Welcome to Mario''s', 'Experience authentic Italian cuisine in the heart of downtown. Family recipes passed down through generations, using only the finest imported ingredients.', 0),
  ('card-001-02', 'demo-001', 'Our Menu', 'Handmade pasta, wood-fired pizzas, fresh seafood, and traditional desserts. View our full menu and daily specials.', 1),
  ('card-001-03', 'demo-001', 'Visit Us', 'Located at 123 Main Street, Downtown. Open Tuesday-Sunday, 5PM-10PM. Reservations recommended.', 2);

-- Insert buttons for Mario's Italian Bistro
INSERT INTO public.microsite_buttons (card_id, label, action_type, action_value, sort_order) VALUES
  ('card-001-02', 'View Full Menu', 'link', 'https://marios-bistro.com/menu', 0),
  ('card-001-02', 'Order Online', 'link', 'https://marios-bistro.com/order', 1),
  ('card-001-03', 'Make Reservation', 'phone', '+1-555-0123', 0),
  ('card-001-03', 'Get Directions', 'link', 'https://maps.google.com/?q=123+Main+Street', 1);

-- Insert microsite cards for Alex Thompson Design
INSERT INTO public.microsite_cards (id, microsite_id, title, content, sort_order) VALUES
  ('card-002-01', 'demo-002', 'Creative Designer & Art Director', 'Specializing in brand identity, digital experiences, and visual storytelling. 8+ years creating impactful designs for startups and Fortune 500 companies.', 0),
  ('card-002-02', 'demo-002', 'Featured Projects', 'From startup logos to complete brand systems, explore my latest work in branding, web design, and packaging.', 1),
  ('card-002-03', 'demo-002', 'Let''s Collaborate', 'Available for freelance projects and full-time opportunities. Let''s create something amazing together.', 2);

-- Insert buttons for Alex Thompson Design
INSERT INTO public.microsite_buttons (card_id, label, action_type, action_value, sort_order) VALUES
  ('card-002-01', 'Download Resume', 'link', 'https://alexthompson.design/resume.pdf', 0),
  ('card-002-02', 'View Portfolio', 'link', 'https://alexthompson.design/portfolio', 0),
  ('card-002-02', 'Behance Profile', 'link', 'https://behance.net/alexthompson', 1),
  ('card-002-03', 'Email Me', 'email', 'alex@alexthompson.design', 0),
  ('card-002-03', 'LinkedIn', 'link', 'https://linkedin.com/in/alexthompsondesign', 1);

-- Insert microsite cards for The Gentlemen's Barbershop
INSERT INTO public.microsite_cards (id, microsite_id, title, content, sort_order) VALUES
  ('card-003-01', 'demo-003', 'Classic Cuts & Modern Style', 'Traditional barbering with a contemporary twist. Expert cuts, hot towel shaves, and beard grooming in a refined atmosphere.', 0),
  ('card-003-02', 'demo-003', 'Services & Pricing', 'Haircuts, beard trims, hot towel shaves, and grooming packages. Premium products and skilled craftsmen.', 1),
  ('card-003-03', 'demo-003', 'Book Your Appointment', 'Walk-ins welcome, but appointments preferred. Open Monday-Saturday, 9AM-7PM.', 2);

-- Insert buttons for The Gentlemen's Barbershop
INSERT INTO public.microsite_buttons (card_id, label, action_type, action_value, sort_order) VALUES
  ('card-003-02', 'View Services', 'link', 'https://gentlemensbarbershop.com/services', 0),
  ('card-003-03', 'Book Online', 'link', 'https://gentlemensbarbershop.com/booking', 0),
  ('card-003-03', 'Call Shop', 'phone', '+1-555-0456', 1);

-- Insert microsite cards for Ocean Conservation Society
INSERT INTO public.microsite_cards (id, microsite_id, title, content, sort_order) VALUES
  ('card-004-01', 'demo-004', 'Protecting Our Oceans', 'Join our mission to preserve marine ecosystems through research, education, and direct action. Every action counts in saving our blue planet.', 0),
  ('card-004-02', 'demo-004', 'Get Involved', 'Volunteer opportunities, beach cleanups, educational programs, and donation drives. Make a difference in your community.', 1),
  ('card-004-03', 'demo-004', 'Support Our Mission', 'Your donation helps fund research expeditions, educational programs, and conservation efforts worldwide.', 2);

-- Insert buttons for Ocean Conservation Society
INSERT INTO public.microsite_buttons (card_id, label, action_type, action_value, sort_order) VALUES
  ('card-004-01', 'Learn More', 'link', 'https://oceanconservation.org/about', 0),
  ('card-004-02', 'Find Events', 'link', 'https://oceanconservation.org/events', 0),
  ('card-004-02', 'Volunteer Form', 'link', 'https://oceanconservation.org/volunteer', 1),
  ('card-004-03', 'Donate Now', 'link', 'https://oceanconservation.org/donate', 0);

-- Insert microsite cards for TechCon 2024
INSERT INTO public.microsite_cards (id, microsite_id, title, content, sort_order) VALUES
  ('card-005-01', 'demo-005', 'AI Summit 2024', 'Join industry leaders, researchers, and innovators for three days of cutting-edge AI discussions, workshops, and networking.', 0),
  ('card-005-02', 'demo-005', 'Event Details', 'March 15-17, 2024 at the Convention Center. 50+ speakers, 30+ sessions, hands-on workshops, and expo hall.', 1),
  ('card-005-03', 'demo-005', 'Register Now', 'Early bird pricing available until February 15th. Student discounts and group rates available.', 2);

-- Insert buttons for TechCon 2024
INSERT INTO public.microsite_buttons (card_id, label, action_type, action_value, sort_order) VALUES
  ('card-005-01', 'View Speakers', 'link', 'https://techcon2024.com/speakers', 0),
  ('card-005-02', 'Full Schedule', 'link', 'https://techcon2024.com/schedule', 0),
  ('card-005-02', 'Venue Info', 'link', 'https://techcon2024.com/venue', 1),
  ('card-005-03', 'Register', 'link', 'https://techcon2024.com/register', 0);

-- Insert microsite cards for EcoBlend Coffee
INSERT INTO public.microsite_cards (id, microsite_id, title, content, sort_order) VALUES
  ('card-006-01', 'demo-006', 'Sustainable Coffee Roasters', 'Ethically sourced, expertly roasted coffee beans. Supporting fair trade practices and environmental sustainability with every cup.', 0),
  ('card-006-02', 'demo-006', 'Our Coffee Selection', 'Single-origin beans, signature blends, and seasonal roasts. From light citrusy notes to rich, bold flavors.', 1);

-- Insert buttons for EcoBlend Coffee
INSERT INTO public.microsite_buttons (card_id, label, action_type, action_value, sort_order) VALUES
  ('card-006-01', 'Our Story', 'link', 'https://ecoblendcoffee.com/story', 0),
  ('card-006-02', 'Shop Coffee', 'link', 'https://ecoblendcoffee.com/shop', 0),
  ('card-006-02', 'Subscription', 'link', 'https://ecoblendcoffee.com/subscribe', 1);

-- Insert microsite cards for Sarah Mitchell Lifestyle
INSERT INTO public.microsite_cards (id, microsite_id, title, content, sort_order) VALUES
  ('card-007-01', 'demo-007', 'Lifestyle & Wellness', 'Sharing authentic moments, wellness tips, and style inspiration. Join me on a journey to living beautifully and intentionally.', 0),
  ('card-007-02', 'demo-007', 'Latest Content', 'Weekly blog posts, Instagram stories, and YouTube videos covering fashion, wellness, travel, and home decor.', 1),
  ('card-007-03', 'demo-007', 'Connect With Me', 'Follow along on social media and join our community of like-minded individuals pursuing their best lives.', 2);

-- Insert buttons for Sarah Mitchell Lifestyle
INSERT INTO public.microsite_buttons (card_id, label, action_type, action_value, sort_order) VALUES
  ('card-007-02', 'Read Blog', 'link', 'https://sarahmitchell.com/blog', 0),
  ('card-007-02', 'YouTube', 'link', 'https://youtube.com/sarahmitchellstyle', 1),
  ('card-007-03', 'Instagram', 'link', 'https://instagram.com/sarahmitchellstyle', 0),
  ('card-007-03', 'Newsletter', 'link', 'https://sarahmitchell.com/newsletter', 1);

-- Insert microsite cards for Lisa Park Real Estate
INSERT INTO public.microsite_cards (id, microsite_id, title, content, sort_order) VALUES
  ('card-008-01', 'demo-008', 'Your Metro Real Estate Expert', 'Helping families find their perfect home in the metropolitan area. 12 years of experience with personalized service and market expertise.', 0),
  ('card-008-02', 'demo-008', 'Current Listings', 'Explore available properties from luxury condos to family homes. Updated daily with virtual tours and detailed information.', 1),
  ('card-008-03', 'demo-008', 'Ready to Start?', 'Whether buying or selling, I''m here to guide you through every step. Free market analysis and consultation available.', 2);

-- Insert buttons for Lisa Park Real Estate
INSERT INTO public.microsite_buttons (card_id, label, action_type, action_value, sort_order) VALUES
  ('card-008-01', 'About Lisa', 'link', 'https://lisapark.realestate/about', 0),
  ('card-008-02', 'View Listings', 'link', 'https://lisapark.realestate/listings', 0),
  ('card-008-02', 'Virtual Tours', 'link', 'https://lisapark.realestate/tours', 1),
  ('card-008-03', 'Contact Me', 'phone', '+1-555-0789', 0),
  ('card-008-03', 'Free Analysis', 'email', 'lisa@lisapark.realestate', 1);

-- Insert some scan records for demo data
INSERT INTO public.microsite_scans (microsite_id, user_agent, ip_address, scanned_at) VALUES
  ('demo-001', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', '192.168.1.100', '2024-02-01 12:30:00'),
  ('demo-001', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '192.168.1.101', '2024-02-01 14:15:00'),
  ('demo-003', 'Mozilla/5.0 (Android 13; Mobile)', '192.168.1.102', '2024-02-02 09:45:00'),
  ('demo-005', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', '192.168.1.103', '2024-02-02 16:20:00');