-- Add sample buttons to selected cards for demonstration
WITH card_buttons AS (
  SELECT 
    mc.id as card_id,
    m.name as microsite_name,
    mc.title as card_title,
    mc.sort_order as card_order
  FROM microsite_cards mc
  JOIN microsites m ON m.id = mc.microsite_id
  WHERE m.name IN (
    'Mario''s Italian Bistro', 
    'Alex Thompson Design Portfolio', 
    'The Gentlemen''s Barbershop', 
    'Ocean Conservation Society', 
    'TechCon 2024 - AI Summit'
  )
)
INSERT INTO public.microsite_buttons (card_id, label, action_type, action_value, sort_order)
SELECT 
  card_id,
  CASE 
    -- Mario's Italian Bistro buttons
    WHEN microsite_name = 'Mario''s Italian Bistro' AND card_title = 'Our Menu' THEN 'View Full Menu'
    WHEN microsite_name = 'Mario''s Italian Bistro' AND card_title = 'Visit Us' THEN 'Make Reservation'
    
    -- Alex Thompson Design buttons
    WHEN microsite_name = 'Alex Thompson Design Portfolio' AND card_title = 'Creative Designer & Art Director' THEN 'Download Resume'
    WHEN microsite_name = 'Alex Thompson Design Portfolio' AND card_title = 'Featured Projects' THEN 'View Portfolio'
    WHEN microsite_name = 'Alex Thompson Design Portfolio' AND card_title = 'Let''s Collaborate' THEN 'Email Me'
    
    -- Gentlemen's Barbershop buttons  
    WHEN microsite_name = 'The Gentlemen''s Barbershop' AND card_title = 'Services & Pricing' THEN 'View Services'
    WHEN microsite_name = 'The Gentlemen''s Barbershop' AND card_title = 'Book Your Appointment' THEN 'Book Online'
    
    -- Ocean Conservation buttons
    WHEN microsite_name = 'Ocean Conservation Society' AND card_title = 'Get Involved' THEN 'Find Events'
    WHEN microsite_name = 'Ocean Conservation Society' AND card_title = 'Support Our Mission' THEN 'Donate Now'
    
    -- TechCon buttons
    WHEN microsite_name = 'TechCon 2024 - AI Summit' AND card_title = 'Event Details' THEN 'Full Schedule'
    WHEN microsite_name = 'TechCon 2024 - AI Summit' AND card_title = 'Register Now' THEN 'Register'
  END as label,
  
  CASE 
    -- Mario's Italian Bistro button types
    WHEN microsite_name = 'Mario''s Italian Bistro' AND card_title = 'Our Menu' THEN 'link'
    WHEN microsite_name = 'Mario''s Italian Bistro' AND card_title = 'Visit Us' THEN 'phone'
    
    -- Alex Thompson Design button types
    WHEN microsite_name = 'Alex Thompson Design Portfolio' AND card_title = 'Creative Designer & Art Director' THEN 'link'
    WHEN microsite_name = 'Alex Thompson Design Portfolio' AND card_title = 'Featured Projects' THEN 'link'
    WHEN microsite_name = 'Alex Thompson Design Portfolio' AND card_title = 'Let''s Collaborate' THEN 'email'
    
    -- Gentlemen's Barbershop button types
    WHEN microsite_name = 'The Gentlemen''s Barbershop' AND card_title = 'Services & Pricing' THEN 'link'
    WHEN microsite_name = 'The Gentlemen''s Barbershop' AND card_title = 'Book Your Appointment' THEN 'link'
    
    -- Ocean Conservation button types
    WHEN microsite_name = 'Ocean Conservation Society' AND card_title = 'Get Involved' THEN 'link'
    WHEN microsite_name = 'Ocean Conservation Society' AND card_title = 'Support Our Mission' THEN 'link'
    
    -- TechCon button types
    WHEN microsite_name = 'TechCon 2024 - AI Summit' AND card_title = 'Event Details' THEN 'link'
    WHEN microsite_name = 'TechCon 2024 - AI Summit' AND card_title = 'Register Now' THEN 'link'
  END as action_type,
  
  CASE 
    -- Mario's Italian Bistro button values
    WHEN microsite_name = 'Mario''s Italian Bistro' AND card_title = 'Our Menu' THEN 'https://marios-bistro.com/menu'
    WHEN microsite_name = 'Mario''s Italian Bistro' AND card_title = 'Visit Us' THEN '+1-555-0123'
    
    -- Alex Thompson Design button values
    WHEN microsite_name = 'Alex Thompson Design Portfolio' AND card_title = 'Creative Designer & Art Director' THEN 'https://alexthompson.design/resume.pdf'
    WHEN microsite_name = 'Alex Thompson Design Portfolio' AND card_title = 'Featured Projects' THEN 'https://alexthompson.design/portfolio'
    WHEN microsite_name = 'Alex Thompson Design Portfolio' AND card_title = 'Let''s Collaborate' THEN 'alex@alexthompson.design'
    
    -- Gentlemen's Barbershop button values
    WHEN microsite_name = 'The Gentlemen''s Barbershop' AND card_title = 'Services & Pricing' THEN 'https://gentlemensbarbershop.com/services'
    WHEN microsite_name = 'The Gentlemen''s Barbershop' AND card_title = 'Book Your Appointment' THEN 'https://gentlemensbarbershop.com/booking'
    
    -- Ocean Conservation button values
    WHEN microsite_name = 'Ocean Conservation Society' AND card_title = 'Get Involved' THEN 'https://oceanconservation.org/events'
    WHEN microsite_name = 'Ocean Conservation Society' AND card_title = 'Support Our Mission' THEN 'https://oceanconservation.org/donate'
    
    -- TechCon button values
    WHEN microsite_name = 'TechCon 2024 - AI Summit' AND card_title = 'Event Details' THEN 'https://techcon2024.com/schedule'
    WHEN microsite_name = 'TechCon 2024 - AI Summit' AND card_title = 'Register Now' THEN 'https://techcon2024.com/register'
  END as action_value,
  
  0 as sort_order
FROM card_buttons
WHERE 
  (microsite_name = 'Mario''s Italian Bistro' AND card_title IN ('Our Menu', 'Visit Us'))
  OR (microsite_name = 'Alex Thompson Design Portfolio' AND card_title IN ('Creative Designer & Art Director', 'Featured Projects', 'Let''s Collaborate'))
  OR (microsite_name = 'The Gentlemen''s Barbershop' AND card_title IN ('Services & Pricing', 'Book Your Appointment'))
  OR (microsite_name = 'Ocean Conservation Society' AND card_title IN ('Get Involved', 'Support Our Mission'))
  OR (microsite_name = 'TechCon 2024 - AI Summit' AND card_title IN ('Event Details', 'Register Now'));