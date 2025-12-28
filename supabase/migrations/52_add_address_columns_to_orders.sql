-- Add address-related columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_state TEXT,
ADD COLUMN IF NOT EXISTS customer_pincode TEXT,
ADD COLUMN IF NOT EXISTS customer_landmark1 TEXT,
ADD COLUMN IF NOT EXISTS customer_landmark2 TEXT,
ADD COLUMN IF NOT EXISTS customer_landmark3 TEXT;