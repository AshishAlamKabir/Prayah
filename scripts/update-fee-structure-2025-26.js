import XLSX from 'xlsx';
import fs from 'fs';

// Read the new Excel file
const filePath = './attached_assets/Fees_Structure_2025_26_1754295214547.xlsx';

try {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  console.log('Processing new fee structure for 2025-26...\n');
  
  // Extract headers and data
  const headers = data[0]; // ['Class', 'Renewal 25-26', 'Monthly 25-26']
  const rows = data.slice(1).filter(row => row.length > 0 && row[0]); // Remove empty rows
  
  console.log('Headers:', headers);
  console.log('Processing', rows.length, 'classes\n');
  
  const feeStructures = [];
  const razorpayChargeRate = 0; // No charges
  const razorpayFixedCharge = 0; // No fixed charges
  
  // Function to calculate what student pays including Razorpay charges
  function calculateStudentAmount(schoolAmount) {
    // NO CHARGES - Student pays exactly what school receives
    return schoolAmount; // No additional charges
  }
  
  rows.forEach(row => {
    const className = row[0];
    const renewalAmount = row[1];
    const monthlyAmount = row[2];
    
    if (className && renewalAmount && monthlyAmount) {
      // Renewal fee structure
      const renewalStudentAmount = calculateStudentAmount(renewalAmount);
      feeStructures.push({
        schoolId: 1, // Bokaghat Jatiya Vidyalaya
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
        schoolId: 1, // Bokaghat Jatiya Vidyalaya
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
  
  console.log(`\nGenerated ${feeStructures.length} fee structures`);
  
  // Save the processed fee structures
  fs.writeFileSync('./new_bokaghat_fee_structure_2025_26.json', JSON.stringify(feeStructures, null, 2));
  
  // Generate SQL for updating the database
  const sqlStatements = [
    '-- Clear existing fee structures for 2025-26',
    "DELETE FROM fee_structures WHERE school_id = 1 AND academic_year = '2025-26';",
    '',
    '-- Insert new fee structures for 2025-26',
    ...feeStructures.map(fs => 
      `INSERT INTO fee_structures (school_id, class_name, fee_type, academic_year, school_amount, student_pays_amount, installments) VALUES (${fs.schoolId}, '${fs.className}', '${fs.feeType}', '${fs.academicYear}', '${fs.schoolAmount}', '${fs.studentPaysAmount}', ${fs.installments});`
    )
  ];
  
  fs.writeFileSync('./update_bokaghat_fee_structure_2025_26.sql', sqlStatements.join('\n'));
  
  console.log('\nFiles generated:');
  console.log('- new_bokaghat_fee_structure_2025_26.json (structured data)');
  console.log('- update_bokaghat_fee_structure_2025_26.sql (database update script)');
  
} catch (error) {
  console.error('Error processing Excel file:', error);
}