-- Add unique constraint to customers.email column
-- First, remove any potential duplicate emails (if any exist)
DELETE FROM customers 
WHERE id NOT IN (
    SELECT DISTINCT ON (email) id 
    FROM customers 
    ORDER BY email, created_at DESC
);

-- Add unique constraint to email column
ALTER TABLE customers 
ADD CONSTRAINT customers_email_unique UNIQUE (email);