# Screens Documentation

## Patient Screens

### 1. RecordsListScreen (PatientHomeScreen)
**Path:** `src/screens/patient/RecordsListScreen.js`
**Navigation:** Main patient dashboard
**Features:**
- View all medical records
- Search records by name or doctor
- Filter by document type (Prescription, Lab Report, Scan, Other)
- Pull to refresh
- FAB button to upload new record
- Tap record to view details
- Menu options: View Details, Delete

### 2. UploadRecordScreen
**Path:** `src/screens/patient/UploadRecordScreen.js`
**Navigation:** From RecordsListScreen via FAB button
**Features:**
- Take photo with camera
- Pick file from device (PDF, images)
- Select document type
- Enter doctor/clinic name
- Set date of record
- Add optional notes
- Upload to backend

### 3. RecordDetailScreen
**Path:** `src/screens/patient/RecordDetailScreen.js`
**Navigation:** From RecordsListScreen by tapping a record
**Features:**
- View full record details
- Edit record metadata (doctor, date, notes)
- View/download file
- Archive/Unarchive record
- Share record
- Delete record

### 4. ShareRecordsScreen
**Path:** `src/screens/patient/ShareRecordsScreen.js`
**Navigation:** From RecordDetailScreen via Share button
**Features:**
- Select share method (QR Code or Secure URL)
- Set expiry time
- Generate QR code (displayed on screen)
- Generate secure URL
- Revoke share access
- View expiry information

## Doctor Screens

### 1. DoctorHomeScreen
**Path:** `src/screens/doctor/DoctorHomeScreen.js`
**Status:** Placeholder - needs QR scanner implementation

## Admin Screens

### 1. AdminDashboardScreen
**Path:** `src/screens/admin/AdminDashboardScreen.js`
**Status:** Placeholder - needs admin dashboard implementation

## Auth Screens

### 1. LoginScreen
**Path:** `src/screens/auth/LoginScreen.js`
**Features:** Email/password login

### 2. RegisterScreen
**Path:** `src/screens/auth/RegisterScreen.js`
**Features:** User registration with role selection

### 3. VerifyOTPScreen
**Path:** `src/screens/auth/VerifyOTPScreen.js`
**Features:** OTP verification with resend option

## Navigation Structure

```
AppNavigator (Root)
├── Auth Stack (when not authenticated)
│   ├── Login
│   ├── Register
│   └── VerifyOTP
│
├── Patient App (when authenticated as PATIENT)
│   └── PatientTabs
│       └── Records Tab
│           └── PatientStack
│               ├── RecordsList (main screen)
│               ├── UploadRecord
│               ├── RecordDetail
│               └── ShareRecords
│
├── Doctor App (when authenticated as DOCTOR)
│   └── DoctorTabs
│       └── Scan Tab
│
└── Admin App (when authenticated as SUPER_ADMIN)
    └── AdminDashboard
```

## How to Add Records

1. **From Patient Dashboard:**
   - Tap the **FAB (+)** button in the bottom right
   - Or tap "Upload Your First Record" if no records exist

2. **On Upload Screen:**
   - Tap "Take Photo" to capture with camera
   - Or tap "Choose File" to select from device
   - Select document type
   - Enter doctor/clinic name (required)
   - Set date (defaults to today)
   - Add optional notes
   - Tap "Upload Record"

3. **After Upload:**
   - Success message shown
   - Automatically returns to records list
   - New record appears in the list

