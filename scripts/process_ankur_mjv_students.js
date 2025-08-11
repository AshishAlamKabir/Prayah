// Script to process Ankur class students for Mahuramukh Jatiya Vidyalaya (MJV)
import ExcelJS from 'exceljs';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { students } from '../shared/schema.ts';
import { eq, and } from 'drizzle-orm';

// Initialize database connection
const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function processAnkurStudents() {
  console.log('Processing Ankur class students for MJV...');

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('attached_assets/Ankur_1754900911233.xlsx');
    
    const worksheet = workbook.getWorksheet(1);
    const studentData = [];
    
    console.log('Reading Excel data...');
    
    // Process each row (skip header row)
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header
      
      const values = row.values;
      if (!values || values.length < 3) return; // Skip empty rows
      
      // Extract student data based on typical Excel structure
      const studentInfo = {
        name: values[2]?.toString()?.trim() || '',
        rollNumber: values[1]?.toString()?.trim() || '',
        fatherName: values[3]?.toString()?.trim() || '',
        motherName: values[4]?.toString()?.trim() || '',
        dob: values[5] || null,
        gender: values[6]?.toString()?.trim()?.toLowerCase() || 'male',
        address: values[7]?.toString()?.trim() || '',
        phoneNumber: values[8]?.toString()?.trim() || '',
        admissionDate: values[9] || new Date(),
        className: 'Ankur',
        section: values[10]?.toString()?.trim() || 'A',
        schoolId: 3 // MJV school ID
      };
      
      // Validate required fields
      if (studentInfo.name && studentInfo.rollNumber) {
        studentData.push(studentInfo);
      }
    });
    
    console.log(`Found ${studentData.length} students to process`);
    
    if (studentData.length === 0) {
      console.log('No valid student data found in Excel file');
      return;
    }
    
    // Check for existing students and insert new ones
    let insertedCount = 0;
    let skippedCount = 0;
    
    for (const student of studentData) {
      try {
        // Check if student already exists
        const existingStudent = await db
          .select()
          .from(students)
          .where(
            and(
              eq(students.schoolId, student.schoolId),
              eq(students.rollNumber, student.rollNumber),
              eq(students.className, student.className)
            )
          )
          .limit(1);
        
        if (existingStudent.length > 0) {
          console.log(`⏭️  Skipping existing student: ${student.name} (Roll: ${student.rollNumber})`);
          skippedCount++;
          continue;
        }
        
        // Format dates properly
        let dobFormatted = null;
        if (student.dob) {
          try {
            if (student.dob instanceof Date) {
              dobFormatted = student.dob.toISOString().split('T')[0];
            } else if (typeof student.dob === 'string') {
              dobFormatted = new Date(student.dob).toISOString().split('T')[0];
            } else if (typeof student.dob === 'number') {
              // Excel serial date
              const excelEpoch = new Date(1900, 0, 1);
              const days = student.dob - 2; // Excel has a leap year bug
              const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
              dobFormatted = date.toISOString().split('T')[0];
            }
          } catch (e) {
            console.log(`Warning: Invalid DOB for ${student.name}, using null`);
            dobFormatted = null;
          }
        }
        
        let admissionDateFormatted = new Date().toISOString().split('T')[0];
        if (student.admissionDate) {
          try {
            if (student.admissionDate instanceof Date) {
              admissionDateFormatted = student.admissionDate.toISOString().split('T')[0];
            } else if (typeof student.admissionDate === 'string') {
              admissionDateFormatted = new Date(student.admissionDate).toISOString().split('T')[0];
            } else if (typeof student.admissionDate === 'number') {
              // Excel serial date
              const excelEpoch = new Date(1900, 0, 1);
              const days = student.admissionDate - 2;
              const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
              admissionDateFormatted = date.toISOString().split('T')[0];
            }
          } catch (e) {
            console.log(`Warning: Invalid admission date for ${student.name}, using current date`);
            admissionDateFormatted = new Date().toISOString().split('T')[0];
          }
        }
        
        // Insert student with correct schema fields
        const insertData = {
          schoolId: student.schoolId,
          name: student.name,
          rollNumber: student.rollNumber,
          className: student.className,
          parentName: student.fatherName,
          contactNumber: student.motherName, // Note: Mother's name has phone number in data
          address: student.address || '',
          dateOfBirth: dobFormatted,
          gender: student.gender === 'female' ? 'female' : 'male',
          status: 'active',
          admissionDate: new Date(), // Required field - use current date
          createdBy: 5 // MohuramukhaAdmin user ID
        };
        
        console.log(`Inserting student: ${student.name}`);
        await db.insert(students).values(insertData);
        
        console.log(`✅ Added: ${student.name} (Roll: ${student.rollNumber})`);
        insertedCount++;
        
      } catch (error) {
        console.error(`❌ Error processing student ${student.name}:`, error.message);
      }
    }
    
    console.log('\n📊 Import Summary:');
    console.log(`✅ Successfully added: ${insertedCount} students`);
    console.log(`⏭️  Skipped existing: ${skippedCount} students`);
    console.log(`📝 Total processed: ${studentData.length} students`);
    
    // Verify final count for MJV Ankur class
    const totalAnkurStudents = await db
      .select()
      .from(students)
      .where(
        and(
          eq(students.schoolId, 3),
          eq(students.className, 'Ankur')
        )
      );
    
    console.log(`\n🎯 Total Ankur class students in MJV: ${totalAnkurStudents.length}`);
    
  } catch (error) {
    console.error('Error processing Excel file:', error);
  }
}

// Run the import
processAnkurStudents().then(() => {
  console.log('Ankur student import completed');
  process.exit(0);
}).catch(error => {
  console.error('Import failed:', error);
  process.exit(1);
});