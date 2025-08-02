-- Insert sample microsite cards for each demo microsite
WITH card_data AS (
  SELECT 
    m.id as microsite_id,
    m.name,
    generate_series(1, 3) as card_number
  FROM microsites m
  WHERE m.name IN (
    'Mario''s Italian Bistro', 
    'Alex Thompson Design Portfolio', 
    'The Gentlemen''s Barbershop', 
    'Ocean Conservation Society', 
    'TechCon 2024 - AI Summit', 
    'EcoBlend Coffee Roasters', 
    'Sarah Mitchell - Lifestyle Blog', 
    'Metropolitan Real Estate - Lisa Park'
  )
)
INSERT INTO public.microsite_cards (microsite_id, title, content, sort_order)
SELECT 
  microsite_id,
  CASE 
    -- Mario's Italian Bistro cards
    WHEN name = 'Mario''s Italian Bistro' AND card_number = 1 THEN 'Welcome to Mario''s'
    WHEN name = 'Mario''s Italian Bistro' AND card_number = 2 THEN 'Our Menu'
    WHEN name = 'Mario''s Italian Bistro' AND card_number = 3 THEN 'Visit Us'
    
    -- Alex Thompson Design cards
    WHEN name = 'Alex Thompson Design Portfolio' AND card_number = 1 THEN 'Creative Designer & Art Director'
    WHEN name = 'Alex Thompson Design Portfolio' AND card_number = 2 THEN 'Featured Projects'
    WHEN name = 'Alex Thompson Design Portfolio' AND card_number = 3 THEN 'Let''s Collaborate'
    
    -- Gentlemen's Barbershop cards
    WHEN name = 'The Gentlemen''s Barbershop' AND card_number = 1 THEN 'Classic Cuts & Modern Style'
    WHEN name = 'The Gentlemen''s Barbershop' AND card_number = 2 THEN 'Services & Pricing'
    WHEN name = 'The Gentlemen''s Barbershop' AND card_number = 3 THEN 'Book Your Appointment'
    
    -- Ocean Conservation cards
    WHEN name = 'Ocean Conservation Society' AND card_number = 1 THEN 'Protecting Our Oceans'
    WHEN name = 'Ocean Conservation Society' AND card_number = 2 THEN 'Get Involved'
    WHEN name = 'Ocean Conservation Society' AND card_number = 3 THEN 'Support Our Mission'
    
    -- TechCon cards
    WHEN name = 'TechCon 2024 - AI Summit' AND card_number = 1 THEN 'AI Summit 2024'
    WHEN name = 'TechCon 2024 - AI Summit' AND card_number = 2 THEN 'Event Details'
    WHEN name = 'TechCon 2024 - AI Summit' AND card_number = 3 THEN 'Register Now'
    
    -- EcoBlend Coffee cards
    WHEN name = 'EcoBlend Coffee Roasters' AND card_number = 1 THEN 'Sustainable Coffee Roasters'
    WHEN name = 'EcoBlend Coffee Roasters' AND card_number = 2 THEN 'Our Coffee Selection'
    WHEN name = 'EcoBlend Coffee Roasters' AND card_number = 3 THEN 'Visit Our Cafe'
    
    -- Sarah Mitchell cards
    WHEN name = 'Sarah Mitchell - Lifestyle Blog' AND card_number = 1 THEN 'Lifestyle & Wellness'
    WHEN name = 'Sarah Mitchell - Lifestyle Blog' AND card_number = 2 THEN 'Latest Content'
    WHEN name = 'Sarah Mitchell - Lifestyle Blog' AND card_number = 3 THEN 'Connect With Me'
    
    -- Lisa Park Real Estate cards
    WHEN name = 'Metropolitan Real Estate - Lisa Park' AND card_number = 1 THEN 'Your Metro Real Estate Expert'
    WHEN name = 'Metropolitan Real Estate - Lisa Park' AND card_number = 2 THEN 'Current Listings'
    WHEN name = 'Metropolitan Real Estate - Lisa Park' AND card_number = 3 THEN 'Ready to Start?'
  END as title,
  
  CASE 
    -- Mario's Italian Bistro content
    WHEN name = 'Mario''s Italian Bistro' AND card_number = 1 THEN 'Experience authentic Italian cuisine in the heart of downtown. Family recipes passed down through generations, using only the finest imported ingredients.'
    WHEN name = 'Mario''s Italian Bistro' AND card_number = 2 THEN 'Handmade pasta, wood-fired pizzas, fresh seafood, and traditional desserts. View our full menu and daily specials.'
    WHEN name = 'Mario''s Italian Bistro' AND card_number = 3 THEN 'Located at 123 Main Street, Downtown. Open Tuesday-Sunday, 5PM-10PM. Reservations recommended.'
    
    -- Alex Thompson Design content
    WHEN name = 'Alex Thompson Design Portfolio' AND card_number = 1 THEN 'Specializing in brand identity, digital experiences, and visual storytelling. 8+ years creating impactful designs for startups and Fortune 500 companies.'
    WHEN name = 'Alex Thompson Design Portfolio' AND card_number = 2 THEN 'From startup logos to complete brand systems, explore my latest work in branding, web design, and packaging.'
    WHEN name = 'Alex Thompson Design Portfolio' AND card_number = 3 THEN 'Available for freelance projects and full-time opportunities. Let''s create something amazing together.'
    
    -- Gentlemen's Barbershop content
    WHEN name = 'The Gentlemen''s Barbershop' AND card_number = 1 THEN 'Traditional barbering with a contemporary twist. Expert cuts, hot towel shaves, and beard grooming in a refined atmosphere.'
    WHEN name = 'The Gentlemen''s Barbershop' AND card_number = 2 THEN 'Haircuts, beard trims, hot towel shaves, and grooming packages. Premium products and skilled craftsmen.'
    WHEN name = 'The Gentlemen''s Barbershop' AND card_number = 3 THEN 'Walk-ins welcome, but appointments preferred. Open Monday-Saturday, 9AM-7PM.'
    
    -- Ocean Conservation content
    WHEN name = 'Ocean Conservation Society' AND card_number = 1 THEN 'Join our mission to preserve marine ecosystems through research, education, and direct action. Every action counts in saving our blue planet.'
    WHEN name = 'Ocean Conservation Society' AND card_number = 2 THEN 'Volunteer opportunities, beach cleanups, educational programs, and donation drives. Make a difference in your community.'
    WHEN name = 'Ocean Conservation Society' AND card_number = 3 THEN 'Your donation helps fund research expeditions, educational programs, and conservation efforts worldwide.'
    
    -- TechCon content
    WHEN name = 'TechCon 2024 - AI Summit' AND card_number = 1 THEN 'Join industry leaders, researchers, and innovators for three days of cutting-edge AI discussions, workshops, and networking.'
    WHEN name = 'TechCon 2024 - AI Summit' AND card_number = 2 THEN 'March 15-17, 2024 at the Convention Center. 50+ speakers, 30+ sessions, hands-on workshops, and expo hall.'
    WHEN name = 'TechCon 2024 - AI Summit' AND card_number = 3 THEN 'Early bird pricing available until February 15th. Student discounts and group rates available.'
    
    -- EcoBlend Coffee content
    WHEN name = 'EcoBlend Coffee Roasters' AND card_number = 1 THEN 'Ethically sourced, expertly roasted coffee beans. Supporting fair trade practices and environmental sustainability with every cup.'
    WHEN name = 'EcoBlend Coffee Roasters' AND card_number = 2 THEN 'Single-origin beans, signature blends, and seasonal roasts. From light citrusy notes to rich, bold flavors.'
    WHEN name = 'EcoBlend Coffee Roasters' AND card_number = 3 THEN 'Visit our flagship cafe in the Arts District. Cozy atmosphere, free WiFi, and live music on weekends.'
    
    -- Sarah Mitchell content
    WHEN name = 'Sarah Mitchell - Lifestyle Blog' AND card_number = 1 THEN 'Sharing authentic moments, wellness tips, and style inspiration. Join me on a journey to living beautifully and intentionally.'
    WHEN name = 'Sarah Mitchell - Lifestyle Blog' AND card_number = 2 THEN 'Weekly blog posts, Instagram stories, and YouTube videos covering fashion, wellness, travel, and home decor.'
    WHEN name = 'Sarah Mitchell - Lifestyle Blog' AND card_number = 3 THEN 'Follow along on social media and join our community of like-minded individuals pursuing their best lives.'
    
    -- Lisa Park Real Estate content
    WHEN name = 'Metropolitan Real Estate - Lisa Park' AND card_number = 1 THEN 'Helping families find their perfect home in the metropolitan area. 12 years of experience with personalized service and market expertise.'
    WHEN name = 'Metropolitan Real Estate - Lisa Park' AND card_number = 2 THEN 'Explore available properties from luxury condos to family homes. Updated daily with virtual tours and detailed information.'
    WHEN name = 'Metropolitan Real Estate - Lisa Park' AND card_number = 3 THEN 'Whether buying or selling, I''m here to guide you through every step. Free market analysis and consultation available.'
  END as content,
  
  card_number - 1 as sort_order
FROM card_data;