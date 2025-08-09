#!/usr/bin/env node
/**
 * Script to process Ankur student data from Excel file and add to MJV database
 */

import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function processAnkurExcel() {
  try {
    const excelFile = path.join(__dirname, '..', 'attached_assets', 'Ankur_1754753443064.xlsx');
    
    console.log(`Processing Excel file: ${excelFile}`);
    
    if (!fs.existsSync(excelFile)) {
      console.error('Excel file not found:', excelFile);
      return null;
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(excelFile);
    
    const worksheet = workbook.worksheets[0]; // First worksheet
    console.log(`Found worksheet: ${worksheet.name}`);
    console.log(`Rows: ${worksheet.rowCount}, Columns: ${worksheet.columnCount}`);
    
    // Get headers from first row
    const headers = [];
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell, colNumber) => {
      headers[colNumber] = cell.value?.toString().trim() || `Column${colNumber}`;
    });
    
    console.log('Headers found:', headers.filter(h => h));
    
    const students = [];
    
    // Process data rows (starting from row 2)
    for (let rowNum = 2; rowNum <= worksheet.rowCount; rowNum++) {
      const row = worksheet.getRow(rowNum);
      
      // Skip empty rows
      if (row.hasValues) {
        const rowData = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber];
          if (header) {
            rowData[header] = cell.value?.toString().trim() || '';
          }
        });
        
        // Map to our student schema
        const student = {
          fullName: extractValue(rowData, ['Name', 'নাম', 'Student Name', 'Student', 'নামঃ']),
          fatherName: extractValue(rowData, ['Father Name', 'বাপেকৰ নাম', "Father's Name", 'Father']),
          motherName: extractValue(rowData, ['Mother Name', 'মাকৰ নাম', "Mother's Name", 'Mother']),
          className: 'Ankur',
          stream: '',
          rollNumber: extractValue(rowData, ['Roll No', 'Roll Number', 'ৰোল নং', 'Roll']) || `${rowNum - 1}`,
          admissionNumber: extractValue(rowData, ['Admission No', 'ভৰ্তি নং', 'Admission']) || `ANK${String(rowNum - 1).padStart(3, '0')}`,
          dateOfBirth: extractValue(rowData, ['Date of Birth', 'জন্ম তাৰিখ', 'DOB', 'Birth Date']) || '2020-01-01',
          gender: normalizeGender(extractValue(rowData, ['Gender', 'লিংগ', 'Sex'])),
          category: extractValue(rowData, ['Category', 'শ্ৰেণী', 'Caste']) || 'General',
          religion: extractValue(rowData, ['Religion', 'ধৰ্ম']) || 'Hindu',
          address: extractValue(rowData, ['Address', 'ঠিকনা', 'Village']) || 'Mahuramukh',
          phoneNumber: extractValue(rowData, ['Phone', 'ফোন', 'Contact', 'Mobile']),
          admissionDate: '2025-04-01',
          academicYear: '2025-26',
          status: 'active',
          bloodGroup: extractValue(rowData, ['Blood Group', 'তেজৰ গ্ৰুপ']),
          emergencyContact: extractValue(rowData, ['Emergency Contact', 'জৰুৰীকালীন যোগাযোগ']),
          schoolId: 3 // MJV school ID
        };
        
        // Validate required fields
        if (student.fullName && student.fullName.trim()) {
          students.push(student);
          console.log(`✓ Processed: ${student.fullName} (Roll: ${student.rollNumber})`);
        } else {
          console.log(`⚠ Skipping row ${rowNum} - missing name`);
        }
      }
    }
    
    console.log(`\nProcessed ${students.length} valid students`);
    return students;
    
  } catch (error) {
    console.error('Error processing Excel file:', error);
    return null;
  }
}

function extractValue(rowData, possibleKeys) {
  for (const key of possibleKeys) {
    const exactMatch = rowData[key];
    if (exactMatch && exactMatch.trim()) {
      return exactMatch.trim();
    }
    
    // Try partial match
    const partialMatch = Object.keys(rowData).find(k => 
      k.toLowerCase().includes(key.toLowerCase()) || 
      key.toLowerCase().includes(k.toLowerCase())
    );
    
    if (partialMatch && rowData[partialMatch] && rowData[partialMatch].trim()) {
      return rowData[partialMatch].trim();
    }
  }
  return '';
}

function normalizeGender(gender) {
  if (!gender) return 'Male';
  const g = gender.toLowerCase();
  if (g.includes('f') || g.includes('ম') || g.includes('girl')) return 'Female';
  return 'Male';
}

async function addStudentsToDatabase(students) {
  console.log(`\nAttempting to add ${students.length} students to database...`);
  
  const { default: fetch } = await import('node-fetch');
  const baseUrl = 'http://localhost:5000';
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const student of students) {
    try {
      const response = await fetch(`${baseUrl}/api/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(student)
      });
      
      if (response.ok) {
        console.log(`✓ Added: ${student.fullName}`);
        successCount++;
      } else {
        const errorText = await response.text();
        console.log(`✗ Failed to add ${student.fullName}: ${errorText}`);
        errorCount++;
      }
    } catch (error) {
      console.log(`✗ Error adding ${student.fullName}: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log(`\nImport Summary:`);
  console.log(`✓ Successfully added: ${successCount}`);
  console.log(`✗ Failed: ${errorCount}`);
}

async function main() {
  console.log('Ankur Student Data Processor');
  console.log('=' .repeat(40));
  
  const students = await processAnkurExcel();
  
  if (students && students.length > 0) {
    // Save to JSON for backup
    const backupFile = path.join(__dirname, 'ankur_students_backup.json');
    fs.writeFileSync(backupFile, JSON.stringify(students, null, 2), 'utf8');
    console.log(`\nBackup saved to: ${backupFile}`);
    
    // Add to database
    await addStudentsToDatabase(students);
    console.log('\nStudent import process completed!');
  } else {
    console.log('No valid student data found');
  }
}

main().catch(console.error);