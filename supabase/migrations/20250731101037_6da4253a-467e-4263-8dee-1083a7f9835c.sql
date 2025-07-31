-- Clear all fake data and create realistic users and microsites
-- First, clear existing data
DELETE FROM microsite_buttons;
DELETE FROM microsite_cards;
DELETE FROM microsite_content;
DELETE FROM microsite_scans;
DELETE FROM microsites;
DELETE FROM user_sessions;
DELETE FROM users;

-- Create 3 realistic users
INSERT INTO users (id, email, first_name, last_name, company_name, subscription_status, is_admin, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'sarah@bloomdesign.co', 'Sarah', 'Chen', 'Bloom Design Studio', 'pro', false, '2024-01-15 10:00:00+00'),
('550e8400-e29b-41d4-a716-446655440002', 'marcus@rodriguezcoffee.com', 'Marcus', 'Rodriguez', 'Rodriguez Coffee Roasters', 'enterprise', false, '2023-11-20 14:30:00+00'),
('550e8400-e29b-41d4-a716-446655440003', 'hello@emilyfosterphotography.com', 'Emily', 'Foster', null, 'free', false, '2024-03-08 09:15:00+00');

-- Create user sessions for recent activity
INSERT INTO user_sessions (id, user_id, last_login) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '2025-01-30 16:45:00+00'),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '2025-01-31 08:20:00+00'),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', '2025-01-29 12:30:00+00');

-- Create 5 realistic microsites
INSERT INTO microsites (id, name, url, status, user_id, scan_count, last_scan_at, created_at) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'Sarah Chen Portfolio', 'sarah-chen-portfolio', 'published', '550e8400-e29b-41d4-a716-446655440001', 47, '2025-01-30 15:22:00+00', '2024-01-16 11:00:00+00'),
('770e8400-e29b-41d4-a716-446655440002', 'Bloom Design Studio', 'bloom-design-studio', 'published', '550e8400-e29b-41d4-a716-446655440001', 132, '2025-01-31 09:45:00+00', '2024-02-10 13:30:00+00'),
('770e8400-e29b-41d4-a716-446655440003', 'Rodriguez Coffee Menu', 'rodriguez-coffee-menu', 'published', '550e8400-e29b-41d4-a716-446655440002', 298, '2025-01-31 07:18:00+00', '2023-12-05 08:45:00+00'),
('770e8400-e29b-41d4-a716-446655440004', 'Wholesale Coffee Catalog', 'rodriguez-wholesale', 'published', '550e8400-e29b-41d4-a716-446655440002', 76, '2025-01-28 14:10:00+00', '2024-06-20 16:20:00+00'),
('770e8400-e29b-41d4-a716-446655440005', 'Emily Foster Photography', 'emily-foster-photography', 'draft', '550e8400-e29b-41d4-a716-446655440003', 12, '2025-01-25 11:30:00+00', '2024-03-10 10:15:00+00');

-- Create microsite content with realistic themes and descriptions
INSERT INTO microsite_content (id, microsite_id, title, header_image_url, theme_config, created_at) VALUES
('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'Sarah Chen', null, '{"primary": "#2D5A87", "background": "#FFFFFF", "text": "#1A1A1A", "accent": "#F4A261"}', '2024-01-16 11:05:00+00'),
('880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440002', 'Bloom Design Studio', null, '{"primary": "#6B73FF", "background": "#FAFAFA", "text": "#2C2C2C", "accent": "#9BC53D"}', '2024-02-10 13:35:00+00'),
('880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440003', 'Rodriguez Coffee', null, '{"primary": "#8B4513", "background": "#FFF8E1", "text": "#3E2723", "accent": "#FF6F00"}', '2023-12-05 08:50:00+00'),
('880e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440004', 'Wholesale Catalog', null, '{"primary": "#5D4037", "background": "#EFEBE9", "text": "#2E2E2E", "accent": "#D84315"}', '2024-06-20 16:25:00+00'),
('880e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440005', 'Emily Foster Photography', null, '{"primary": "#37474F", "background": "#FFFFFF", "text": "#212121", "accent": "#FF7043"}', '2024-03-10 10:20:00+00');

-- Create detailed microsite cards with professional content
INSERT INTO microsite_cards (id, microsite_id, content, media_url, sort_order, created_at) VALUES
-- Sarah Chen Portfolio cards
('990e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'UX/UI Designer specializing in user-centered design for SaaS products. 5+ years creating digital experiences that users love.', null, 0, '2024-01-16 11:10:00+00'),
('990e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', 'Recent Work: Led design for a fintech dashboard that increased user engagement by 40%. Collaborated with cross-functional teams to deliver pixel-perfect designs.', null, 1, '2024-01-16 11:15:00+00'),
-- Bloom Design Studio cards  
('990e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440002', 'Full-service design studio creating memorable brand experiences. From startups to Fortune 500 companies, we bring your vision to life.', null, 0, '2024-02-10 13:40:00+00'),
('990e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440002', 'Services: Brand Identity • Web Design • Product Design • Marketing Materials • Packaging Design', null, 1, '2024-02-10 13:45:00+00'),
-- Rodriguez Coffee Menu cards
('990e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440003', 'Artisan Coffee Roasters since 2018. Single-origin beans roasted daily in small batches. Experience the perfect cup.', null, 0, '2023-12-05 09:00:00+00'),
('990e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440003', 'Signature Blends: House Espresso $4.50 • Colombian Reserve $5.25 • Ethiopian Single-Origin $5.75 • Seasonal Specialty $6.00', null, 1, '2023-12-05 09:05:00+00'),
-- Wholesale Catalog cards
('990e8400-e29b-41d4-a716-446655440007', '770e8400-e29b-41d4-a716-446655440004', 'Premium coffee beans for cafes, restaurants, and retailers. Competitive wholesale pricing with flexible delivery options.', null, 0, '2024-06-20 16:30:00+00'),
('990e8400-e29b-41d4-a716-446655440008', '770e8400-e29b-41d4-a716-446655440004', 'Minimum Order: 10 lbs • Bulk Discounts: 15% off 50+ lbs • Private Labeling Available • Next-Day Delivery in Metro Area', null, 1, '2024-06-20 16:35:00+00'),
-- Emily Foster Photography cards
('990e8400-e29b-41d4-a716-446655440009', '770e8400-e29b-41d4-a716-446655440005', 'Creative portrait and wedding photographer capturing authentic moments. Based in Portland, available for travel worldwide.', null, 0, '2024-03-10 10:25:00+00'),
('990e8400-e29b-41d4-a716-446655440010', '770e8400-e29b-41d4-a716-446655440005', 'Portfolio includes 200+ weddings, commercial shoots for Nike and Intel, and fine art exhibitions in local galleries.', null, 1, '2024-03-10 10:30:00+00');

-- Create action buttons for each microsite (using correct action_types: tel, mailto, url)
INSERT INTO microsite_buttons (id, card_id, label, action_type, action_value, sort_order, created_at) VALUES
-- Sarah Chen Portfolio buttons
('aa0e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440001', 'View Portfolio', 'url', 'https://dribbble.com/sarahchen', 0, '2024-01-16 11:20:00+00'),
('aa0e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440001', 'LinkedIn', 'url', 'https://linkedin.com/in/sarahchenux', 1, '2024-01-16 11:25:00+00'),
('aa0e8400-e29b-41d4-a716-446655440003', '990e8400-e29b-41d4-a716-446655440002', 'Contact Me', 'mailto', 'sarah@bloomdesign.co', 0, '2024-01-16 11:30:00+00'),
-- Bloom Design Studio buttons
('aa0e8400-e29b-41d4-a716-446655440004', '990e8400-e29b-41d4-a716-446655440003', 'View Our Work', 'url', 'https://bloomdesign.co/portfolio', 0, '2024-02-10 13:50:00+00'),
('aa0e8400-e29b-41d4-a716-446655440005', '990e8400-e29b-41d4-a716-446655440003', 'Get Quote', 'mailto', 'hello@bloomdesign.co', 1, '2024-02-10 13:55:00+00'),
('aa0e8400-e29b-41d4-a716-446655440006', '990e8400-e29b-41d4-a716-446655440004', 'Instagram', 'url', 'https://instagram.com/bloomdesignstudio', 0, '2024-02-10 14:00:00+00'),
-- Rodriguez Coffee Menu buttons
('aa0e8400-e29b-41d4-a716-446655440007', '990e8400-e29b-41d4-a716-446655440005', 'Order Online', 'url', 'https://rodriguezcoffee.com/order', 0, '2023-12-05 09:10:00+00'),
('aa0e8400-e29b-41d4-a716-446655440008', '990e8400-e29b-41d4-a716-446655440005', 'Visit Us', 'url', 'https://maps.google.com/rodriguez-coffee', 1, '2023-12-05 09:15:00+00'),
('aa0e8400-e29b-41d4-a716-446655440009', '990e8400-e29b-41d4-a716-446655440006', 'Call to Order', 'tel', '+1-503-555-0123', 0, '2023-12-05 09:20:00+00'),
-- Wholesale Catalog buttons
('aa0e8400-e29b-41d4-a716-446655440010', '990e8400-e29b-41d4-a716-446655440007', 'Request Samples', 'mailto', 'wholesale@rodriguezcoffee.com', 0, '2024-06-20 16:40:00+00'),
('aa0e8400-e29b-41d4-a716-446655440011', '990e8400-e29b-41d4-a716-446655440007', 'Price List', 'url', 'https://rodriguezcoffee.com/wholesale-pricing', 1, '2024-06-20 16:45:00+00'),
('aa0e8400-e29b-41d4-a716-446655440012', '990e8400-e29b-41d4-a716-446655440008', 'Place Order', 'tel', '+1-503-555-0199', 0, '2024-06-20 16:50:00+00'),
-- Emily Foster Photography buttons
('aa0e8400-e29b-41d4-a716-446655440013', '990e8400-e29b-41d4-a716-446655440009', 'View Gallery', 'url', 'https://emilyfosterphotography.com/gallery', 0, '2024-03-10 10:35:00+00'),
('aa0e8400-e29b-41d4-a716-446655440014', '990e8400-e29b-41d4-a716-446655440009', 'Book Session', 'mailto', 'hello@emilyfosterphotography.com', 1, '2024-03-10 10:40:00+00'),
('aa0e8400-e29b-41d4-a716-446655440015', '990e8400-e29b-41d4-a716-446655440010', 'Instagram', 'url', 'https://instagram.com/emilyfosterphoto', 0, '2024-03-10 10:45:00+00');

-- Add some realistic scan data
INSERT INTO microsite_scans (microsite_id, user_agent, ip_address, scanned_at) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)', '192.168.1.100', '2025-01-30 15:22:00+00'),
('770e8400-e29b-41d4-a716-446655440002', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '10.0.0.50', '2025-01-31 09:45:00+00'),
('770e8400-e29b-41d4-a716-446655440003', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', '172.16.0.25', '2025-01-31 07:18:00+00');