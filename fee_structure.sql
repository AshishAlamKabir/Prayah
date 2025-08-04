-- Fee Structure for Bokaghat Jatiya Vidyalaya (2025-26)
-- Generated from Excel file

-- Create fee_structures table if not exists
CREATE TABLE IF NOT EXISTS fee_structures (
  id SERIAL PRIMARY KEY,
  school_id INTEGER REFERENCES schools(id),
  class_name VARCHAR(50) NOT NULL,
  fee_type VARCHAR(50) NOT NULL, -- 'monthly', 'yearly', 'admission', 'renewal'
  amount DECIMAL(10,2) NOT NULL,
  razorpay_charge_percent DECIMAL(5,4) DEFAULT 2.36, -- Razorpay standard rate + GST
  razorpay_fixed_charge DECIMAL(10,2) DEFAULT 0.00,
  total_amount_with_charges DECIMAL(10,2) GENERATED ALWAYS AS (
    amount + (amount * razorpay_charge_percent / 100) + razorpay_fixed_charge
  ) STORED,
  academic_year VARCHAR(20) DEFAULT '2025-26',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fee_structures_school_class ON fee_structures(school_id, class_name);
CREATE INDEX IF NOT EXISTS idx_fee_structures_type ON fee_structures(fee_type);


-- Data from sheet: Sheet1
