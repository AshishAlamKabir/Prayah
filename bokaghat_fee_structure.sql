-- Bokaghat Jatiya Vidyalaya Fee Structure (2025-26)
-- Generated with Razorpay charge calculations

-- Insert fee structures for Bokaghat Jatiya Vidyalaya (assuming school_id = 1)
INSERT INTO fee_structures (school_id, class_name, fee_type, school_amount, razorpay_charge_percent, razorpay_fixed_charge, student_pays_amount, installments, academic_year) VALUES
(1, 'Ankur', 'renewal', 3500, 2.36, 0, 3583, 1, '2025-26'),
(1, 'Ankur', 'monthly', 450, 2.36, 0, 461, 1, '2025-26'),
(1, 'Kunhi', 'renewal', 3400, 2.36, 0, 3481, 1, '2025-26'),
(1, 'Kunhi', 'monthly', 450, 2.36, 0, 461, 1, '2025-26'),
(1, 'Sopan', 'renewal', 3400, 2.36, 0, 3481, 1, '2025-26'),
(1, 'Sopan', 'monthly', 450, 2.36, 0, 461, 1, '2025-26'),
(1, 'I', 'renewal', 3900, 2.36, 0, 3993, 1, '2025-26'),
(1, 'I', 'monthly', 450, 2.36, 0, 461, 1, '2025-26'),
(1, 'II', 'renewal', 4300, 2.36, 0, 4402, 1, '2025-26'),
(1, 'II', 'monthly', 470, 2.36, 0, 482, 1, '2025-26'),
(1, 'III', 'renewal', 4300, 2.36, 0, 4402, 1, '2025-26'),
(1, 'III', 'monthly', 500, 2.36, 0, 512, 1, '2025-26'),
(1, 'IV', 'renewal', 4300, 2.36, 0, 4402, 1, '2025-26'),
(1, 'IV', 'monthly', 520, 2.36, 0, 533, 1, '2025-26'),
(1, 'V', 'renewal', 4300, 2.36, 0, 4402, 1, '2025-26'),
(1, 'V', 'monthly', 550, 2.36, 0, 563, 1, '2025-26'),
(1, 'VI', 'renewal', 4400, 2.36, 0, 4504, 1, '2025-26'),
(1, 'VI', 'monthly', 560, 2.36, 0, 574, 1, '2025-26'),
(1, 'VII', 'renewal', 4400, 2.36, 0, 4504, 1, '2025-26'),
(1, 'VII', 'monthly', 580, 2.36, 0, 594, 1, '2025-26'),
(1, 'VIII', 'renewal', 4400, 2.36, 0, 4504, 1, '2025-26'),
(1, 'VIII', 'monthly', 640, 2.36, 0, 656, 1, '2025-26'),
(1, 'IX', 'renewal', 4900, 2.36, 0, 5016, 1, '2025-26'),
(1, 'IX', 'monthly', 750, 2.36, 0, 768, 1, '2025-26'),
(1, 'X', 'renewal', 4900, 2.36, 0, 5016, 1, '2025-26'),
(1, 'X', 'monthly', 800, 2.36, 0, 819, 1, '2025-26'),
(1, 'XI - ARTS', 'renewal', 4600, 2.36, 0, 4709, 3, '2025-26'),
(1, 'XI - COM', 'renewal', 5000, 2.36, 0, 5118, 3, '2025-26'),
(1, 'XI - SCI', 'renewal', 5400, 2.36, 0, 5528, 3, '2025-26'),
(1, 'XII - ARTS', 'renewal', 4600, 2.36, 0, 4709, 3, '2025-26'),
(1, 'XII - COM', 'renewal', 5000, 2.36, 0, 5118, 3, '2025-26'),
(1, 'XII - SCI', 'renewal', 5400, 2.36, 0, 5528, 3, '2025-26');

-- Create view for easy fee lookup
CREATE OR REPLACE VIEW bokaghat_fees_view AS
SELECT 
  fs.*,
  s.name as school_name,
  CASE 
    WHEN fs.fee_type = 'monthly' THEN 'Monthly Fee'
    WHEN fs.fee_type = 'renewal' THEN 'Yearly Admission Fee'
    ELSE fs.fee_type
  END as fee_description
FROM fee_structures fs
JOIN schools s ON fs.school_id = s.id
WHERE s.name LIKE '%Bokaghat%' OR s.name LIKE '%বকাঘাট%'
ORDER BY fs.class_name, fs.fee_type;
