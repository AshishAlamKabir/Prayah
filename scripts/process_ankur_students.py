#!/usr/bin/env python3
"""
Script to process Ankur student data from Excel file and add to MJV database
"""

import pandas as pd
import requests
import json
from datetime import datetime
import sys
import os

def process_ankur_excel():
    """Process the Ankur Excel file and extract student data"""
    try:
        # Read the Excel file
        excel_file = 'attached_assets/Ankur_1754753443064.xlsx'
        
        print(f"Processing Excel file: {excel_file}")
        
        # Try to read the Excel file
        try:
            df = pd.read_excel(excel_file)
        except Exception as e:
            print(f"Error reading Excel file: {e}")
            return None
            
        print(f"Found {len(df)} rows in the Excel file")
        print(f"Columns: {list(df.columns)}")
        
        # Display first few rows to understand the structure
        print("\nFirst 5 rows:")
        print(df.head())
        
        # Clean and process the data
        students = []
        
        for index, row in df.iterrows():
            try:
                # Map Excel columns to our student schema
                student_data = {
                    'fullName': str(row.get('Name', row.get('নাম', row.get('Student Name', '')))).strip(),
                    'fatherName': str(row.get('Father Name', row.get('বাপেকৰ নাম', row.get("Father's Name", '')))).strip(),
                    'motherName': str(row.get('Mother Name', row.get('মাকৰ নাম', row.get("Mother's Name", '')))).strip(),
                    'className': 'Ankur',  # All students in this file are Ankur class
                    'stream': '',  # Pre-primary doesn't have streams
                    'rollNumber': str(row.get('Roll No', row.get('Roll Number', row.get('ৰোল নং', index + 1)))),
                    'admissionNumber': str(row.get('Admission No', row.get('ভৰ্তি নং', f'ANK{index + 1:03d}'))),
                    'dateOfBirth': str(row.get('Date of Birth', row.get('জন্ম তাৰিখ', row.get('DOB', '2020-01-01')))),
                    'gender': str(row.get('Gender', row.get('লিংগ', row.get('Sex', 'Male')))).strip().title(),
                    'category': str(row.get('Category', row.get('শ্ৰেণী', 'General'))).strip(),
                    'religion': str(row.get('Religion', row.get('ধৰ্ম', 'Hindu'))).strip(),
                    'address': str(row.get('Address', row.get('ঠিকনা', 'Mahuramukh'))).strip(),
                    'phoneNumber': str(row.get('Phone', row.get('ফোন', row.get('Contact', '')))).strip(),
                    'admissionDate': '2025-04-01',  # Default admission date
                    'academicYear': '2025-26',
                    'status': 'active',
                    'bloodGroup': str(row.get('Blood Group', row.get('তেজৰ গ্ৰুপ', ''))).strip(),
                    'emergencyContact': str(row.get('Emergency Contact', row.get('জৰুৰীকালীন যোগাযোগ', ''))).strip(),
                    'schoolId': 3  # MJV school ID
                }
                
                # Clean empty strings and NaN values
                for key, value in student_data.items():
                    if pd.isna(value) or value == 'nan' or value == '':
                        if key in ['fullName', 'fatherName', 'motherName']:
                            student_data[key] = 'Unknown'
                        elif key in ['rollNumber', 'admissionNumber']:
                            student_data[key] = f'ANK{index + 1:03d}'
                        else:
                            student_data[key] = ''
                
                # Validate required fields
                if student_data['fullName'] != 'Unknown' and student_data['fullName'].strip():
                    students.append(student_data)
                    print(f"Processed student: {student_data['fullName']}")
                else:
                    print(f"Skipping row {index + 1} - missing name")
                    
            except Exception as e:
                print(f"Error processing row {index + 1}: {e}")
                continue
        
        print(f"\nProcessed {len(students)} valid students")
        return students
        
    except Exception as e:
        print(f"Error processing Excel file: {e}")
        return None

def add_students_to_database(students):
    """Add students to the database via API"""
    if not students:
        print("No students to add")
        return
    
    base_url = "http://localhost:5000"
    
    for student in students:
        try:
            response = requests.post(f"{base_url}/api/students", json=student)
            if response.status_code == 201:
                print(f"✓ Added student: {student['fullName']}")
            else:
                print(f"✗ Failed to add {student['fullName']}: {response.text}")
        except Exception as e:
            print(f"✗ Error adding {student['fullName']}: {e}")

if __name__ == "__main__":
    print("Ankur Student Data Processor")
    print("=" * 40)
    
    # Process the Excel file
    students = process_ankur_excel()
    
    if students:
        print(f"\nReady to add {len(students)} students to MJV database")
        
        # Ask for confirmation
        response = input("Do you want to proceed with adding these students? (y/n): ")
        if response.lower() == 'y':
            add_students_to_database(students)
            print("\nStudent import process completed!")
        else:
            print("Import cancelled")
            
            # Save to JSON for manual review
            with open('ankur_students_data.json', 'w', encoding='utf-8') as f:
                json.dump(students, f, indent=2, ensure_ascii=False)
            print("Student data saved to ankur_students_data.json for review")
    else:
        print("No valid student data found")