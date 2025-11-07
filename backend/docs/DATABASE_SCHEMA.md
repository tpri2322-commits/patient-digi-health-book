# Database Schema

## Tables

### users
Custom user model with role-based fields.

**Fields:**
- `id` (UUID, Primary Key)
- `email` (EmailField, Unique)
- `mobile_number` (CharField, Unique)
- `full_name` (CharField)
- `role` (CharField: PATIENT, DOCTOR, SUPER_ADMIN)
- `patient_uuid` (UUID, Unique, Auto-generated for patients)
- `date_of_birth` (DateField, Optional)
- `gender` (CharField, Optional)
- `blood_group` (CharField, Optional)
- `allergies` (TextField, Optional)
- `chronic_conditions` (TextField, Optional)
- `specialization` (CharField, Optional, for doctors)
- `license_number` (CharField, Optional, for doctors)
- `is_active` (BooleanField)
- `is_staff` (BooleanField)
- `is_superuser` (BooleanField)
- `is_verified` (BooleanField)
- `created_at` (DateTimeField)
- `updated_at` (DateTimeField)

### otp_verifications
OTP verification for email/phone verification.

**Fields:**
- `id` (AutoField, Primary Key)
- `user` (ForeignKey -> users)
- `otp_code` (CharField)
- `purpose` (CharField: REGISTRATION, PASSWORD_RESET)
- `is_used` (BooleanField)
- `expires_at` (DateTimeField)
- `created_at` (DateTimeField)

### medical_records
Medical records uploaded by patients.

**Fields:**
- `id` (UUID, Primary Key)
- `patient` (ForeignKey -> users)
- `file` (FileField)
- `file_name` (CharField)
- `file_size` (BigIntegerField)
- `file_type` (CharField: pdf, jpg, png, jpeg)
- `document_type` (CharField: PRESCRIPTION, LAB_REPORT, SCAN, OTHER)
- `source_doctor` (CharField)
- `date_of_record` (DateField)
- `notes` (TextField, Optional)
- `is_encrypted` (BooleanField)
- `encryption_key_hash` (CharField, Optional)
- `is_archived` (BooleanField)
- `is_deleted` (BooleanField)
- `created_at` (DateTimeField)
- `updated_at` (DateTimeField)

### share_tokens
Tokens for sharing medical records via QR codes or URLs.

**Fields:**
- `id` (UUID, Primary Key)
- `patient` (ForeignKey -> users)
- `encrypted_token` (TextField)
- `share_method` (CharField: QR_CODE, URL)
- `expires_at` (DateTimeField)
- `is_revoked` (BooleanField)
- `max_access_count` (IntegerField, Optional)
- `current_access_count` (IntegerField)
- `created_at` (DateTimeField)
- `revoked_at` (DateTimeField, Optional)

**Relations:**
- Many-to-Many: `records` -> medical_records

### access_logs
Logs of doctor access to shared records.

**Fields:**
- `id` (UUID, Primary Key)
- `share_token` (ForeignKey -> share_tokens)
- `doctor` (ForeignKey -> users)
- `patient` (ForeignKey -> users)
- `ip_address` (GenericIPAddressField, Optional)
- `user_agent` (TextField, Optional)
- `accessed_at` (DateTimeField)

**Relations:**
- Many-to-Many: `accessed_records` -> medical_records

### saved_patients
Doctor's saved patient information.

**Fields:**
- `id` (UUID, Primary Key)
- `doctor` (ForeignKey -> users)
- `patient` (ForeignKey -> users)
- `consultation_notes` (TextField, Optional)
- `last_consultation_date` (DateTimeField, Optional)
- `saved_at` (DateTimeField)
- `updated_at` (DateTimeField)

**Unique Constraint:** (doctor, patient)

### doctor_notes
Doctor's notes for patients.

**Fields:**
- `id` (UUID, Primary Key)
- `doctor` (ForeignKey -> users)
- `patient` (ForeignKey -> users)
- `note_text` (TextField)
- `is_audio_transcript` (BooleanField)
- `is_shared_with_patient` (BooleanField)
- `created_at` (DateTimeField)
- `updated_at` (DateTimeField)

## Relationships

1. **User -> MedicalRecord**: One-to-Many (Patient has many records)
2. **User -> ShareToken**: One-to-Many (Patient creates many share tokens)
3. **ShareToken -> MedicalRecord**: Many-to-Many (Token shares multiple records)
4. **User -> AccessLog**: One-to-Many (Doctor has many access logs, Patient has many access logs)
5. **AccessLog -> MedicalRecord**: Many-to-Many (Log tracks multiple accessed records)
6. **User -> SavedPatient**: One-to-Many (Doctor saves many patients)
7. **User -> DoctorNote**: One-to-Many (Doctor creates many notes, Patient has many notes)

## Indexes

- `users.email` (Unique)
- `users.mobile_number` (Unique)
- `users.patient_uuid` (Unique)
- `medical_records(patient, document_type)`
- `medical_records(date_of_record)`
- `share_tokens(patient, is_revoked)`
- `share_tokens(expires_at)`
- `access_logs(doctor, accessed_at)`
- `access_logs(patient, accessed_at)`
- `saved_patients(doctor, saved_at)`
- `doctor_notes(doctor, patient, created_at)`

