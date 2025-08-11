import ExcelJS from 'exceljs';
import { db } from '../server/db.js';
import { students } from '../shared/schema.js';
import { eq, and } from 'drizzle-orm';

async function processClass2Students() {
  console.log('Processing Class 2 students for MJV...');

  try {
    console.log('Reading Excel data...');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('attached_assets/class 2_1754913012156.xlsx');
    
    const worksheet = workbook.worksheets[0];
    const studentData = [];
    
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header
      
      const values = row.values;
      if (!values || values.length < 2) return;
      
      const studentInfo = {
        rollNumber: String(values[1] || '').trim(),
        name: String(values[2] || '').trim(),
        fatherName: String(values[3] || '').trim(),
        motherName: String(values[4] || '').trim(),
        dob: values[5] || null,
        gender: String(values[6] || '').toLowerCase().trim(),
        address: String(values[7] || '').trim(),
        phoneNumber: String(values[8] || '').trim(),
        className: 'II',
        section: 'A',
        schoolId: 3
      };
      
      if (studentInfo.name && studentInfo.rollNumber) {
        studentData.push(studentInfo);
      }
    });
    
    console.log(`Found ${studentData.length} Class 2 students to process`);
    
    let addedCount = 0;
    let skippedCount = 0;
    
    for (const student of studentData) {
      try {
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
        
        const insertData = {
          schoolId: student.schoolId,
          name: student.name,
          rollNumber: student.rollNumber,
          className: student.className,
          parentName: student.fatherName,
          contactNumber: student.phoneNumber || student.motherName,
          address: student.address || '',
          dateOfBirth: null,
          gender: student.gender === 'female' ? 'female' : 'male',
          status: 'active',
          admissionDate: new Date(),
          createdBy: 5
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
    
    const finalCount = await db
      .select()
      .from(students)
      .where(and(
        eq(students.className, 'II'),
        eq(students.schoolId, 3)
      ));
      
    console.log(`\n🎯 Total Class II students in MJV: ${finalCount.length}`);
    console.log('Class 2 student import completed');
    
  } catch (error) {
    console.error('Error processing Class 2 students:', error);
  }
}

processClass2Students();