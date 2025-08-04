#!/usr/bin/env python3
"""
Secure Key Generator for Prayas Platform
Generates AES-256 encryption keys and JWT secrets compatible with Node.js crypto system.
"""

import os
import secrets
import base64
from typing import Tuple

ENV_PATH = ".env"

def generate_aes256_key() -> str:
    """
    Generate a secure AES-256 key (32 bytes = 256 bits).
    Returns hex-encoded string compatible with Node.js crypto.
    """
    return secrets.token_hex(32)  # 32 bytes = 64 hex characters

def generate_jwt_secret(length: int = 64) -> str:
    """
    Generate a secure JWT secret key.
    Returns base64url-encoded string for maximum compatibility.
    """
    return base64.urlsafe_b64encode(secrets.token_bytes(length)).decode().rstrip('=')

def read_env_file(env_path: str) -> dict:
    """Read existing .env file and parse key-value pairs."""
    if not os.path.exists(env_path):
        return {}
    
    env_vars = {}
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                if '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key.strip()] = value.strip().strip('"\'')
    
    return env_vars

def write_keys_to_env(aes_key: str, jwt_secret: str, env_path: str = ENV_PATH) -> None:
    """
    Save AES and JWT secret keys to .env file, preserving existing variables.
    Uses Node.js compatible variable names: ENCRYPTION_KEY and JWT_SECRET.
    """
    # Read existing .env content
    existing_env = read_env_file(env_path)
    
    # Update with new keys (using Node.js compatible names)
    existing_env['ENCRYPTION_KEY'] = aes_key
    existing_env['JWT_SECRET'] = jwt_secret
    
    # Write back to file
    with open(env_path, 'w', encoding='utf-8') as f:
        for key, value in existing_env.items():
            f.write(f"{key}={value}\n")

def validate_keys(aes_key: str, jwt_secret: str) -> list:
    """Validate generated keys meet security requirements."""
    issues = []
    
    # AES key should be 64 hex characters (32 bytes)
    if len(aes_key) != 64:
        issues.append(f"AES key length: {len(aes_key)} (expected 64)")
    
    if not all(c in '0123456789abcdefABCDEF' for c in aes_key):
        issues.append("AES key contains non-hex characters")
    
    # JWT secret should be at least 32 characters
    if len(jwt_secret) < 32:
        issues.append(f"JWT secret too short: {len(jwt_secret)} (minimum 32)")
    
    return issues

def generate_keys() -> Tuple[str, str]:
    """Generate both AES-256 and JWT keys."""
    aes_key = generate_aes256_key()
    jwt_secret = generate_jwt_secret(64)  # 64 bytes for extra security
    return aes_key, jwt_secret

def main():
    """Main function to generate and save encryption keys."""
    print("🔐 Generating secure encryption keys for Prayas platform...\n")
    
    # Generate keys
    aes256_key, jwt_secret_key = generate_keys()
    
    # Validate keys
    issues = validate_keys(aes256_key, jwt_secret_key)
    if issues:
        print("❌ Key validation failed:")
        for issue in issues:
            print(f"  - {issue}")
        return False
    
    # Save to .env
    try:
        write_keys_to_env(aes256_key, jwt_secret_key)
        print("✅ Keys generated and saved successfully!\n")
        
        # Display key information (for verification)
        print("Generated Keys:")
        print("==============")
        print(f"ENCRYPTION_KEY: {aes256_key}")
        print(f"JWT_SECRET: {jwt_secret_key[:16]}...[hidden]")
        print(f"\n📁 Keys saved to: {ENV_PATH}")
        
        # Security recommendations
        print("\n🛡️  Security Recommendations:")
        print("  - Keep your .env file secure and never commit it to version control")
        print("  - Use different keys for production and development environments") 
        print("  - Rotate keys periodically for maximum security")
        print("  - Backup keys securely before rotation")
        
        return True
        
    except Exception as error:
        print(f"❌ Failed to save keys: {error}")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)