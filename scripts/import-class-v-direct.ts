#!/usr/bin/env tsx

/**
 * Direct database import script for Class V student data
 * This script bypasses the API and directly inserts into the database
 */

import { db } from '../server/db';
import { students, insertStudentSchema } from '../shared/schema';
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
  father_name: string;
  father_phone: string;
  mother_name: string;
  mother_phone: string;
  current_address: string;
  permanent_address: string;
  blood_group: string;
  [key: string]: string;
}

// Raw CSV data for Class V students
const csvData = `admission_no,roll_no,first_name,middlename,last_name,gender,date_of_birth,category,religion,caste,mobile_no,email,admission_date,blood_group,student_house,height,weight,measurement_date,father_name,father_phone,father_occupation,mother_name,mother_phone,mother_occupation,guardian_is,guardian_name,guardian_relation,guardian_email,guardian_phone,guardian_occupation,guardian_address,current_address,permanent_address,bank_account_no,bank_name,ifsc_code,national_identification_no,local
,1,Tonushree,,Borman,Female,9/9/2015,,Hindu,OBC,6003171076,,,AB+,,,,,Subhas Borman,,,Indira Borman,,,,,,,,,,,"Kolakhuwa, Bokakhat",,,,,,,,,7.94279E+11
,2,Debangaraj,,Gogoi,Male,27/4/2014,,Hindu,OBC,6003776128,,,A+,,,,,Punaram Gogoi ,,,Nabanita Gogoi ,,,,,,,,,,,2 no Gomariguri,,,,,,,,,9.46467E+11
,3,Baivabi ,,Hazarika,Female,9/11/2014,,Hindu,SC,9101217224,,,,,,,,Sourav Hazarika,,,Sikhamoni Hazarika,,,,,,,,,,,3 no ward Bokakhat,,,,,,,,,9.32357E+11
,4,Nabanita,,Saikia,Female,19/09/2015,,Hindu,Genaral,7002786243,,,B+,,,,,Sanjay Saikia,,,Jugamaya Saikia,,,,,,,,,,,"Kolakhuwa, Bokakhat",,,,,,,,,4.35455E+11
,5,Dimpi ,,Devi,Female,24/5/2015,,Hindu,OBC,9707275033,,,,,,,,Puspa Nath,,,Juri Nath,,,,,,,,,,,"Milonpur, bokakhat",,,,,,,,,5.25949E+11
,6,Debashree ,,Boruah,Female,8/7/2015,,Hindu,Genaral,8876289438,,,B+,,,,,Lt. Amorjyoti Boruah, ,,Lipika Bordoloi,,,,,,,,,,,"Jyotipur, Bokakhat",,,,,,,,,
,7,Modhusmita ,,Bora,Female,15/2/2015,,Hindu,Genaral,9395253108,,,O+,,,,,Luku Bora,,,Mitu Bora,,,,,,,,,,,"Kolakhuwa, Bokakhat",,,,,,,,,8.02971E+11
,8,Madhurjya ,,Nath,Male,26/7/2015,,Hindu,OBC,7896684245,,,,,,,,Dulal Nath,,,Priyanka Nath,,,,,,,,,,,"Milonpur, bokakhat",,,,,,,,,8.47166E+11
,9,Nayana,,Saikia,Female,22/7/2015,,Hindu,Genaral,9395069120,,,,,,,,Prabin Saikia,,,Dipanjali Saikia,,,,,,,,,,,"Kolakhuwa, Bokakhat",,,,,,,,,3.29083E+11
,10,Abhijit ,,Kheria,Male,25/2/2013,,Hindu,OBC,9957969604,,,,,,,,Bisuwa Kheria,,,Anjali Kheria,,,,,,,,,,,"Koilakhat, Bokakhat",,,,,,,,,9.51074E+11
,11,Bina ,,Kardong,Female,,,Hindu,ST P,6000132922,,,,,,,,Neheru Kardong ,,,Dipika Kardong,,,,,,,,,,,"Bamungaon , Bokakhat",,,,,,,,,2.88119E+11
,12,Ankit ,,Chetry,Male,25/9/2014,,Hindu,OBC,9957258075,,,,,,,,Monuj Chetry ,,,Renu Chetry ,,,,,,,,,,,Ward 1 Bokakaht,,,,,,,,,6.33365E+11
,13,Ayushman ,,Hazarika,Male,23/3/2015,,Hindu,OBC,6000702596,,,,,,,,Kushal Hazarika,,,Kabyashree Hazarika,,,,,,,,,,,"Koilakhat, Bokakhat",,,,,,,,,9.46462E+11
,14,Riyanpal ,,Bora,Male,18/3/2016,,Hindu,Genaral,9101488494,,,,,,,,Ritupan Bora,,,Rumi Bora,,,,,,,,,,,"Koroiati , Bokakhat",,,,,,,,,7.3058E+11
,15,Meghranjan ,,Nath,Male,19/10/2014,,Hindu,OBC,9101461016,,,,,,,,Dhiren Nath,,,Kobita Nath,,,,,,,,,,,2 no Ward Bokakhat,,,,,,,,,9.63177E+11
,16,Aditya ,Ranjan ,Kurmi,Male,28/7/2014,,Hindu,OBC,9613071008,,,,,,,,Prasanta Kurmi ,,,Swarasati Kurmi,,,,,,,,,,,"Borjuri, Bokakhat",,,,,,,,,8.07116E+11
,17,Ansuman ,,Patgiri,Male,11/7/2015,,Hindu,ST P,9365119954,,,O+,,,,,Uday Bhaskar Patgiri,,,Sonali Patgiri,,,,,,,,,,,"Dhubaati, Beloguri, Bokakhat",,,,,,,,,9.47559E+11
,18,Biplob ,,Chetry,Male,30/01/2015,,Hindu,OBC,8822900763,,,B+,,,,,Bikram Chetry ,,,Kalpona Chetry ,,,,,,,,,,,Ward 1 Bokakaht,,,,,,,,,5.30764E+11
,19,Nikita ,,Kalita,Female,28/9/2014,,Hindu,Genaral,9101951733,,,,,,,,Biswajit Kalita,,,Bhaswati Deka Kalita,,,,,,,,,,,"BDM road , Boakakhat",,,,,,,,,5.37465E+11
,20,Lakhmipriya ,,Nath,Female,1/10/2015,,Hindu,OBC,9957148328,,,O+,,,,,Jugen Nath,,,Purabi Bora Nath,,,,,,,,,,,"Balijan, Amtenga, Bokakhat",,,,,,,,,2.57967E+11
,21,Goutam ,,Gogoi,Male,24/4/2014,,Hindu,OBC,6901383454,,,A+,,,,,Pranab Gogoi ,,,Jushna Pathak gogoi,,,,,,,,,,,"Diffolo Pothar , bokakhat",,,,,,,,,7.83714E+11
,22,Anurag ,,Bori ,Male,14/2/2014,,Hindu,ST P,9387348895,,,,,,,,Pranjal Bori ,,,Binita Bori,,,,,,,,,,,"Afala Gaon , Mohura",,,,,,,,,3.46277E+11
,23,Kasmita ,,Panika,Female,6/10/2015,,Hindu,OBC,8822771880,,,O+,,,,,Dipak Panika,,,Uma Panika,,,,,,,,,,,Latabari Ahom Gaon ,,,,,,,,,4.22411E+11
,24,Mrinal ,,Saikia,Male,11/9/2015,,Hindu,OBC,6003853399,,,,,,,,Abinash Saikia,,,Janmoni Saikia,,,,,,,,,,,Sapjuri Bangali Gaon ,,,,,,,,,6.08061E+11
,25,Preetinada,,Phukan ,Female,31/3/2015,,Hindu,OBC,9085687087,,,O+,,,,,Utpal Phukan ,,,Bornali Saikia,,,,,,,,,,,"Lokowjan, Bokakhat",,,,,,,,,4.2469E+11
,26,Kanjan ,,Gogoi ,Male,13/7/2013,,Hindu,OBC,9435729723,,,O+,,,,,Bokul Gogoi,,,Pompi Gogoi,,,,,,,,,,,"Mohmaiki mandal Gaon, Bokakhat",,,,,,,,,5.30314E+11
,27,Pankaj ,,Pegu ,Male,23/4/2014,,Hindu,ST P,6000794242,,,,,,,,Kukil Pegu ,,,Bobita Pegu,,,,,,,,,,,Garmurh Bortika ,,,,,,,,,3.82238E+11
,28,Trinayan ,,Dutta,Male,26/9/2014,,Hindu,Genaral,8761069746,,,,,,,,Ranjan Dutta,,,Junmoni Dutta,,,,,,,,,,,Jugania ati Khotiakholi ,,,,,,,,,8.07318E+11
,29,Rocktutpal,,Dutta,Male,20/2/2014,,Hindu,Genaral,9101069943,,,AB+,,,,,Pankaj Dutta,,,Bornali Neog Dutta,,,,,,,,,,,"Khotiakholi, Bokakhat",,,,,,,,,4.27269E+11
,30,Lokhipal ,,Kaman ,Male,15/3/2013,,Hindu,ST P,8688006309,,,,,,,,Samufra Kaman ,,,Ribamoni Kaman ,,,,,,,,,,,"Atula Gon , Bokakhat",,,,,,,,,8.69132E+11
,31,Borasha,,Das,Female,25/6/2014,,Hindu,SC,9101850764,,,,,,,,Diganta Das,,,Mousumi Das,,,,,,,,,,,Milonpur Bokakhat,,,,,,,,,8.42761E+11
,32,Dibyajyoti ,,Charo,Male,24/3/2014,,Hindu,ST P,8822878297,,,,,,,,Lakhman Charo,,,Jyotika Charo,,,,,,,,,,,2no Bohikhuwa Bokakhat,,,,,,,,,7.17944E+11
,33,Akash ,,Gogoi ,Male,4/8/2014,,Hindu,OBC,9954121092,,,,,,,,Tutu Gogoi ,,,Bijumoni Gogoi,,,,,,,,,,,"Kakajuri, Panbari",,,,,,,,,2.84072E+11
,34,Bhargab ,,Saikia,Male,22/10/2015,,Hindu,OBC,7896930326,,,,,,,,Gopal Saikia,,,Madhabi Saikia,,,,,,,,,,,"Tamulipathar Borjuri, Bokakhat",,,,,,,,,3.37411E+11
,35,Tonaya ,,Bora,Female,1/10/2015,,Hindu,Genaral,6001058040,,,,,,,,Ajit Bora ,,,Mousumi Bora,,,,,,,,,,,Sapjuri Bangali Gaon ,,,,,,,,,6.80185E+11
,36,Krishna ,,Doley,Female,16/01/2015,,Hindu,ST P,8072736108,,,,,,,,Rupam Doley,,,Jun Doley ,,,,,,,,,,,Panbari Mising Gaon ,,,,,,,,,69233276410
,37,Dibyajyoti ,,Bora,Male,27/7/2013,,Hindu,OBC,8486771045,,,,,,,,Jugal Bora,,,Junali Bora,,,,,,,,,,,Ahom Gaon Borjuri ,,,,,,,,,3.43638E+11
,38,Ananya ,,Bora,Female,24/11/2015,,Hindu,OBC,9365816483,,,,,,,,Dulal Bora,,,Lakhi Bora,,,,,,,,,,,"4 no Da Gaon , Bokakhat",,,,,,,,,3.6634E+11
,39,Niharika ,,Mura ,Female,19/01/2015,,Hindu,OBC,8099110339,,,,,,,,Papu Mura,,,Tara Mura,,,,,,,,,,,"Kandhulimari,Borjuri",,,,,,,,,3.12077E+11
,40,Martina ,,Bori ,Female,31/12/2015,,Hindu,ST P,9365196609,,,,,,,,Dimpal Bori ,,,Runu Bori ,,,,,,,,,,,"Udoi Nagar, Bokakhat",,,,,,,,,4.51879E+11
,41,Chyanika ,,Saikia,Female,27/01/2015,,Hindu,OBC,9365621942,,,,,,,,Reba Saikia,,,Ratna Gogoi Saikia,,,,,,,,,,,"5 No Da Gaon , Bokakhat",,,,,,,,,5.40238E+11
,42,Bidyut ,,Saikia,Male,14/10/2013,,Hindu,Genaral,8473067574,,,,,,,,Prabin Bora ,,,Sangita Bora,,,,,,,,,,,"Koilakhat, Bokakhat",,,,,,,,,6.49052E+11
,43,Debajit ,,Das,Male,5/7/2013,,Hindu,SC,7086351598,,,,,,,,GhnaSyam Das,,,Junaki Das,,,,,,,,,,,"Panbari , Borjuri ",,,,,,,,,xxxxxxxx`;

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

function parseCSV(csvText: string): CSVRow[] {
  const lines = csvText.trim().split('\n');
  const headers = parseCSVLine(lines[0]);
  const result: CSVRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: any = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    result.push(row);
  }
  
  return result;
}

function cleanPhoneNumber(phoneStr: string): string | null {
  if (!phoneStr) return null;
  
  // Handle scientific notation
  if (phoneStr.includes('E+') || phoneStr.includes('e+')) {
    const num = parseFloat(phoneStr);
    phoneStr = num.toFixed(0);
  }
  
  // Remove all non-digits
  const cleaned = phoneStr.replace(/[^\d]/g, '');
  
  // Validate Indian phone number
  if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
    return cleaned;
  } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return cleaned.substring(1);
  } else if (cleaned.length > 10) {
    return cleaned.slice(-10);
  }
  
  return cleaned.length >= 6 ? cleaned : null;
}

function parseDateOfBirth(dateStr: string): Date | null {
  if (!dateStr || dateStr === '' || dateStr === 'xxx' || dateStr === 'xxxxxxxx') {
    return null;
  }
  
  try {
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (isNaN(date.getTime())) return null;
      return date;
    }
  } catch (error) {
    console.warn(`Failed to parse date: ${dateStr}`);
  }
  
  return null;
}

function mapRowToStudent(row: CSVRow): any {
  // Build full name
  const nameParts = [row.first_name, row.middlename, row.last_name]
    .filter(part => part && part.trim() !== '')
    .map(part => part.trim());
  
  const fullName = nameParts.join(' ');
  
  if (!fullName || !row.roll_no) {
    return null; // Skip invalid rows
  }
  
  // Clean contact number
  const contactNumber = cleanPhoneNumber(row.mobile_no || row.father_phone || row.mother_phone);
  
  // Parent name
  const parentName = (row.father_name || row.mother_name || '').trim();
  
  // Address
  const address = (row.current_address || row.permanent_address || '').trim();
  
  // Date of birth
  const dateOfBirth = parseDateOfBirth(row.date_of_birth);
  
  // Gender normalization
  let gender: string | null = null;
  if (row.gender) {
    const genderLower = row.gender.toLowerCase();
    if (genderLower.includes('female')) gender = 'female';
    else if (genderLower.includes('male')) gender = 'male';
  }
  
  return {
    schoolId: 1, // BJV school ID
    name: fullName,
    rollNumber: row.roll_no.toString(),
    className: 'V',
    stream: null,
    parentName: parentName || null,
    contactNumber: contactNumber,
    address: address || null,
    dateOfBirth: dateOfBirth,
    gender: gender,
    bloodGroup: row.blood_group || null,
    category: row.category || row.caste || null,
    religion: row.religion || null,
    previousSchool: null,
    admissionDate: new Date(),
    status: 'active',
    createdBy: 1 // Default to admin user
  };
}

async function checkForDuplicates(rollNumber: string, className: string, schoolId: number): Promise<boolean> {
  const existing = await db.select()
    .from(students)
    .where(
      and(
        eq(students.rollNumber, rollNumber),
        eq(students.className, className),
        eq(students.schoolId, schoolId)
      )
    );
  
  return existing.length > 0;
}

async function importStudents() {
  console.log('🔄 Starting direct import of Class V students for BJV...');
  
  try {
    // Parse CSV data
    const rows = parseCSV(csvData);
    console.log(`📊 Found ${rows.length} rows in CSV data`);
    
    let successCount = 0;
    let errorCount = 0;
    let duplicateCount = 0;
    const errors: string[] = [];
    
    // Process each row
    for (let i = 0; i < rows.length; i++) {
      try {
        const studentData = mapRowToStudent(rows[i]);
        
        if (!studentData) {
          console.log(`⚠️  Skipping invalid row ${i + 2}`);
          continue;
        }
        
        // Check for duplicates
        const isDuplicate = await checkForDuplicates(
          studentData.rollNumber,
          studentData.className,
          studentData.schoolId
        );
        
        if (isDuplicate) {
          duplicateCount++;
          console.log(`🔄 Duplicate found: ${studentData.name} (Roll: ${studentData.rollNumber})`);
          continue;
        }
        
        // Validate with schema
        const validatedData = insertStudentSchema.parse(studentData);
        
        // Insert into database
        await db.insert(students).values(validatedData);
        
        successCount++;
        console.log(`✅ Added: ${studentData.name} (Roll: ${studentData.rollNumber})`);
        
      } catch (error) {
        errorCount++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`Row ${i + 2}: ${errorMsg}`);
        console.log(`❌ Error on row ${i + 2}: ${errorMsg}`);
      }
    }
    
    console.log(`\n📈 Import Summary:`);
    console.log(`   ✅ Successful imports: ${successCount}`);
    console.log(`   🔄 Duplicates skipped: ${duplicateCount}`);
    console.log(`   ❌ Failed imports: ${errorCount}`);
    
    if (errors.length > 0) {
      console.log(`\n🚨 Errors:`);
      errors.slice(0, 10).forEach(error => console.log(`   - ${error}`));
      if (errors.length > 10) {
        console.log(`   ... and ${errors.length - 10} more errors`);
      }
    }
    
    return {
      total: rows.length,
      success: successCount,
      duplicates: duplicateCount,
      errors: errorCount,
      errorMessages: errors
    };
    
  } catch (error) {
    console.error('💥 Import failed:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    await importStudents();
    console.log('\n🎉 Class V student import completed!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Import failed:', error);
    process.exit(1);
  }
}

// Run the import
main();