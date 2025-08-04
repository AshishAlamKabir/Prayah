import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// Ensure required environment variables are present
if (!process.env.ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required');
}

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// Ensure the encryption key is exactly 32 bytes for AES-256
const encryptionKeyHex = process.env.ENCRYPTION_KEY;
let ENCRYPTION_KEY: Buffer;

if (encryptionKeyHex.length === 64) {
  // If it's already 64 hex characters, use it directly
  ENCRYPTION_KEY = Buffer.from(encryptionKeyHex, 'hex');
} else if (encryptionKeyHex.length === 32) {
  // If it's 32 characters, treat it as a string and hash it to get 32 bytes
  ENCRYPTION_KEY = Buffer.from(crypto.createHash('sha256').update(encryptionKeyHex).digest('hex').slice(0, 64), 'hex');
} else {
  // For any other length, create a proper 32-byte key
  ENCRYPTION_KEY = crypto.scryptSync(encryptionKeyHex, 'prayas-salt', 32);
}
const JWT_SECRET = process.env.JWT_SECRET;
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 16 bytes for AES
const TAG_LENGTH = 16; // 16 bytes for GCM tag

// Data encryption/decryption functions
export function encryptData(text: string): string {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    cipher.setAAD(Buffer.from('prayas-auth', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Combine iv + tag + encrypted data
    return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

export function decryptData(encryptedText: string): string {
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAAD(Buffer.from('prayas-auth', 'utf8'));
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

// JWT token functions
export interface JWTPayload {
  userId: number;
  username: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export function generateJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  try {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: '7d', // 7 days
      issuer: 'prayas-platform',
      audience: 'prayas-users'
    });
  } catch (error) {
    console.error('JWT generation error:', error);
    throw new Error('Failed to generate JWT token');
  }
}

export function verifyJWT(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'prayas-platform',
      audience: 'prayas-users'
    }) as JWTPayload;
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    } else {
      console.error('JWT verification error:', error);
      throw new Error('Failed to verify JWT token');
    }
  }
}

export function refreshJWT(token: string): string {
  try {
    const decoded = verifyJWT(token);
    // Remove timing claims to generate a fresh token
    const { iat, exp, ...payload } = decoded;
    return generateJWT(payload);
  } catch (error) {
    throw new Error('Cannot refresh invalid token');
  }
}

// Hash sensitive data (one-way)
export function hashSensitiveData(data: string): string {
  return crypto.createHash('sha256').update(data + JWT_SECRET).digest('hex');
}

// Generate secure random tokens
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

// Validate encryption system
export function validateEncryptionSystem(): boolean {
  try {
    const testData = 'test-encryption-validation';
    const encrypted = encryptData(testData);
    const decrypted = decryptData(encrypted);
    
    if (testData !== decrypted) {
      throw new Error('Encryption validation failed');
    }
    
    const testPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: 1,
      username: 'test',
      email: 'test@example.com',
      role: 'user'
    };
    
    const token = generateJWT(testPayload);
    const verified = verifyJWT(token);
    
    if (verified.userId !== testPayload.userId) {
      throw new Error('JWT validation failed');
    }
    
    console.log('✅ Encryption system validation successful');
    return true;
  } catch (error) {
    console.error('❌ Encryption system validation failed:', error);
    return false;
  }
}