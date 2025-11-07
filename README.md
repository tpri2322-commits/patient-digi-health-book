# Personal Medical Record Keeping App

A secure cloud-based medical record management system for patients and doctors.

## Project Structure

```
.
├── backend/          # Django backend API
├── frontend/         # React Native mobile apps
└── README.md
```

## Features

- **Patient Module**: Upload, manage, and share medical records securely
- **Doctor Module**: Scan QR codes to access patient records
- **Super Admin**: Web-based dashboard for system management
- **Security**: AES-256 encryption for files, RSA-2048 for tokens
- **UUID-based**: Unique patient identification system

## Technology Stack

- **Backend**: Django (Python), PostgreSQL, AWS S3
- **Frontend**: React Native (Android & iOS)
- **Authentication**: JWT (Django REST Framework)
- **Notifications**: Firebase Cloud Messaging (FCM)

## Setup Instructions

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend
npm install
# For iOS
cd ios && pod install && cd ..
npm run ios
# For Android
npm run android
```

## Documentation

- [API Documentation](backend/docs/API.md)
- [Database Schema](backend/docs/DATABASE_SCHEMA.md)
- [Encryption Policy](backend/docs/ENCRYPTION_POLICY.md)
