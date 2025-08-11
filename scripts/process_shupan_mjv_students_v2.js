import ExcelJS from 'exceljs';
import { db } from '../server/db.js';
import { students } from '../shared/schema.js';
import { eq, and } from 'drizzle-orm';

async function processShupanStudentsV2() {
  console.log('Processing Shupan class students (v2) for MJV...');

  try {
    console.log('Reading Excel data...');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('attached_assets/Shupan_1754912901762.xlsx');
    
    const worksheet = workbook.worksheets[0]; // First worksheet
    const studentData = [];
    
    // Read student data from Excel
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row
      
      const values = row.values;
      if (!values || values.length < 2) return; // Skip empty rows
      
      // Extract student information
      const studentInfo = {
        rollNumber: String(values[1] || '').trim(),
        name: String(values[2] || '').trim(),
        fatherName: String(values[3] || '').trim(),
        motherName: String(values[4] || '').trim(),
        dob: values[5] || null,
        gender: String(values[6] || '').toLowerCase().trim(),
        address: String(values[7] || '').trim(),
        phoneNumber: String(values[8] || '').trim(),
        className: 'Shupan', // Set class as Shupan
        section: 'A', // Default section
        schoolId: 3 // MJV school ID
      };
      
      // Only add if we have at least name and roll number
      if (studentInfo.name && studentInfo.rollNumber) {
        studentData.push(studentInfo);
      }
    });
    
    console.log(`Found ${studentData.length} students to process`);
    
    let addedCount = 0;
    let skippedCount = 0;
    
    for (const student of studentData) {
      try {
        // Check if student already exists by name, class, and school
        const existingStudent = await db
          .select()
          .from(students)
          .where(and(
            eq(students.name, student.name),
            eq(students.className, student.className),
            eq(students.schoolId, student.schoolId)
          ));
          
        if (existingStudent.length > 0) {
          console.log(`⏭️  Skipped existing: ${student.name} (Roll: ${student.rollNumber})`);
          skippedCount++;
          continue;
        }
        
        // Skip date processing to avoid insertion errors
        let dobFormatted = null;
        
        // Insert student with correct schema fields
        const insertData = {
          schoolId: student.schoolId,
          name: student.name,
          rollNumber: student.rollNumber,
          className: student.className,
          parentName: student.fatherName,
          contactNumber: student.phoneNumber || student.motherName,
          address: student.address || '',
          dateOfBirth: dobFormatted,
          gender: student.gender === 'female' ? 'female' : 'male',
          status: 'active',
          admissionDate: new Date(),
          createdBy: 5 // MohuramukhaAdmin user ID
        };
        
        console.log(`Inserting student: ${student.name}`);
        await db.insert(students).values(insertData);
        
        console.log(`✅ Added: ${student.name} (Roll: ${student.rollNumber})`);
        addedCount++;
        
      } catch (error) {
        console.error(`❌ Error adding ${student.name}:`, error.message);
      }
    }
    
    console.log('\n📊 Import Summary:');
    console.log(`✅ Successfully added: ${addedCount} students`);
    console.log(`⏭️  Skipped existing: ${skippedCount} students`);
    console.log(`📝 Total processed: ${studentData.length} students`);
    
    // Get final count
    const finalCount = await db
      .select()
      .from(students)
      .where(and(
        eq(students.className, 'Shupan'),
        eq(students.schoolId, 3)
      ));
      
    console.log(`\n🎯 Total Shupan class students in MJV: ${finalCount.length}`);
    console.log('Shupan student import (v2) completed');
    
  } catch (error) {
    console.error('Error processing Shupan students v2:', error);
  }
}

processShupanStudentsV2();