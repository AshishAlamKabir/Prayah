#!/usr/bin/env node

import fs from 'fs';

// Read the extracted fee data
const feeData = JSON.parse(fs.readFileSync('fee_structure_raw.json', 'utf8'));

// Razorpay charges calculation
const RAZORPAY_PERCENTAGE = 2.36; // 2% + 18% GST on 2% = 2.36%
const RAZORPAY_FIXED_CHARGE = 0; // No fixed charge for most transactions

function parseInstallmentFee(feeString) {
  if (typeof feeString === 'number') return { amount: feeString, installments: 1 };
  if (typeof feeString === 'string' && feeString.includes('x')) {
    const parts = feeString.split('x');
    const amount = parseFloat(parts[0].trim());
    const installments = parseInt(parts[1].replace('Installment', '').trim());
    return { amount, installments };
  }
  return { amount: 0, installments: 1 };
}

function calculateRazorpayCharges(amount) {
  const razorpayCharge = (amount * RAZORPAY_PERCENTAGE) / 100;
  const totalAmount = amount + razorpayCharge + RAZORPAY_FIXED_CHARGE;
  return {
    originalAmount: amount,
    razorpayCharge: Math.ceil(razorpayCharge), // Round up to avoid loss
    fixedCharge: RAZORPAY_FIXED_CHARGE,
    totalAmount: Math.ceil(totalAmount),
    schoolReceives: amount // School gets the exact amount from Excel
  };
}

console.log('🏫 Bokaghat Jatiya Vidyalaya Fee Structure Implementation\n');
console.log('📊 Processing fee data with Razorpay charges...\n');

// Process all fee data
const processedFees = [];

feeData.Sheet1.data.forEach(row => {
  const className = row.Class;
  
  // Process renewal fees (yearly admission fees)
  if (row['Renewal 25-26']) {
    const renewalInfo = parseInstallmentFee(row['Renewal 25-26']);
    if (renewalInfo.amount > 0) {
      const charges = calculateRazorpayCharges(renewalInfo.amount);
      processedFees.push({
        class: className,
        feeType: 'renewal',
        originalAmount: renewalInfo.amount,
        installments: renewalInfo.installments,
        ...charges
      });
    }
  }
  
  // Process monthly fees
  if (row['Monthly 25-26'] && typeof row['Monthly 25-26'] === 'number') {
    const charges = calculateRazorpayCharges(row['Monthly 25-26']);
    processedFees.push({
      class: className,
      feeType: 'monthly',
      originalAmount: row['Monthly 25-26'],
      installments: 1,
      ...charges
    });
  }
});

// Display processed data
console.log('📋 Processed Fee Structure:');
console.log('============================');

processedFees.forEach(fee => {
  console.log(`\nClass: ${fee.class}`);
  console.log(`Fee Type: ${fee.feeType.toUpperCase()}`);
  console.log(`School Amount: ₹${fee.schoolReceives}`);
  console.log(`Razorpay Charge: ₹${fee.razorpayCharge}`);
  console.log(`Student Pays: ₹${fee.totalAmount}`);
  if (fee.installments > 1) {
    console.log(`Installments: ${fee.installments}`);
    console.log(`Per Installment: ₹${Math.ceil(fee.totalAmount / fee.installments)}`);
  }
});

// Generate SQL for database
const sql = `-- Bokaghat Jatiya Vidyalaya Fee Structure (2025-26)
-- Generated with Razorpay charge calculations

-- Insert fee structures for Bokaghat Jatiya Vidyalaya (assuming school_id = 1)
INSERT INTO fee_structures (school_id, class_name, fee_type, school_amount, razorpay_charge_percent, razorpay_fixed_charge, student_pays_amount, installments, academic_year) VALUES
${processedFees.map(fee => 
  `(1, '${fee.class}', '${fee.feeType}', ${fee.schoolReceives}, ${RAZORPAY_PERCENTAGE}, ${RAZORPAY_FIXED_CHARGE}, ${fee.totalAmount}, ${fee.installments}, '2025-26')`
).join(',\n')};

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
`;

fs.writeFileSync('bokaghat_fee_structure.sql', sql);
console.log('\n✅ SQL script generated: bokaghat_fee_structure.sql');

// Generate JSON for frontend
const frontendData = {
  schoolName: "Bokaghat Jatiya Vidyalaya",
  academicYear: "2025-26",
  razorpayChargePercent: RAZORPAY_PERCENTAGE,
  feeStructure: processedFees.reduce((acc, fee) => {
    if (!acc[fee.class]) acc[fee.class] = {};
    acc[fee.class][fee.feeType] = {
      schoolAmount: fee.schoolReceives,
      razorpayCharge: fee.razorpayCharge,
      studentPays: fee.totalAmount,
      installments: fee.installments
    };
    return acc;
  }, {})
};

fs.writeFileSync('bokaghat_fee_structure.json', JSON.stringify(frontendData, null, 2));
console.log('✅ Frontend data generated: bokaghat_fee_structure.json');

// Calculate summary statistics
const totalClasses = new Set(processedFees.map(f => f.class)).size;
const avgMonthlyFee = processedFees.filter(f => f.feeType === 'monthly').reduce((sum, f) => sum + f.totalAmount, 0) / processedFees.filter(f => f.feeType === 'monthly').length;
const avgRenewalFee = processedFees.filter(f => f.feeType === 'renewal').reduce((sum, f) => sum + f.totalAmount, 0) / processedFees.filter(f => f.feeType === 'renewal').length;

console.log('\n📊 Summary Statistics:');
console.log('======================');
console.log(`Total Classes: ${totalClasses}`);
console.log(`Average Monthly Fee (Student Pays): ₹${Math.round(avgMonthlyFee)}`);
console.log(`Average Renewal Fee (Student Pays): ₹${Math.round(avgRenewalFee)}`);
console.log(`Razorpay Charge Rate: ${RAZORPAY_PERCENTAGE}%`);

console.log('\n🚀 Ready to implement in the application!');