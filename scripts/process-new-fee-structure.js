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
  
  console.log('Excel file structure:');
  console.log('Total rows:', data.length);
  console.log('\nFirst 10 rows:');
  data.slice(0, 10).forEach((row, index) => {
    console.log(`Row ${index}:`, row);
  });
  
  // Save raw data for analysis
  fs.writeFileSync('./new_fee_structure_raw.json', JSON.stringify(data, null, 2));
  console.log('\nRaw data saved to new_fee_structure_raw.json');
  
} catch (error) {
  console.error('Error processing Excel file:', error);
}