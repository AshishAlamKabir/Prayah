#!/usr/bin/env node

import XLSX from 'xlsx';
import fs from 'fs';

const EXCEL_FILE_PATH = 'attached_assets/Fees_Structure_2025_26_1754291011027.xlsx';

function readFeeStructure() {
  try {
    // Check if file exists
    if (!fs.existsSync(EXCEL_FILE_PATH)) {
      console.error('Excel file not found:', EXCEL_FILE_PATH);
      return null;
    }

    console.log('📊 Reading Fee Structure for Bokaghat Jatiya Vidyalaya...\n');

    // Read the workbook
    const workbook = XLSX.readFile(EXCEL_FILE_PATH);
    
    // Get sheet names
    const sheetNames = workbook.SheetNames;
    console.log('Available sheets:', sheetNames);

    // Process each sheet
    const feeData = {};
    
    sheetNames.forEach(sheetName => {
      console.log(`\n📋 Processing sheet: ${sheetName}`);
      
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON with header row
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1, // Use first row as header
        defval: '' // Default value for empty cells
      });
      
      console.log(`Rows found: ${jsonData.length}`);
      
      // Process the data
      if (jsonData.length > 0) {
        const headers = jsonData[0];
        console.log('Headers:', headers);
        
        const rows = jsonData.slice(1).filter(row => 
          row.some(cell => cell !== '' && cell !== null && cell !== undefined)
        );
        
        console.log(`Data rows: ${rows.length}`);
        
        // Convert to objects
        const processedData = rows.map(row => {
          const obj = {};
          headers.forEach((header, index) => {
            if (header && header.toString().trim()) {
              obj[header.toString().trim()] = row[index] || '';
            }
          });
          return obj;
        });
        
        feeData[sheetName] = {
          headers,
          data: processedData
        };
        
        // Display sample data
        console.log('\nSample data:');
        processedData.slice(0, 3).forEach((row, index) => {
          console.log(`Row ${index + 1}:`, row);
        });
      }
    });

    return feeData;

  } catch (error) {
    console.error('Error reading Excel file:', error);
    return null;
  }
}

function generateFeeStructureSQL(feeData) {
  console.log('\n🏗️  Generating Fee Structure SQL...\n');
  
  let sql = `-- Fee Structure for Bokaghat Jatiya Vidyalaya (2025-26)
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

`;

  // Process fee data and generate INSERT statements
  Object.entries(feeData).forEach(([sheetName, sheetData]) => {
    sql += `\n-- Data from sheet: ${sheetName}\n`;
    
    sheetData.data.forEach(row => {
      // Try to identify class, fee type, and amount from the row
      const classNames = Object.keys(row).filter(key => 
        key.toLowerCase().includes('class') || 
        key.toLowerCase().includes('grade') ||
        key.toLowerCase().includes('std')
      );
      
      const amountFields = Object.keys(row).filter(key => 
        key.toLowerCase().includes('fee') || 
        key.toLowerCase().includes('amount') ||
        key.toLowerCase().includes('charge') ||
        !isNaN(parseFloat(row[key]))
      );
      
      console.log('Processing row:', row);
      console.log('Class fields found:', classNames);
      console.log('Amount fields found:', amountFields);
    });
  });

  return sql;
}

// Main execution
const feeData = readFeeStructure();

if (feeData) {
  console.log('\n✅ Fee structure data extracted successfully!');
  
  // Save raw data as JSON for inspection
  fs.writeFileSync('fee_structure_raw.json', JSON.stringify(feeData, null, 2));
  console.log('📄 Raw data saved to fee_structure_raw.json');
  
  // Generate SQL
  const sql = generateFeeStructureSQL(feeData);
  fs.writeFileSync('fee_structure.sql', sql);
  console.log('📄 SQL script saved to fee_structure.sql');
  
} else {
  console.log('❌ Failed to read fee structure data');
}