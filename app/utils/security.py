from passlib.context import CryptContext
from cryptography.fernet import Fernet, InvalidToken
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# --- Encryption for Database Secrets ---
# Ensure settings.ENCRYPTION_KEY is exactly 43 or 44 chars of base64
_fernet = None

def _get_fernet() -> Fernet:
    global _fernet
    if _fernet is None:
        try:
            _fernet = Fernet(settings.ENCRYPTION_KEY.encode('utf-8'))
        except ValueError as e:
            # Fallback for development if key is misconfigured
            _fernet = Fernet(Fernet.generate_key())
            print(f"WARNING: Invalid ENCRYPTION_KEY format. Using volatile memory key. Error: {e}")
    return _fernet

def encrypt_secret(plain_text: str) -> str:
    """Encrypts a plaintext secret to a URL-safe base64-encoded encrypted string."""
    if not plain_text:
        return ""
    f = _get_fernet()
    return f.encrypt(plain_text.encode('utf-8')).decode('utf-8')

def decrypt_secret(encrypted_text: str) -> str:
    """Decrypts a URL-safe base64-encoded encrypted string back to plaintext."""
    if not encrypted_text:
        return ""
    try:
        f = _get_fernet()
        return f.decrypt(encrypted_text.encode('utf-8')).decode('utf-8')
    except InvalidToken:
        return "" # If decryption fails, return empty
