import XLSX from 'xlsx';
import fs from 'fs';

// Read the MJV Excel file
const filePath = './attached_assets/Fees_Structure_2025_26_MJV_1754295683985.xlsx';

try {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  console.log('Processing Mahuramukh Jatiya Vidyalay fee structure for 2025-26...\n');
  
  // Extract headers and data
  const headers = data[0];
  const rows = data.slice(1).filter(row => row.length > 0 && row[0]);
  
  console.log('Headers:', headers);
  console.log('Processing', rows.length, 'classes\n');
  
  const feeStructures = [];
  const razorpayChargeRate = 0.0236; // 2.36%
  const razorpayFixedCharge = 2; // ₹2 per transaction
  
  // Function to calculate what student pays including Razorpay charges
  function calculateStudentAmount(schoolAmount) {
    const percentageCharge = schoolAmount * razorpayChargeRate;
    const totalCharge = percentageCharge + razorpayFixedCharge;
    const studentPaysAmount = schoolAmount + totalCharge;
    return Math.ceil(studentPaysAmount);
  }
  
  // Find MJV school ID
  console.log('Looking up Mahuramukh Jatiya Vidyalay school ID...');
  
  rows.forEach(row => {
    const className = row[0];
    const renewalAmount = row[1];
    const monthlyAmount = row[2];
    
    if (className && renewalAmount && monthlyAmount) {
      // Renewal fee structure
      const renewalStudentAmount = calculateStudentAmount(renewalAmount);
      feeStructures.push({
        schoolId: 3, // Mahuramukh Jatiya Vidyalay (need to verify this ID)
        className: className,
        feeType: 'renewal',
        academicYear: '2025-26',
        schoolAmount: renewalAmount.toString(),
        studentPaysAmount: renewalStudentAmount.toString(),
        installments: className === 'XI' || className === 'XII' ? 3 : 1
      });
      
      // Monthly fee structure
      const monthlyStudentAmount = calculateStudentAmount(monthlyAmount);
      feeStructures.push({
        schoolId: 3, // Mahuramukh Jatiya Vidyalay
        className: className,
        feeType: 'monthly',
        academicYear: '2025-26',
        schoolAmount: monthlyAmount.toString(),
        studentPaysAmount: monthlyStudentAmount.toString(),
        installments: 1
      });
      
      console.log(`${className}:`);
      console.log(`  Renewal: School ₹${renewalAmount} → Student ₹${renewalStudentAmount} (charge: ₹${renewalStudentAmount - renewalAmount})`);
      console.log(`  Monthly: School ₹${monthlyAmount} → Student ₹${monthlyStudentAmount} (charge: ₹${monthlyStudentAmount - monthlyAmount})`);
    }
  });
  
  console.log(`\nGenerated ${feeStructures.length} fee structures for MJV`);
  
  // Save the processed fee structures
  fs.writeFileSync('./mjv_fee_structure_2025_26.json', JSON.stringify(feeStructures, null, 2));
  
  // Generate SQL for updating the database
  const sqlStatements = [
    '-- Clear existing fee structures for MJV 2025-26',
    "DELETE FROM fee_structures WHERE school_id = 3 AND academic_year = '2025-26';",
    '',
    '-- Insert new fee structures for MJV 2025-26',
    ...feeStructures.map(fs => 
      `INSERT INTO fee_structures (school_id, class_name, fee_type, academic_year, school_amount, student_pays_amount, installments) VALUES (${fs.schoolId}, '${fs.className}', '${fs.feeType}', '${fs.academicYear}', '${fs.schoolAmount}', '${fs.studentPaysAmount}', ${fs.installments});`
    )
  ];
  
  fs.writeFileSync('./update_mjv_fee_structure_2025_26.sql', sqlStatements.join('\n'));
  
  console.log('\nFiles generated:');
  console.log('- mjv_fee_structure_2025_26.json (structured data)');
  console.log('- update_mjv_fee_structure_2025_26.sql (database update script)');
  
} catch (error) {
  console.error('Error processing MJV Excel file:', error);
}