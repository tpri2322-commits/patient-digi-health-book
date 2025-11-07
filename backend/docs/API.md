# API Documentation

## Base URL
```
http://localhost:8000/api
```

## Authentication

All endpoints (except registration, login, and password reset) require JWT authentication.

Include the token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Endpoints

### Authentication (`/api/auth/`)

#### Register
- **POST** `/api/auth/register/`
- **Body:**
```json
{
  "email": "patient@example.com",
  "mobile_number": "+1234567890",
  "full_name": "John Doe",
  "role": "PATIENT",
  "password": "securepassword",
  "password_confirm": "securepassword"
}
```

#### Verify OTP
- **POST** `/api/auth/verify-otp/`
- **Body:**
```json
{
  "email": "patient@example.com",
  "otp_code": "123456",
  "purpose": "REGISTRATION"
}
```

#### Login
- **POST** `/api/auth/login/`
- **Body:**
```json
{
  "email": "patient@example.com",
  "password": "securepassword"
}
```

#### Get Profile
- **GET** `/api/auth/profile/`
- **Headers:** `Authorization: Bearer <token>`

#### Update Profile
- **PUT** `/api/auth/profile/`
- **Headers:** `Authorization: Bearer <token>`
- **Body:** (partial update allowed)
```json
{
  "full_name": "John Doe Updated",
  "date_of_birth": "1990-01-01",
  "gender": "MALE",
  "blood_group": "O+"
}
```

#### Change Password
- **POST** `/api/auth/change-password/`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
```json
{
  "old_password": "oldpassword",
  "new_password": "newpassword",
  "new_password_confirm": "newpassword"
}
```

### Medical Records (`/api/records/`)

#### List Records
- **GET** `/api/records/`
- **Headers:** `Authorization: Bearer <token>`
- **Query Params:** `?document_type=PRESCRIPTION&is_archived=false&search=doctor`

#### Upload Record
- **POST** `/api/records/`
- **Headers:** `Authorization: Bearer <token>`
- **Body:** (multipart/form-data)
```
file: <file>
document_type: PRESCRIPTION
source_doctor: Dr. Smith
date_of_record: 2025-01-15
notes: Optional notes
```

#### Get Record Detail
- **GET** `/api/records/<record_id>/`
- **Headers:** `Authorization: Bearer <token>`

#### Update Record
- **PUT** `/api/records/<record_id>/`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
```json
{
  "source_doctor": "Dr. Smith Updated",
  "notes": "Updated notes"
}
```

#### Delete Record
- **DELETE** `/api/records/<record_id>/`
- **Headers:** `Authorization: Bearer <token>`

#### Archive Record
- **POST** `/api/records/<record_id>/archive/`
- **Headers:** `Authorization: Bearer <token>`

### Sharing (`/api/sharing/`)

#### Create Share Token
- **POST** `/api/sharing/tokens/`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
```json
{
  "record_ids": ["uuid1", "uuid2"],
  "share_method": "QR_CODE",
  "expiry_hours": 24,
  "max_access_count": 5
}
```

#### List Share Tokens
- **GET** `/api/sharing/tokens/`
- **Headers:** `Authorization: Bearer <token>`

#### Revoke Share Token
- **DELETE** `/api/sharing/tokens/<token_id>/`
- **Headers:** `Authorization: Bearer <token>`

#### Get QR Code Image
- **GET** `/api/sharing/tokens/<token_id>/qr-code/`
- **Headers:** `Authorization: Bearer <token>`

#### Scan QR Code (Doctor)
- **POST** `/api/sharing/scan/`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
```json
{
  "encrypted_token": "encrypted_token_from_qr_code"
}
```

#### Access via URL (Doctor)
- **GET** `/api/sharing/access/<token_id>/`
- **Headers:** `Authorization: Bearer <token>`

#### List Saved Patients (Doctor)
- **GET** `/api/sharing/saved-patients/`
- **Headers:** `Authorization: Bearer <token>`

#### Save Patient (Doctor)
- **POST** `/api/sharing/saved-patients/`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
```json
{
  "patient": "patient_uuid",
  "consultation_notes": "Patient notes"
}
```

### Admin Dashboard (`/api/admin/`)

#### Get Statistics
- **GET** `/api/admin/statistics/`
- **Headers:** `Authorization: Bearer <token>`
- **Requires:** Super Admin role

#### List Users
- **GET** `/api/admin/users/`
- **Headers:** `Authorization: Bearer <token>`
- **Requires:** Super Admin role

#### Get User Detail
- **GET** `/api/admin/users/<user_id>/`
- **Headers:** `Authorization: Bearer <token>`
- **Requires:** Super Admin role

#### Activate User
- **POST** `/api/admin/users/<user_id>/activate/`
- **Headers:** `Authorization: Bearer <token>`
- **Requires:** Super Admin role

#### Reset User Password
- **POST** `/api/admin/users/<user_id>/reset-password/`
- **Headers:** `Authorization: Bearer <token>`
- **Requires:** Super Admin role
- **Body:**
```json
{
  "new_password": "newpassword"
}
```

#### Get Patient Records
- **GET** `/api/admin/users/<patient_id>/records/`
- **Headers:** `Authorization: Bearer <token>`
- **Requires:** Super Admin role

#### Get Audit Trail
- **GET** `/api/admin/audit-trail/<patient_uuid>/`
- **Headers:** `Authorization: Bearer <token>`
- **Requires:** Super Admin role

