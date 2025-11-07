"""
Utility functions for sharing and encryption
"""
import json
import base64
from datetime import datetime, timedelta
from django.conf import settings
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization
import qrcode
from io import BytesIO
import os


def generate_encryption_key():
    """Generate a 32-byte key for AES-256 encryption"""
    return Fernet.generate_key()


def encrypt_data(data, key=None):
    """Encrypt data using Fernet (AES-256)"""
    if key is None:
        key = settings.ENCRYPTION_KEY.encode() if settings.ENCRYPTION_KEY else generate_encryption_key()
    else:
        if isinstance(key, str):
            key = key.encode()
    
    f = Fernet(key)
    if isinstance(data, dict):
        data = json.dumps(data)
    if isinstance(data, str):
        data = data.encode()
    
    encrypted = f.encrypt(data)
    return encrypted.decode()


def decrypt_data(encrypted_data, key=None):
    """Decrypt data using Fernet"""
    if key is None:
        key = settings.ENCRYPTION_KEY.encode() if settings.ENCRYPTION_KEY else generate_encryption_key()
    else:
        if isinstance(key, str):
            key = key.encode()
    
    f = Fernet(key)
    decrypted = f.decrypt(encrypted_data.encode())
    return json.loads(decrypted.decode())


def generate_rsa_key_pair():
    """Generate RSA key pair for QR code encryption"""
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )
    public_key = private_key.public_key()
    
    return private_key, public_key


def load_rsa_keys():
    """Load RSA keys from file paths or generate new ones"""
    if settings.RSA_PRIVATE_KEY_PATH and os.path.exists(settings.RSA_PRIVATE_KEY_PATH):
        with open(settings.RSA_PRIVATE_KEY_PATH, 'rb') as f:
            private_key = serialization.load_pem_private_key(
                f.read(),
                password=None,
            )
        public_key = private_key.public_key()
    else:
        private_key, public_key = generate_rsa_key_pair()
    
    return private_key, public_key


def encrypt_with_rsa(data, public_key=None):
    """Encrypt data using RSA public key (hybrid approach for large data)"""
    if public_key is None:
        _, public_key = load_rsa_keys()
    
    if isinstance(data, dict):
        data = json.dumps(data)
    if isinstance(data, str):
        data = data.encode()
    
    # RSA has size limits (max ~214 bytes for 2048-bit with OAEP)
    # Use hybrid encryption: encrypt data with AES, then encrypt AES key with RSA
    max_rsa_size = 214  # Safe limit for 2048-bit RSA with OAEP
    
    if len(data) <= max_rsa_size:
        # Small data: encrypt directly with RSA
        try:
            encrypted = public_key.encrypt(
                data,
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None
                )
            )
            return base64.b64encode(encrypted).decode()
        except Exception as e:
            # If RSA encryption fails, fall back to AES
            print(f"RSA encryption failed, using AES fallback: {str(e)}")
            return encrypt_data(data)
    else:
        # Large data: use hybrid encryption (AES + RSA)
        # Generate a random AES key
        aes_key = Fernet.generate_key()
        f = Fernet(aes_key)
        
        # Encrypt data with AES
        encrypted_data = f.encrypt(data)
        
        # Encrypt AES key with RSA
        try:
            encrypted_key = public_key.encrypt(
                aes_key,
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None
                )
            )
            encrypted_key_b64 = base64.b64encode(encrypted_key).decode()
        except Exception as e:
            # If RSA key encryption fails, just use AES (less secure but functional)
            print(f"RSA key encryption failed, using AES only: {str(e)}")
            encrypted_key_b64 = base64.b64encode(aes_key).decode()
        
        # Return hybrid format: "RSA_ENCRYPTED_KEY:AES_ENCRYPTED_DATA"
        return f"{encrypted_key_b64}:{encrypted_data.decode()}"


def decrypt_with_rsa(encrypted_data, private_key=None):
    """Decrypt data using RSA private key (handles both direct RSA and hybrid encryption)"""
    if private_key is None:
        private_key, _ = load_rsa_keys()
    
    # Check if it's hybrid format (contains ':')
    if ':' in encrypted_data:
        # Hybrid encryption: "RSA_ENCRYPTED_KEY:AES_ENCRYPTED_DATA"
        try:
            parts = encrypted_data.split(':', 1)
            encrypted_key_b64 = parts[0]
            encrypted_data_aes = parts[1]
            
            # Decrypt AES key with RSA
            encrypted_key_bytes = base64.b64decode(encrypted_key_b64.encode())
            try:
                aes_key = private_key.decrypt(
                    encrypted_key_bytes,
                    padding.OAEP(
                        mgf=padding.MGF1(algorithm=hashes.SHA256()),
                        algorithm=hashes.SHA256(),
                        label=None
                    )
                )
            except Exception:
                # If RSA decryption fails, try using the key directly (AES-only fallback)
                aes_key = base64.b64decode(encrypted_key_b64.encode())
            
            # Decrypt data with AES
            f = Fernet(aes_key)
            decrypted = f.decrypt(encrypted_data_aes.encode())
            return json.loads(decrypted.decode())
        except Exception as e:
            # If hybrid decryption fails, try AES-only
            try:
                return decrypt_data(encrypted_data)
            except:
                raise ValueError(f"Failed to decrypt hybrid data: {str(e)}")
    else:
        # Direct RSA encryption (small data)
        try:
            encrypted_bytes = base64.b64decode(encrypted_data.encode())
            decrypted = private_key.decrypt(
                encrypted_bytes,
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None
                )
            )
            return json.loads(decrypted.decode())
        except Exception as e:
            # If RSA decryption fails, try AES fallback
            try:
                return decrypt_data(encrypted_data)
            except:
                raise ValueError(f"Failed to decrypt RSA data: {str(e)}")


def create_share_token_data(patient_uuid, record_ids, expiry_hours=24):
    """Create token data for sharing"""
    expires_at = datetime.utcnow() + timedelta(hours=expiry_hours)
    
    token_data = {
        'patient_uuid': str(patient_uuid),
        'record_ids': [str(rid) for rid in record_ids],
        'expires_at': expires_at.isoformat(),
        'created_at': datetime.utcnow().isoformat(),
    }
    
    return token_data


def generate_qr_code(data):
    """Generate QR code image from data"""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    return buffer


def create_share_url(token_id, base_url=None):
    """Create shareable URL for token"""
    if base_url is None:
        base_url = settings.ALLOWED_HOSTS[0] if settings.ALLOWED_HOSTS else 'localhost'
        if not base_url.startswith('http'):
            base_url = f'http://{base_url}'
    
    return f"{base_url}/api/sharing/access/{token_id}/"

