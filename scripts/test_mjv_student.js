import fetch from 'node-fetch';

async function testAddStudent() {
  const baseUrl = 'http://localhost:5000';
  
  const testStudent = {
    name: 'TEST STUDENT MJV',
    fatherName: 'Test Father',
    motherName: 'Test Mother',
    className: 'TEST',
    stream: '',
    rollNumber: '999',
    admissionNumber: 'TEST001',
    dateOfBirth: '2020-01-01T00:00:00.000Z',
    gender: 'Male',
    category: 'General',
    religion: 'Hindu',
    address: 'Test Address',
    phoneNumber: '9999999999',
    admissionDate: '2025-04-01T00:00:00.000Z',
    academicYear: '2025-26',
    status: 'active',
    schoolId: 3 // MJV school ID
  };

  try {
    console.log('Adding test student to MJV (School ID 3)...');
    const response = await fetch(`${baseUrl}/api/schools/3/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testStudent)
    });
    
    const result = await response.text();
    console.log('Response status:', response.status);
    console.log('Response:', result);
    
    if (response.ok) {
      // Check if student appears in MJV
      console.log('\nChecking MJV students...');
      const mjvStudentsResponse = await fetch(`${baseUrl}/api/schools/3/students`);
      const mjvStudents = await mjvStudentsResponse.json();
      console.log('MJV students count:', mjvStudents.length);
      
      if (mjvStudents.length > 0) {
        console.log('Latest MJV student:', mjvStudents[mjvStudents.length - 1].fullName);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testAddStudent();