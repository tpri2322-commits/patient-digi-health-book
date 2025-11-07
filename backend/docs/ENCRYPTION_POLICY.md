# Encryption Policy

## Overview

The Personal Medical Record Keeping App implements multiple layers of encryption to ensure the security and privacy of medical records.

## Encryption Methods

### 1. File Encryption (AES-256)

Medical records are encrypted using AES-256 encryption before storage.

**Implementation:**
- Uses Fernet (symmetric encryption) from the `cryptography` library
- Each file is encrypted with a unique encryption key
- Encryption key is derived from the master encryption key stored in environment variables
- Files are encrypted before upload to cloud storage (AWS S3)

**Key Management:**
- Master encryption key stored in `ENCRYPTION_KEY` environment variable
- Key must be 32 bytes (256 bits) for AES-256
- Keys should be rotated periodically in production

### 2. QR Code Token Encryption (RSA-2048)

Share tokens embedded in QR codes are encrypted using RSA-2048 encryption.

**Implementation:**
- Uses RSA public-key cryptography
- Public key encrypts the token data
- Private key (stored securely on server) decrypts the token
- Token contains: patient UUID, record IDs, expiry timestamp

**Key Management:**
- RSA key pair generated using 2048-bit keys
- Private key stored securely (file system or key management service)
- Public key used for encryption, private key for decryption
- Keys can be stored in files specified by `RSA_PRIVATE_KEY_PATH` and `RSA_PUBLIC_KEY_PATH`

### 3. Secure URL Tokens

Share tokens for URL-based sharing are stored encrypted in the database.

**Implementation:**
- Token data encrypted with RSA before storage
- Token ID used in URL (not the encrypted data)
- Server decrypts token on access

## Token Structure

Share tokens contain the following data (encrypted):

```json
{
  "patient_uuid": "uuid-string",
  "record_ids": ["uuid1", "uuid2"],
  "expires_at": "2025-01-16T12:00:00Z",
  "created_at": "2025-01-15T12:00:00Z"
}
```

## Security Best Practices

1. **Key Storage:**
   - Never commit encryption keys to version control
   - Use environment variables or secure key management services
   - Rotate keys periodically

2. **Token Expiry:**
   - Default expiry: 24 hours
   - Configurable per share token
   - Maximum expiry: 7 days

3. **Access Control:**
   - Tokens can be revoked by patients
   - Access count limits can be set
   - All access events are logged

4. **Transport Security:**
   - All API communications should use HTTPS
   - JWT tokens for authentication
   - Secure file upload/download

## Compliance

This encryption policy is designed to comply with:
- HIPAA (Health Insurance Portability and Accountability Act)
- GDPR (General Data Protection Regulation)
- Other applicable healthcare data protection regulations

## Key Generation

### Generate AES-256 Key:
```python
from cryptography.fernet import Fernet
key = Fernet.generate_key()
# Store in ENCRYPTION_KEY environment variable
```

### Generate RSA Key Pair:
```python
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048,
)
public_key = private_key.public_key()

# Save private key
with open('private_key.pem', 'wb') as f:
    f.write(private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    ))

# Save public key
with open('public_key.pem', 'wb') as f:
    f.write(public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    ))
```

