import XLSX from 'xlsx';
import path from 'path';
import { db } from '../server/db';
import { students } from '../shared/schema';
import { eq, and } from 'drizzle-orm';

interface ExcelRow {
  admission_no?: string;
  roll_no?: string;
  first_name?: string;
  middlename?: string;
  last_name?: string;
  gender?: string;
  date_of_birth?: string;
  category?: string;
  religion?: string;
  caste?: string;
  mobile_no?: string;
  email?: string;
  admission_date?: string;
  blood_group?: string;
  student_house?: string;
  height?: string;
  weight?: string;
  measurement_date?: string;
  father_name?: string;
  father_phone?: string;
  father_occupation?: string;
  mother_name?: string;
  mother_phone?: string;
  mother_occupation?: string;
  guardian_is?: string;
  guardian_name?: string;
  guardian_relation?: string;
  guardian_email?: string;
  guardian_phone?: string;
  guardian_occupation?: string;
  guardian_address?: string;
  current_address?: string;
  permanent_address?: string;
  bank_account_no?: string;
  bank_name?: string;
  ifsc_code?: string;
  national_identification_no?: string;
  [key: string]: any; // For any additional columns
}

function parseDate(dateStr: string | number): Date | null {
  if (!dateStr) return null;
  
  // Handle Excel date numbers
  if (typeof dateStr === 'number') {
    // Excel dates are days since 1900-01-01 (with 1900 incorrectly treated as leap year)
    const excelEpoch = new Date(1900, 0, 1);
    const date = new Date(excelEpoch.getTime() + (dateStr - 2) * 24 * 60 * 60 * 1000);
    return date;
  }
  
  const dateString = String(dateStr).trim();
  if (!dateString) return null;
  
  // Try different date formats
  const formats = [
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,  // DD/MM/YYYY or D/M/YYYY
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,   // YYYY-MM-DD
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,   // DD-MM-YYYY
  ];
  
  for (const format of formats) {
    const match = dateString.match(format);
    if (match) {
      if (format === formats[0] || format === formats[2]) {
        // DD/MM/YYYY or DD-MM-YYYY format
        const day = parseInt(match[1]);
        const month = parseInt(match[2]);
        const year = parseInt(match[3]);
        
        // Basic validation
        if (day > 31 || month > 12 || year < 1900 || year > 2030) {
          console.log(`Invalid date components: ${dateString}`);
          return null;
        }
        
        return new Date(year, month - 1, day);
      } else {
        // YYYY-MM-DD format
        return new Date(dateString);
      }
    }
  }
  
  console.log(`Could not parse date: ${dateString}`);
  return null;
}

function formatPhoneNumber(phone: string | number): string {
  if (!phone) return '';
  
  // Convert to string and remove any non-digit characters
  const cleaned = String(phone).replace(/\D/g, '');
  
  // Return cleaned phone number
  return cleaned;
}

function combineNames(firstName?: string, middleName?: string, lastName?: string): string {
  const parts = [firstName, middleName, lastName]
    .filter(part => part && String(part).trim() !== '')
    .map(part => String(part).trim());
  
  return parts.join(' ');
}

function normalizeGender(gender?: string): string {
  if (!gender) return 'Not Specified';
  const g = String(gender).toLowerCase().trim();
  if (g.startsWith('f')) return 'Female';
  if (g.startsWith('m')) return 'Male';
  return 'Not Specified';
}

function safeString(value: any): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

async function importStudents(): Promise<void> {
  try {
    console.log('🔄 Starting direct import of SOPAN class students for BJV...');
    
    // Read Excel file
    const excelPath = path.join(process.cwd(), 'attached_assets', 'SOPAN_1754715559374.xlsx');
    
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0]; // Get first sheet
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (rawData.length < 2) {
      throw new Error('Excel file appears to be empty or has no data rows');
    }
    
    // Get headers from first row and normalize them
    const headers = (rawData[0] as string[]).map(h => 
      String(h).toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, '')
    );
    
    // Convert data rows to objects
    const rows: ExcelRow[] = rawData.slice(1).map((row: any[]) => {
      const obj: ExcelRow = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    }).filter(row => {
      // Filter out completely empty rows
      return Object.values(row).some(value => value !== null && value !== undefined && String(value).trim() !== '');
    });
    
    console.log(`📊 Found ${rows.length} data rows in Excel file`);
    console.log(`📋 Headers found: ${headers.join(', ')}`);
    
    let successCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    
    const schoolId = 1; // BJV school ID
    const className = "Sopan";
    const createdBy = 1; // Admin user ID
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      try {
        // Get roll number from various possible column names
        const rollNumber = safeString(
          row.roll_no || row.rollno || row.roll_number || row.roll || (i + 1)
        );
        
        if (!rollNumber) {
          console.log(`⚠️ Skipping row ${i + 1} with empty roll number`);
          continue;
        }
        
        // Get name from various possible column combinations
        const fullName = combineNames(
          row.first_name || row.firstname || row.name,
          row.middlename || row.middle_name,
          row.last_name || row.lastname || row.surname
        );
        
        if (!fullName) {
          console.log(`⚠️ Skipping row ${i + 1} with empty name, roll: ${rollNumber}`);
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
        const dateOfBirth = parseDate(row.date_of_birth || row.dob || row.birth_date);
        const admissionDate = parseDate(row.admission_date) || new Date(); // Current date as fallback
        
        // Determine parent contact info
        let parentName = '';
        let contactNumber = '';
        
        const fatherName = safeString(row.father_name || row.fathers_name);
        const motherName = safeString(row.mother_name || row.mothers_name);
        const guardianName = safeString(row.guardian_name);
        
        if (fatherName && fatherName !== 'XXXXXXXXXXX') {
          parentName = fatherName;
          contactNumber = formatPhoneNumber(row.father_phone || row.fathers_phone || row.mobile_no || row.phone);
        } else if (motherName) {
          parentName = motherName;
          contactNumber = formatPhoneNumber(row.mother_phone || row.mothers_phone || row.mobile_no || row.phone);
        } else if (guardianName) {
          parentName = guardianName;
          contactNumber = formatPhoneNumber(row.guardian_phone || row.mobile_no || row.phone);
        } else {
          contactNumber = formatPhoneNumber(row.mobile_no || row.phone || row.contact);
        }
        
        // Determine address
        const address = safeString(
          row.current_address || row.address || row.permanent_address || row.location
        );
        
        // Additional info for remarks
        const bloodGroup = safeString(row.blood_group);
        const category = safeString(row.category || row.caste);
        let remarks = '';
        if (bloodGroup) remarks += `Blood Group: ${bloodGroup}`;
        if (category && bloodGroup) remarks += `, Category: ${category}`;
        else if (category) remarks += `Category: ${category}`;
        
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
          gender: normalizeGender(row.gender || row.sex),
          previousSchool: null,
          remarks: remarks || null,
          createdBy,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        console.log(`✅ Added: ${fullName} (Roll: ${rollNumber})`);
        successCount++;
        
      } catch (rowError) {
        console.error(`❌ Error processing row ${i + 1}:`, rowError);
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
    console.log('\n🎉 SOPAN class student import completed!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Import failed:', error);
    process.exit(1);
  }
}

// Run the import
main();