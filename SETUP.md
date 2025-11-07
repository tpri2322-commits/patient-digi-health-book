# Setup Guide

## Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL 12+
- Expo CLI (for React Native)
- AWS Account (optional, for S3 storage)

## Backend Setup

### 1. Create Virtual Environment

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- Database credentials
- Secret keys
- AWS S3 credentials (optional)
- Email settings

### 4. Generate Encryption Keys

Generate AES-256 encryption key:
```python
from cryptography.fernet import Fernet
key = Fernet.generate_key()
print(key.decode())  # Add this to ENCRYPTION_KEY in .env
```

Generate RSA key pair (optional, for QR code encryption):
```python
from sharing.utils import generate_rsa_key_pair
private_key, public_key = generate_rsa_key_pair()
# Save keys to files and update RSA_PRIVATE_KEY_PATH and RSA_PUBLIC_KEY_PATH
```

### 5. Setup Database

```bash
# Create PostgreSQL database
createdb medical_records

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

### 6. Run Development Server

```bash
python manage.py runserver
```

Backend will be available at `http://localhost:8000`

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure API URL

Edit `src/constants/api.js` and update `API_BASE_URL` if needed.

### 3. Run Development Server

```bash
# For iOS
npm run ios

# For Android
npm run android

# For web (development)
npm run web
```

## Testing

### Backend API Testing

Use tools like Postman or curl to test API endpoints. See `backend/docs/API.md` for endpoint documentation.

### Create Test Users

1. Register via API: `POST /api/auth/register/`
2. Verify OTP: `POST /api/auth/verify-otp/`
3. Login: `POST /api/auth/login/`

## Production Deployment

### Backend

1. Set `DEBUG=False` in `.env`
2. Configure proper `ALLOWED_HOSTS`
3. Use production database
4. Set up SSL/HTTPS
5. Configure AWS S3 for file storage
6. Set up proper encryption key management

### Frontend

1. Update `API_BASE_URL` to production API
2. Build for production:
   ```bash
   expo build:android
   expo build:ios
   ```

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify database exists

### Migration Issues
- Run `python manage.py makemigrations` if models changed
- Run `python manage.py migrate` to apply migrations

### Frontend Connection Issues
- Ensure backend is running
- Check CORS settings in `settings.py`
- Verify API_BASE_URL in frontend

## Next Steps

1. Implement email/SMS OTP sending
2. Add file encryption before upload
3. Implement push notifications
4. Add comprehensive error handling
5. Write unit tests
6. Set up CI/CD pipeline

