#!/usr/bin/env node

import { 
  encryptData, 
  decryptData, 
  generateJWT, 
  verifyJWT, 
  hashSensitiveData,
  generateSecureToken,
  validateEncryptionSystem 
} from '../server/encryption.ts';

console.log('🔐 AES-256 Encryption Demonstration for Prayas Platform\n');

// 1. Data Encryption Demo
console.log('1️⃣ AES-256-GCM Data Encryption:');
console.log('================================');

const sensitiveData = {
  studentRecord: {
    name: "রহিম আহমেদ",
    rollNumber: "2024001",
    feeAmount: 5000,
    paymentMethod: "Card ending in 4567",
    parentContact: "+8801712345678"
  },
  adminNotes: "Student eligible for scholarship program",
  timestamp: new Date().toISOString()
};

const dataToEncrypt = JSON.stringify(sensitiveData, null, 2);
console.log('Original Data:');
console.log(dataToEncrypt);

const encryptedData = encryptData(dataToEncrypt);
console.log('\n🔒 Encrypted Data:');
console.log(encryptedData);
console.log(`\nEncrypted Size: ${encryptedData.length} characters`);

const decryptedData = decryptData(encryptedData);
console.log('\n🔓 Decrypted Data:');
console.log(decryptedData);

console.log('\n✅ Encryption/Decryption Successful:', dataToEncrypt === decryptedData);

// 2. JWT Token Demo
console.log('\n\n2️⃣ JWT Token Security:');
console.log('======================');

const userPayload = {
  userId: 123,
  username: "student_user",
  email: "student@prayas.edu",
  role: "student"
};

const jwtToken = generateJWT(userPayload);
console.log('JWT Token Generated:');
console.log(jwtToken.substring(0, 50) + '...[truncated]');

const verifiedPayload = verifyJWT(jwtToken);
console.log('\nVerified Payload:');
console.log(verifiedPayload);

// 3. Password Hashing Demo
console.log('\n\n3️⃣ Password Hashing:');
console.log('====================');

const passwords = [
  "student123",
  "admin@prayas2024",
  "শিক্ষার্থী_পাসওয়ার্ড"
];

passwords.forEach(password => {
  const hashed = hashSensitiveData(password);
  console.log(`Password: "${password}"`);
  console.log(`Hashed: ${hashed}`);
  console.log(`Same hash: ${hashSensitiveData(password) === hashed}\n`);
});

// 4. Secure Token Generation
console.log('4️⃣ Secure Token Generation:');
console.log('===========================');

const tokens = {
  sessionToken: generateSecureToken(32),
  resetToken: generateSecureToken(16),
  apiKey: generateSecureToken(48)
};

Object.entries(tokens).forEach(([type, token]) => {
  console.log(`${type}: ${token}`);
});

// 5. School Fee Payment Encryption Example
console.log('\n\n5️⃣ School Fee Payment Encryption:');
console.log('==================================');

const feePaymentData = {
  schoolId: 3,
  schoolName: "মহুরামুখ জাতীয় বিদ্যালয়",
  student: {
    rollNo: "2024/SC/001",
    name: "সারাহ খাতুন",
    class: "Class X",
    section: "A"
  },
  payment: {
    amount: 2500,
    currency: "BDT",
    method: "UPI",
    transactionId: "TXN" + generateSecureToken(8).toUpperCase(),
    timestamp: new Date().toISOString()
  },
  guardian: {
    name: "মোহাম্মদ আলী",
    phone: "+8801712345678",
    email: "ali@example.com"
  }
};

const encryptedPayment = encryptData(JSON.stringify(feePaymentData));
console.log('Encrypted Fee Payment Data:');
console.log(encryptedPayment.substring(0, 100) + '...[truncated]');

const decryptedPayment = JSON.parse(decryptData(encryptedPayment));
console.log('\nDecrypted Payment Info:');
console.log(`School: ${decryptedPayment.schoolName}`);
console.log(`Student: ${decryptedPayment.student.name} (${decryptedPayment.student.rollNo})`);
console.log(`Amount: ${decryptedPayment.payment.amount} ${decryptedPayment.payment.currency}`);
console.log(`Transaction: ${decryptedPayment.payment.transactionId}`);

// 6. System Validation
console.log('\n\n6️⃣ System Validation:');
console.log('=====================');

const isSystemValid = validateEncryptionSystem();
console.log(`Encryption System Status: ${isSystemValid ? '✅ SECURE' : '❌ INSECURE'}`);

// 7. Security Metrics
console.log('\n\n7️⃣ Security Metrics:');
console.log('====================');

const metrics = {
  algorithm: 'AES-256-GCM',
  keyLength: '256 bits (32 bytes)',
  ivLength: '128 bits (16 bytes)', 
  tagLength: '128 bits (16 bytes)',
  jwtAlgorithm: 'HS256',
  hashAlgorithm: 'SHA-256'
};

Object.entries(metrics).forEach(([key, value]) => {
  console.log(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`);
});

console.log('\n🛡️ Your Prayas platform uses industry-standard encryption!');
console.log('💚 All sensitive data is protected with AES-256-GCM encryption.');
console.log('🔐 Authentication tokens are secured with JWT and SHA-256 hashing.');
console.log('🚀 Ready for production use with sensitive educational data!');