#!/usr/bin/env node

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const ENV_PATH = '.env';

/**
 * Generate a secure random key of specified byte length.
 * Returns hex-encoded string (suitable for AES-256).
 */
function generateSecureKey(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a secure JWT secret.
 * Returns base64-encoded string.
 */
function generateJWTSecret(length = 64) {
  return crypto.randomBytes(length).toString('base64url');
}

/**
 * Read existing .env file and parse key-value pairs
 */
function readEnvFile(envPath) {
  if (!fs.existsSync(envPath)) {
    return {};
  }
  
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  });
  
  return env;
}

/**
 * Write keys to .env file, preserving existing variables
 */
function writeKeysToEnv(aesKey, jwtSecret, envPath = ENV_PATH) {
  // Read existing .env content
  const existingEnv = readEnvFile(envPath);
  
  // Update with new keys
  existingEnv.ENCRYPTION_KEY = aesKey;
  existingEnv.JWT_SECRET = jwtSecret;
  
  // Convert back to .env format
  const envContent = Object.entries(existingEnv)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n') + '\n';
  
  // Write to file
  fs.writeFileSync(envPath, envContent, 'utf8');
}

/**
 * Validate generated keys meet security requirements
 */
function validateKeys(aesKey, jwtSecret) {
  const issues = [];
  
  // AES key should be 64 hex characters (32 bytes)
  if (aesKey.length !== 64) {
    issues.push(`AES key length: ${aesKey.length} (expected 64)`);
  }
  
  if (!/^[a-f0-9]+$/i.test(aesKey)) {
    issues.push('AES key contains non-hex characters');
  }
  
  // JWT secret should be at least 32 characters
  if (jwtSecret.length < 32) {
    issues.push(`JWT secret too short: ${jwtSecret.length} (minimum 32)`);
  }
  
  return issues;
}

function main() {
  console.log('🔐 Generating secure encryption keys for Prayas platform...\n');
  
  // Generate keys
  const aes256Key = generateSecureKey(32); // 32 bytes = 256 bits
  const jwtSecretKey = generateJWTSecret(64); // 64 bytes for extra security
  
  // Validate keys
  const issues = validateKeys(aes256Key, jwtSecretKey);
  if (issues.length > 0) {
    console.error('❌ Key validation failed:');
    issues.forEach(issue => console.error(`  - ${issue}`));
    process.exit(1);
  }
  
  // Save to .env
  try {
    writeKeysToEnv(aes256Key, jwtSecretKey);
    console.log('✅ Keys generated and saved successfully!\n');
    
    // Display key information (for verification)
    console.log('Generated Keys:');
    console.log('==============');
    console.log(`ENCRYPTION_KEY: ${aes256Key}`);
    console.log(`JWT_SECRET: ${jwtSecretKey.substring(0, 16)}...[hidden]`);
    console.log(`\n📁 Keys saved to: ${ENV_PATH}`);
    
    // Security recommendations
    console.log('\n🛡️  Security Recommendations:');
    console.log('  - Keep your .env file secure and never commit it to version control');
    console.log('  - Use different keys for production and development environments');
    console.log('  - Rotate keys periodically for maximum security');
    console.log('  - Backup keys securely before rotation');
    
  } catch (error) {
    console.error('❌ Failed to save keys:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateSecureKey, generateJWTSecret, writeKeysToEnv, validateKeys };