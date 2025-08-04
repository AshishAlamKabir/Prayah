#!/usr/bin/env python
# coding: utf-8

# In[1]:


get_ipython().system('pip install python-dotenv')


# In[2]:


import os
import base64
from dotenv import set_key, load_dotenv

# File path to .env (change if needed)
ENV_PATH = ".env"

def generate_secure_key(length=32):
    """
    Generate a secure random key of specified byte length.
    Returns base64-encoded string (suitable for env variables).
    """
    return base64.urlsafe_b64encode(os.urandom(length)).decode()

def write_keys_to_env(aes_key: str, jwt_secret: str, env_path=ENV_PATH):
    """
    Save AES and JWT secret keys to a .env file.
    """
    # Create .env if it doesn't exist
    if not os.path.exists(env_path):
        open(env_path, 'w').close()

    load_dotenv(env_path)  # Load existing .env
    set_key(env_path, "AES256_KEY", aes_key)
    set_key(env_path, "JWT_SECRET_KEY", jwt_secret)

if __name__ == "__main__":
    # Step 1: Generate AES-256 and JWT keys (32-byte base64-encoded)
    aes256_key = generate_secure_key(32)
    jwt_secret_key = generate_secure_key(32)

    # Step 2: Save to .env
    write_keys_to_env(aes256_key, jwt_secret_key)

    # Output (for confirmation)
    print("AES-256 Key:", aes256_key)
    print("JWT Secret Key:", jwt_secret_key)
    print(f"Keys have been written to {ENV_PATH}")


# In[ ]:




