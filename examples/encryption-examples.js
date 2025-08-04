/**
 * AES-256 Encryption Examples for Prayas Platform
 * 
 * The platform includes a robust AES-256-GCM encryption system
 * available at server/encryption.ts
 */

// Example usage in your application:

// 1. Import the encryption functions
import { encryptData, decryptData, hashSensitiveData } from '../server/encryption.ts';

// 2. Encrypt sensitive user data
const sensitiveUserData = {
  creditCard: "4532-1234-5678-9012",
  ssn: "123-45-6789",
  personalNotes: "Private information"
};

// Encrypt the data before storing in database
const encryptedData = encryptData(JSON.stringify(sensitiveUserData));
console.log('Encrypted:', encryptedData);

// 3. Decrypt when needed
const decryptedData = JSON.parse(decryptData(encryptedData));
console.log('Decrypted:', decryptedData);

// 4. Hash passwords (one-way)
const password = "userPassword123";
const hashedPassword = hashSensitiveData(password);
console.log('Hashed password:', hashedPassword);

// 5. Use cases in Prayas platform:
// - Encrypt student personal information in school records
// - Encrypt payment information before storing
// - Encrypt sensitive documents before upload
// - Encrypt user session data
// - Hash passwords for authentication

/**
 * Security Features:
 * ✓ AES-256-GCM (most secure AES variant)
 * ✓ Random IV for each encryption (prevents pattern attacks)
 * ✓ Authentication tag for data integrity verification
 * ✓ Additional Authenticated Data (AAD) for extra security
 * ✓ Proper error handling and validation
 * ✓ Environment variable key management
 */