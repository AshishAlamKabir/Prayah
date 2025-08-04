#!/usr/bin/env node

import fs from 'fs';
import { validateEncryptionSystem } from '../server/encryption.ts';

const ENV_PATH = '.env';

/**
 * Check if environment variables are properly set
 */
function checkEnvironmentVariables() {
  const required = ['ENCRYPTION_KEY', 'JWT_SECRET'];
  const missing = [];
  const present = [];
  
  for (const key of required) {
    if (process.env[key]) {
      present.push({
        key,
        length: process.env[key].length,
        preview: process.env[key].substring(0, 8) + '...'
      });
    } else {
      missing.push(key);
    }
  }
  
  return { missing, present };
}

/**
 * Analyze key strength and format
 */
function analyzeKeyStrength(key, value) {
  const analysis = {
    key,
    length: value.length,
    format: 'unknown',
    strength: 'weak'
  };
  
  if (key === 'ENCRYPTION_KEY') {
    if (value.length === 64 && /^[a-f0-9]+$/i.test(value)) {
      analysis.format = 'hex';
      analysis.strength = 'strong';
    } else if (value.length >= 32) {
      analysis.format = 'string';
      analysis.strength = 'medium';
    }
  } else if (key === 'JWT_SECRET') {
    if (value.length >= 64) {
      analysis.strength = 'strong';
    } else if (value.length >= 32) {
      analysis.strength = 'medium';
    }
    
    if (/^[A-Za-z0-9_-]+$/.test(value)) {
      analysis.format = 'base64url';
    } else {
      analysis.format = 'string';
    }
  }
  
  return analysis;
}

/**
 * Check .env file existence and content
 */
function checkEnvFile() {
  if (!fs.existsSync(ENV_PATH)) {
    return { exists: false, readable: false, content: null };
  }
  
  try {
    const content = fs.readFileSync(ENV_PATH, 'utf8');
    return { 
      exists: true, 
      readable: true, 
      content,
      lines: content.split('\n').length,
      size: content.length
    };
  } catch (error) {
    return { 
      exists: true, 
      readable: false, 
      error: error.message 
    };
  }
}

async function main() {
  console.log('🔍 Checking encryption key status for Prayas platform...\n');
  
  // Check .env file
  const envFile = checkEnvFile();
  console.log('📁 Environment File Status:');
  console.log(`   File exists: ${envFile.exists ? '✅' : '❌'}`);
  console.log(`   Readable: ${envFile.readable ? '✅' : '❌'}`);
  if (envFile.exists && envFile.readable) {
    console.log(`   Size: ${envFile.size} bytes`);
    console.log(`   Lines: ${envFile.lines}`);
  }
  console.log();
  
  // Check environment variables
  const { missing, present } = checkEnvironmentVariables();
  
  console.log('🔑 Required Environment Variables:');
  if (present.length > 0) {
    console.log('   Present:');
    present.forEach(({ key, length, preview }) => {
      console.log(`     ✅ ${key}: ${length} chars (${preview})`);
    });
  }
  
  if (missing.length > 0) {
    console.log('   Missing:');
    missing.forEach(key => {
      console.log(`     ❌ ${key}`);
    });
  }
  console.log();
  
  // Analyze key strength
  if (present.length > 0) {
    console.log('🛡️  Key Strength Analysis:');
    present.forEach(({ key }) => {
      const analysis = analyzeKeyStrength(key, process.env[key]);
      const strengthIcon = analysis.strength === 'strong' ? '🟢' : 
                          analysis.strength === 'medium' ? '🟡' : '🔴';
      console.log(`   ${strengthIcon} ${key}:`);
      console.log(`     Format: ${analysis.format}`);
      console.log(`     Length: ${analysis.length} characters`);
      console.log(`     Strength: ${analysis.strength}`);
    });
    console.log();
  }
  
  // Test encryption system
  console.log('🧪 Testing Encryption System:');
  try {
    const isValid = validateEncryptionSystem();
    if (isValid) {
      console.log('   ✅ Encryption system is working correctly');
      console.log('   ✅ AES-256-GCM encryption functional');
      console.log('   ✅ JWT token generation/verification working');
    } else {
      console.log('   ❌ Encryption system validation failed');
    }
  } catch (error) {
    console.log(`   ❌ Encryption system error: ${error.message}`);
  }
  console.log();
  
  // Recommendations
  console.log('💡 Recommendations:');
  if (missing.length > 0) {
    console.log('   🔧 Generate missing keys using:');
    console.log('      node scripts/generate-keys.js');
    console.log('      or');
    console.log('      python scripts/generate-keys.py');
  } else {
    const weakKeys = present.filter(({ key }) => {
      const analysis = analyzeKeyStrength(key, process.env[key]);
      return analysis.strength === 'weak';
    });
    
    if (weakKeys.length > 0) {
      console.log('   ⚠️  Consider regenerating weak keys for better security');
    } else {
      console.log('   ✅ All keys are properly configured');
      console.log('   🔒 Your encryption setup is production-ready');
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { checkEnvironmentVariables, analyzeKeyStrength, checkEnvFile };