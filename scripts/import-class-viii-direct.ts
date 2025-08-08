import fs from 'fs';
import path from 'path';
import { db } from '../server/db';
import { students } from '../shared/schema';
import { eq, and } from 'drizzle-orm';

interface CSVRow {
  admission_no: string;
  roll_no: string;
  first_name: string;
  middlename: string;
  last_name: string;
  gender: string;
  date_of_birth: string;
  category: string;
  religion: string;
  caste: string;
  mobile_no: string;
  email: string;
  admission_date: string;
  blood_group: string;
  student_house: string;
  height: string;
  weight: string;
  measurement_date: string;
  father_name: string;
  father_phone: string;
  father_occupation: string;
  mother_name: string;
  mother_phone: string;
  mother_occupation: string;
  guardian_is: string;
  guardian_name: string;
  guardian_relation: string;
  guardian_email: string;
  guardian_phone: string;
  guardian_occupation: string;
  guardian_address: string;
  current_address: string;
  permanent_address: string;
  bank_account_no: string;
  bank_name: string;
  ifsc_code: string;
  national_identification_no: string;
}

function parseCSV(csvContent: string): CSVRow[] {
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1)
    .filter(line => line.trim())
    .map(line => {
      const values = line.split(',');
      const row: any = {};
      headers.forEach((header, index) => {
        row[header.trim()] = values[index] ? values[index].trim() : '';
      });
      return row as CSVRow;
    });
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;
  
  // Try different date formats
  const formats = [
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,  // DD/MM/YYYY or D/M/YYYY
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,   // YYYY-MM-DD
  ];
  
  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      if (format === formats[0]) {
        // DD/MM/YYYY format
        const day = parseInt(match[1]);
        const month = parseInt(match[2]);
        const year = parseInt(match[3]);
        
        // Basic validation
        if (day > 31 || month > 12 || year < 1900 || year > 2030) {
          console.log(`Invalid date components: ${dateStr}`);
          return null;
        }
        
        return new Date(year, month - 1, day);
      } else {
        // YYYY-MM-DD format
        return new Date(dateStr);
      }
    }
  }
  
  console.log(`Could not parse date: ${dateStr}`);
  return null;
}

function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove any non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Return cleaned phone number
  return cleaned;
}

function combineNames(firstName: string, middleName: string, lastName: string): string {
  const parts = [firstName, middleName, lastName]
    .filter(part => part && part.trim() !== '')
    .map(part => part.trim());
  
  return parts.join(' ');
}

function normalizeGender(gender: string): string {
  const g = gender.toLowerCase().trim();
  if (g.startsWith('f')) return 'Female';
  if (g.startsWith('m')) return 'Male';
  return 'Not Specified';
}

async function importStudents(): Promise<void> {
  try {
    console.log('🔄 Starting direct import of Class VIII students for BJV...');
    
    // Read CSV file
    const csvPath = path.join(process.cwd(), 'attached_assets', 'VIII_1754677505226.csv');
    
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found: ${csvPath}`);
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const rows = parseCSV(csvContent);
    
    console.log(`📊 Found ${rows.length} rows in CSV data`);
    
    let successCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    
    const schoolId = 1; // BJV school ID
    const className = "VIII";
    const createdBy = 1; // Admin user ID
    
    for (const row of rows) {
      try {
        // Skip empty rows
        if (!row.roll_no || row.roll_no.trim() === '') {
          continue;
        }
        
        const rollNumber = row.roll_no.trim();
        const fullName = combineNames(row.first_name, row.middlename, row.last_name);
        
        if (!fullName) {
          console.log(`⚠️ Skipping row with empty name, roll: ${rollNumber}`);
          continue;
        }
        
        // Check for duplicates
        const existingStudent = await db
          .select()
          .from(students)
          .where(
            and(
              eq(students.schoolId, schoolId),
              eq(students.className, className),
              eq(students.rollNumber, rollNumber)
            )
          )
          .limit(1);
        
        if (existingStudent.length > 0) {
          console.log(`🔄 Duplicate found: ${fullName} (Roll: ${rollNumber})`);
          duplicateCount++;
          continue;
        }
        
        // Parse dates
        const dateOfBirth = parseDate(row.date_of_birth);
        const admissionDate = new Date(); // Current date as admission date
        
        // Determine parent contact info
        let parentName = '';
        let contactNumber = '';
        
        if (row.father_name && row.father_name.trim() !== '' && row.father_name !== 'XXXXXXXXXXX') {
          parentName = row.father_name.trim();
          contactNumber = formatPhoneNumber(row.father_phone || row.mobile_no);
        } else if (row.mother_name && row.mother_name.trim() !== '') {
          parentName = row.mother_name.trim();
          contactNumber = formatPhoneNumber(row.mother_phone || row.mobile_no);
        } else if (row.guardian_name && row.guardian_name.trim() !== '') {
          parentName = row.guardian_name.trim();
          contactNumber = formatPhoneNumber(row.guardian_phone || row.mobile_no);
        } else {
          contactNumber = formatPhoneNumber(row.mobile_no);
        }
        
        // Determine address
        let address = '';
        if (row.current_address && row.current_address.trim() !== '') {
          address = row.current_address.trim();
        } else if (row.permanent_address && row.permanent_address.trim() !== '') {
          address = row.permanent_address.trim();
        }
        
        // Insert student
        await db.insert(students).values({
          schoolId,
          name: fullName,
          rollNumber,
          className,
          stream: null,
          admissionDate,
          status: 'active',
          parentName: parentName || null,
          contactNumber: contactNumber || null,
          address: address || null,
          dateOfBirth,
          gender: normalizeGender(row.gender),
          previousSchool: null,
          remarks: row.blood_group ? `Blood Group: ${row.blood_group}` : null,
          createdBy,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        console.log(`✅ Added: ${fullName} (Roll: ${rollNumber})`);
        successCount++;
        
      } catch (rowError) {
        console.error(`❌ Error processing row ${row.roll_no}:`, rowError);
        errorCount++;
        continue;
      }
    }
    
    console.log('\n📈 Import Summary:');
    console.log(`   ✅ Successful imports: ${successCount}`);
    console.log(`   🔄 Duplicates skipped: ${duplicateCount}`);
    console.log(`   ❌ Failed imports: ${errorCount}`);
    
  } catch (error) {
    console.error('💥 Import failed:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    await importStudents();
    console.log('\n🎉 Class VIII student import completed!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Import failed:', error);
    process.exit(1);
  }
}

// Run the import
main();