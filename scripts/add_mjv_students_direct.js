import { storage } from '../server/storage.js';
import fs from 'fs';
import path from 'path';

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

async function addMJVStudentsDirectly() {
  try {
    // Read all backup files and add students directly to database
    const backupFiles = [
      'ankur_students_backup.json',
      'kuhi_students_backup.json', 
      'sopan_students_backup.json',
      'class1_students_backup.json',
      'class2_students_backup.json',
      'class3_students_backup.json',
      'class4_students_backup.json',
      'class5_students_backup.json',
      'class6_students_backup.json',
      'class7_students_backup.json',
      'class8_students_backup.json'
    ];

    let totalAdded = 0;
    let totalErrors = 0;

    for (const backupFile of backupFiles) {
      const filePath = path.join(__dirname, backupFile);
      
      if (fs.existsSync(filePath)) {
        console.log(`\nProcessing ${backupFile}...`);
        
        try {
          const studentData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          
          for (const student of studentData) {
            try {
              // Ensure the student has schoolId 3 (MJV)
              const studentWithSchoolId = {
                ...student,
                schoolId: 3,
                createdBy: 1 // Admin user ID
              };
              
              await storage.addStudent(studentWithSchoolId);
              console.log(`✓ Added: ${student.fullName}`);
              totalAdded++;
            } catch (error) {
              console.log(`✗ Failed to add ${student.fullName}: ${error.message}`);
              totalErrors++;
            }
          }
        } catch (error) {
          console.log(`✗ Error reading ${backupFile}: ${error.message}`);
        }
      } else {
        console.log(`⚠ Backup file not found: ${backupFile}`);
      }
    }

    console.log(`\n=== FINAL SUMMARY ===`);
    console.log(`✓ Total students added: ${totalAdded}`);
    console.log(`✗ Total errors: ${totalErrors}`);
    
    // Verify by checking MJV student count
    const mjvStudents = await storage.getStudents(3);
    console.log(`🏫 MJV now has ${mjvStudents.length} students in database`);
    
  } catch (error) {
    console.error('Error in direct student addition:', error);
  }
}

addMJVStudentsDirectly();